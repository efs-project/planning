// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

/// Additive physical codec, not a change to the roots0–15 compatibility family.
/// Root15 remains Solidity dynamic bytes; its zero cannot prove absence here.
library ReadSetStorage {
    bytes32 internal constant ROOT=keccak256("efs.lab.ledger.read-set-carriers/1");
    bytes32 internal constant PROFILE=keccak256("efs.lab.read-set-storage/2:root15-legacy-first:namespaced-stop-code:all-new");
    bytes32 private constant DOMAIN=keccak256("efs.lab.read-set/2:ordered-first-binding");
    struct Store { mapping(bytes32=>address) carriers; }
    error E_READSET_CARRIER();
    function store() private pure returns(Store storage s) {
        bytes32 root=ROOT;assembly("memory-safe"){s.slot:=root}
    }
    function retain(bytes32 key,bytes memory raw) internal {
        if(store().carriers[key]==address(0))store().carriers[key]=address(new ReadSetCode(raw));
    }
    function read(bytes32 key) internal view returns(bytes memory raw) {
        address carrier=store().carriers[key];
        if(carrier==address(0))return new bytes(0);
        bytes memory runtime=carrier.code;
        if(runtime.length<225||runtime.length>10593||runtime.length%32!=1||runtime[0]!=0
            ||keccak256(runtime)!=carrier.codehash)revert E_READSET_CARRIER();
        raw=new bytes(runtime.length-1);
        bytes memory qualified=new bytes(runtime.length+31);
        bytes32 domain=DOMAIN;
        uint256 offset;
        assembly("memory-safe") {
            mcopy(add(raw,32),add(runtime,33),mload(raw))
            offset:=mload(add(raw,32))
            // abi.encode(domain, rs): domain, offset64, then rs tuple payload.
            mstore(add(qualified,32),domain)
            mstore(add(qualified,64),64)
            mcopy(add(qualified,96),add(raw,64),sub(mload(raw),32))
        }
        if(offset!=32||keccak256(qualified)!=key)revert E_READSET_CARRIER();
    }
}

/// Constructor only. Runtime is STOP plus exact canonical ABI, never executable
/// dispatch or mutable storage. Creation/pointer share the publication rollback.
contract ReadSetCode {
    constructor(bytes memory raw) {
        bytes memory runtime=bytes.concat(hex"00",raw);
        assembly("memory-safe"){return(add(runtime,32),mload(runtime))}
    }
}
