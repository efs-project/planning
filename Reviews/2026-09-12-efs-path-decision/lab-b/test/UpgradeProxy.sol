// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;
import {Ledger} from "../src/Ledger.sol";
import {ExecutionSlots} from "../src/ExecutionSlots.sol";

/// DISPOSABLE TESTNET FIXTURE. Upgrade admin is fully trusted: matching declarations
/// do not prove safe code or a compatible compiler layout against a malicious admin.
/// No initialization delegatecall, arbitrary migration program, or production claim.
contract UpgradeProxy {
    address private immutable expectedRegistry;
    bytes32 private immutable expectedRegistryHash;
    bytes32 private immutable expectedRealm;
    address private immutable expectedLedgerAdmin;
    bytes32 private immutable expectedDomain;
    bytes32 private immutable expectedGuardedDomain;
    bytes32 private immutable expectedLayout;
    error E_UPGRADE_ADMIN();
    error E_UPGRADE_INCOMPATIBLE();
    error E_ETH_UNSUPPORTED();
    event Upgraded(address indexed implementation);
    event ExecutionChanged(bytes32 indexed executionSet, uint256 revision);

    constructor(Ledger initial) {
        if (address(initial).code.length == 0 || initial.implementationSelf() != address(initial)
            || initial.admin() != msg.sender) revert E_UPGRADE_INCOMPATIBLE();
        expectedRegistry = address(initial.registry());
        expectedRegistryHash = expectedRegistry.codehash;
        expectedRealm = initial.realmId();
        expectedLedgerAdmin = initial.admin();
        expectedDomain = initial.domainSeparator();
        expectedGuardedDomain = initial.guardedDomainSeparator();
        expectedLayout = initial.layoutId();
        if (expectedLayout != initial.LAYOUT_ID()) revert E_UPGRADE_INCOMPATIBLE();
        ExecutionSlots.initialize();
        ExecutionSlots.write(ExecutionSlots.ADMIN, uint160(msg.sender));
        ExecutionSlots.write(ExecutionSlots.IMPLEMENTATION, uint160(address(initial)));
    }

    function upgradeTo(Ledger next) external {
        if (msg.sender != address(uint160(ExecutionSlots.read(ExecutionSlots.ADMIN)))) revert E_UPGRADE_ADMIN();
        if (address(next).code.length == 0 || next.implementationSelf() != address(next)
            || address(next.registry()) != expectedRegistry || expectedRegistry.codehash != expectedRegistryHash
            || next.realmId() != expectedRealm || next.admin() != expectedLedgerAdmin
            || next.domainSeparator() != expectedDomain || next.guardedDomainSeparator() != expectedGuardedDomain
            || next.layoutId() != expectedLayout) revert E_UPGRADE_INCOMPATIBLE();
        ExecutionSlots.advance();
        ExecutionSlots.write(ExecutionSlots.IMPLEMENTATION, uint160(address(next)));
        emit Upgraded(address(next));
        emit ExecutionChanged(Ledger(address(this)).executionSet(), ExecutionSlots.read(ExecutionSlots.REVISION));
    }

    function implementation() external view returns (address) {
        return address(uint160(ExecutionSlots.read(ExecutionSlots.IMPLEMENTATION)));
    }
    /// This fixture is not an ETH custodian. Empty calls never delegate or retain funds.
    receive() external payable { revert E_ETH_UNSUPPORTED(); }
    fallback() external payable {
        address target = address(uint160(ExecutionSlots.read(ExecutionSlots.IMPLEMENTATION)));
        assembly ("memory-safe") {
            calldatacopy(0, 0, calldatasize())
            let ok := delegatecall(gas(), target, 0, calldatasize(), 0, 0)
            returndatacopy(0, 0, returndatasize())
            switch ok case 0 { revert(0, returndatasize()) } default { return(0, returndatasize()) }
        }
    }
}
