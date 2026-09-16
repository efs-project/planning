// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;
import {LabBase} from "./LabBase.sol";
import {Ledger} from "../src/Ledger.sol";
import {FailingIndexModule} from "../src/LabHarness.sol";

interface CarrierVm {
    function getNonce(address) external view returns(uint64);
    function etch(address,bytes calldata) external;
    function store(address,bytes32,bytes32) external;
}

/// Catches returning root15 zero as absence, missing dedup, unvalidated code,
/// and CREATE/pointer/evidence surviving a failed publication.
contract ReadSetCarrierTest is LabBase {
    bytes32 private constant ROOT = keccak256("efs.lab.ledger.read-set-carriers/1");
    function slot(bytes32 key) private pure returns(bytes32) { return keccak256(abi.encode(key,ROOT)); }
    function pointer(bytes32 key) private view returns(address) {
        return address(uint160(uint256(ledger.extsload(slot(key)))));
    }
    function reads(uint256 n,uint256 m) private view returns(Ledger.ReadSetV2 memory rs) {
        rs.principalIds=new bytes32[](n);rs.positions=new bytes32[](m);rs.expectedHeads=new bytes32[](n*m);
        for(uint256 i;i<n;i++)rs.principalIds[i]=bytes32(i+1);
        for(uint256 j;j<m;j++) {
            rs.positions[j]=bytes32(j+100);
            for(uint256 i;i<n;i++)rs.expectedHeads[j*n+i]=ledger.headSnapshot(rs.principalIds[i],rs.positions[j]);
        }
    }
    function publish(Ledger.ReadSetV2 memory rs,bytes32 salt) private {
        ledger.executeGuarded(one(aCreate(salt)),new bytes[](1),ledger.nonces(address(this)),ledger.executionSet(),rs);
    }
    function testLargeReadSetLivesInCarrierAndRepeatCreatesNothing() public {
        Ledger.ReadSetV2 memory rs=reads(64,4);bytes32 key=ledger.readSetHash(rs);
        publish(rs,bytes32("first"));address blob=pointer(key);
        require(blob!=address(0),"missing additive carrier");
        require(ledger.extsload(keccak256(abi.encode(key,uint256(15))))==0,"root15 reinterpreted");
        require(blob.code.length==10593&&keccak256(blob.code)==keccak256(bytes.concat(hex"00",abi.encode(rs))),"carrier bytes");
        require(keccak256(ledger.readSetBytes(key))==keccak256(abi.encode(rs)),"ABI changed");
        uint64 nonce=CarrierVm(address(vm)).getNonce(address(ledger));
        publish(rs,bytes32("second"));
        require(pointer(key)==blob&&CarrierVm(address(vm)).getNonce(address(ledger))==nonce,"duplicate CREATE");
    }
    function testUnknownAndCanonicalEmptyRemainDifferent() public {
        require(ledger.readSetBytes(bytes32("unknown")).length==0,"unknown fabricated");
        Ledger.ReadSetV2 memory rs=reads(0,0);publish(rs,bytes32("empty"));
        bytes memory raw=ledger.readSetBytes(ledger.readSetHash(rs));
        require(raw.length==224&&keccak256(raw)==keccak256(abi.encode(rs)),"empty preimage lost");
    }
    function testCorruptPrefixSizeAndHashCannotMasqueradeAsReadSet() public {
        Ledger.ReadSetV2 memory rs=reads(8,4);bytes32 key=ledger.readSetHash(rs);publish(rs,bytes32("corrupt"));
        address blob=pointer(key);require(blob!=address(0),"missing additive carrier");
        bytes memory code=blob.code;
        CarrierVm(address(vm)).etch(blob,hex"00");refused(key);
        code[0]=bytes1(uint8(1));CarrierVm(address(vm)).etch(blob,code);refused(key);
        code[0]=0;code[code.length-1]^=bytes1(uint8(1));CarrierVm(address(vm)).etch(blob,code);refused(key);
        CarrierVm(address(vm)).etch(blob,bytes.concat(hex"00",abi.encode(rs)));
        CarrierVm(address(vm)).store(address(ledger),slot(bytes32("wrong-key")),bytes32(uint256(uint160(blob))));refused(bytes32("wrong-key"));
    }
    function refused(bytes32 key) private view {
        (bool ok,)=address(ledger).staticcall(abi.encodeCall(ledger.readSetBytes,(key)));require(!ok,"corrupt carrier accepted");
    }
    function testRejectedPublicationRollsBackCarrierNoncePointerEvidenceAndAuthorNonce() public {
        ledger.setIndexModule(address(new FailingIndexModule()));
        Ledger.ReadSetV2 memory rs=reads(8,4);bytes32 key=ledger.readSetHash(rs);
        uint64 nonce=CarrierVm(address(vm)).getNonce(address(ledger));
        Ledger.Action[] memory a=one(aPublish(BINARY,hex"0102"));bytes[] memory b=new bytes[](1);b[0]=hex"0102";
        (bool ok,bytes memory err)=address(ledger).call(abi.encodeCall(ledger.executeGuarded,(a,b,uint64(0),ledger.executionSet(),rs)));
        require(!ok&&sel(err)==Ledger.E_INDEX.selector,"index did not fail");
        require(CarrierVm(address(vm)).getNonce(address(ledger))==nonce&&pointer(key)==address(0),"carrier rollback");
        require(ledger.nonces(address(this))==0&&ledger.publicationContext(1).principalId==0&&admissions()==0,"evidence rollback");
        require(ledger.readSetBytes(key).length==0,"failed read set retained");
    }
}

/// Full paid read, not a free eth_call or a prefix-only getter.
contract ReadSetPaidRead {
    bytes32 public digest;
    uint256 public length;
    function read(Ledger ledger,bytes32 key) external {
        bytes memory raw=ledger.readSetBytes(key);digest=keccak256(raw);length=raw.length;
    }
}
