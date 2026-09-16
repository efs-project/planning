// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

/// Lab-only configuration slots shared by Ledger and its disposable upgrade fixture.
/// EIP-1967 owns the implementation/admin slots; namespaced hash-minus-one slots
/// below never overlap Ledger's sequential roots 0..15.
library ExecutionSlots {
    bytes32 internal constant GENESIS = bytes32(uint256(keccak256("efs.lab.genesis-chain.v2")) - 1);
    bytes32 internal constant REVISION = bytes32(uint256(keccak256("efs.lab.execution-revision.v2")) - 1);
    bytes32 internal constant IMPLEMENTATION = bytes32(uint256(keccak256("eip1967.proxy.implementation")) - 1);
    bytes32 internal constant ADMIN = bytes32(uint256(keccak256("eip1967.proxy.admin")) - 1);
    bytes32 internal constant PUBLICATION_ACTIVE = bytes32(uint256(keccak256("efs.lab.publication-active.v1")) - 1);
    error E_PUBLICATION_ACTIVE();

    function requireIdle() internal view {
        if (read(PUBLICATION_ACTIVE) != 0) revert E_PUBLICATION_ACTIVE();
    }

    function read(bytes32 slot) internal view returns (uint256 value) {
        assembly ("memory-safe") { value := sload(slot) }
    }
    function write(bytes32 slot, uint256 value) internal {
        assembly ("memory-safe") { sstore(slot, value) }
    }
    function initialize() internal {
        assert(read(REVISION) == 0);
        write(GENESIS, block.chainid);
        write(REVISION, 1);
    }
    function advance() internal { write(REVISION, read(REVISION) + 1); }
}
