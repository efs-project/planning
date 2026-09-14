// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;
import {LabBase} from "./LabBase.sol";
import {Ledger} from "../src/Ledger.sol";

interface CostVm { function cool(address) external; }
/// EVM call costs, not whole-transaction receipts. Real Anvil receipts are a
/// separate integration gate. Each test starts with an unpopulated Ledger.
contract FoundationCostTest is LabBase {
    event log_named_uint(string key,uint256 value);
    function testCostLegacyCreate() public {
        Ledger.Action[] memory a = one(aCreate(bytes32("cost")));
        (Ledger.Intent memory i,bytes memory sig) = signed(PK_A,ledger,0,a);
        bytes memory callData = abi.encodeCall(ledger.executeSigned,(i,a,new bytes[](1),sig));
        measure(callData,"cold EVM call gas");
    }
    function testCostGuardedZero() public { guarded(0,0); }
    function testCostGuarded1x1() public { guarded(1,1); }
    function testCostGuarded8x1() public { guarded(8,1); }
    function testCostGuarded8x2() public { guarded(8,2); }
    function testCostGuarded32x2() public { guarded(32,2); }
    function testCostGuarded64x1() public { guarded(64,1); }
    function testCostGuarded64x2() public { guarded(64,2); }
    function testCostGuarded64x4() public { guarded(64,4); }
    function guarded(uint256 n,uint256 m) private {
        Ledger.ReadSetV2 memory rs;
        rs.principalIds = new bytes32[](n); rs.positions = new bytes32[](m); rs.expectedHeads = new bytes32[](n*m);
        for(uint256 x;x<n;++x) rs.principalIds[x] = bytes32(x+1);
        for(uint256 y;y<m;++y) rs.positions[y] = bytes32(y+100);
        for(uint256 x;x<n*m;++x) rs.expectedHeads[x] = keccak256(abi.encode(keccak256("efs.lab.head-snapshot/2"),uint8(0),uint32(0),uint64(0),bytes32(0)));
        Ledger.Action[] memory a = one(aCreate(bytes32("cost")));
        Ledger.IntentV2 memory i = Ledger.IntentV2(REALM,ledger.realmOrigin(),ledger.executionSet(),eoaA,0,uint64(block.timestamp+3600),
            ledger.acceptanceProfileOf(a),ledger.indexObligations(),ledger.readSetHash(rs));
        (uint8 v,bytes32 r,bytes32 s) = vm.sign(PK_A,ledger.guardedIntentDigest(i,keccak256(abi.encode(a))));
        bytes memory callData = abi.encodeCall(ledger.executeGuardedSigned,(i,a,new bytes[](1),rs,abi.encodePacked(r,s,v)));
        measure(callData,"cold EVM call gas");
        bytes memory retained = ledger.readSetBytes(i.readSetHash);
        require(keccak256(retained) == keccak256(abi.encode(rs)),"complete costed readset");
        emit log_named_uint("retained preimage bytes",retained.length);
        emit log_named_uint("readset allocated words incl length",1+(retained.length+31)/32);
        emit log_named_uint("guard event topic bytes",96);
        a[0] = aCreate(bytes32("cost-second"));
        i.nonce = 1;
        (v,r,s) = vm.sign(PK_A,ledger.guardedIntentDigest(i,keccak256(abi.encode(a))));
        callData = abi.encodeCall(ledger.executeGuardedSigned,(i,a,new bytes[](1),rs,abi.encodePacked(r,s,v)));
        measure(callData,"same-preimage second cold call gas");
        require(keccak256(ledger.readSetBytes(i.readSetHash)) == keccak256(retained),"dedup changed preimage");
    }
    function measure(bytes memory callData,string memory label) private {
        CostVm(address(vm)).cool(address(ledger)); CostVm(address(vm)).cool(address(index)); CostVm(address(vm)).cool(address(registry));
        uint256 beforeGas = gasleft();
        (bool ok,bytes memory result) = address(ledger).call(callData);
        uint256 used = beforeGas-gasleft();
        require(ok && result.length == 64,"costed call failed");
        emit log_named_uint(label,used);
        emit log_named_uint("calldata bytes",callData.length);
    }
}
