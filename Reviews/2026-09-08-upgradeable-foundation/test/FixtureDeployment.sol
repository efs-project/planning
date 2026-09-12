// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;
import {StateKernel} from "C0Core/StateKernel.sol";
import {PostingAccess} from "C0Core/PostingAccess.sol";
import {UpgradeStorage, FixtureEndpoint} from "../src/UpgradeStorage.sol";
import {UpgradeableFixtureCore} from "../src/UpgradeableFixtureCore.sol";
import {UpgradeableFixtureCarrier} from "../src/UpgradeableFixtureCarrier.sol";
import {
    TransparentUpgradeableProxy,
    ITransparentUpgradeableProxy
} from "@openzeppelin/contracts/proxy/transparent/TransparentUpgradeableProxy.sol";
import {ProxyAdmin} from "@openzeppelin/contracts/proxy/transparent/ProxyAdmin.sol";

/// @notice LOCAL TEST UTILITY, standing in for a batch-capable owner. Not production governance.
contract FixtureDeployment {
    address public immutable owner = msg.sender;
    address public core;
    address public carrier;
    address public coreAdmin;
    address public carrierAdmin;
    address public postingStore;
    bytes32 public postingStoreCodehash;
    uint32 public currentRevision;
    mapping(uint32 => UpgradeStorage.ExecutionSet) private revisions;
    error FixtureOwner();
    error FixtureDeploymentState();
    event FixtureExecutionActivated(uint32 indexed ordinal, bytes32 indexed executionSetId, uint64 activationBlock);
    modifier onlyOwner() {
        if (msg.sender != owner) revert FixtureOwner();
        _;
    }

    function deployPair(
        address coreImplementation,
        address carrierImplementation,
        address operator,
        bytes32 treeType,
        StateKernel.Init memory init
    ) external onlyOwner {
        if (core != address(0)) revert FixtureDeploymentState();
        // This single-use factory has made no CREATEs yet. Stock OZ requires
        // constructor initialization, before each proxy's own CREATE nonce 1 admin.
        core = address(uint160(uint256(keccak256(abi.encodePacked(hex"d694", address(this), hex"01")))));
        carrier = address(uint160(uint256(keccak256(abi.encodePacked(hex"d694", address(this), hex"02")))));
        coreAdmin = proxyAdminCreatedFirst(core);
        carrierAdmin = proxyAdminCreatedFirst(carrier);
        postingStore = UpgradeableFixtureCore(coreImplementation).postingStore();
        postingStoreCodehash = UpgradeableFixtureCore(coreImplementation).postingStoreCodehash();
        if (postingStore.code.length == 0 || postingStore.codehash != postingStoreCodehash
            || PostingAccess.writer(postingStore) != core) revert FixtureDeploymentState();
        address actualCore = address(
            new TransparentUpgradeableProxy(
                coreImplementation,
                address(this),
                abi.encodeCall(
                    UpgradeableFixtureCore.initialize, (address(this), carrier, coreAdmin, operator, treeType, init)
                )
            )
        );
        address actualCarrier = address(
            new TransparentUpgradeableProxy(
                carrierImplementation,
                address(this),
                abi.encodeCall(
                    UpgradeableFixtureCarrier.initialize, (address(this), core, carrierAdmin, operator, treeType)
                )
            )
        );
        if (actualCore != core || actualCarrier != carrier) revert FixtureDeploymentState();
        if (ProxyAdmin(coreAdmin).owner() != address(this) || ProxyAdmin(carrierAdmin).owner() != address(this)) {
            revert FixtureDeploymentState();
        }
        UpgradeStorage.ExecutionSet memory e;
        e.core = core;
        e.carrier = carrier;
        e.coreAdmin = coreAdmin;
        e.carrierAdmin = carrierAdmin;
        e.controller = address(this);
        e.operator = operator;
        e.treeType = treeType;
        e.helper = FixtureEndpoint(core).preparationHelper();
        e.helperCodehash = FixtureEndpoint(core).preparationCodehash();
        e.admissionLibrary = FixtureEndpoint(core).admissionLibrary();
        e.admissionCodehash = FixtureEndpoint(core).admissionCodehash();
        activate(e, coreImplementation, carrierImplementation);
    }

    /// @dev Source-derived CREATE nonce 1 address, not a fictitious proxy admin getter.
    function proxyAdminCreatedFirst(address proxy) public pure returns (address) {
        return address(uint160(uint256(keccak256(abi.encodePacked(hex"d694", proxy, hex"01")))));
    }

    function revisionAt(uint32 ordinal) external view returns (UpgradeStorage.ExecutionSet memory) {
        if (ordinal == 0 || ordinal > currentRevision) revert FixtureDeploymentState();
        return revisions[ordinal];
    }

    function upgradePair(
        address nextCore,
        address nextCarrier,
        bytes calldata coreMigration,
        bytes calldata carrierMigration
    ) external onlyOwner {
        if (currentRevision == 0) revert FixtureDeploymentState();
        UpgradeStorage.ExecutionSet memory e = revisions[currentRevision];
        ProxyAdmin(coreAdmin).upgradeAndCall(ITransparentUpgradeableProxy(core), nextCore, coreMigration);
        ProxyAdmin(carrierAdmin).upgradeAndCall(ITransparentUpgradeableProxy(carrier), nextCarrier, carrierMigration);
        activate(e, nextCore, nextCarrier);
    }

    function activate(UpgradeStorage.ExecutionSet memory e, address nextCore, address nextCarrier) private {
        if (currentRevision == type(uint32).max || block.number > type(uint64).max) revert FixtureDeploymentState();
        e.ordinal = currentRevision + 1;
        e.activationBlock = uint64(block.number);
        e.activationAdmissionHigh = UpgradeableFixtureCore(core).counts().admissions;
        e.coreImplementation = nextCore;
        e.carrierImplementation = nextCarrier;
        e.coreCodehash = nextCore.codehash;
        e.carrierCodehash = nextCarrier.codehash;
        if (UpgradeableFixtureCore(core).postingStore() != postingStore
            || UpgradeableFixtureCore(core).postingStoreCodehash() != postingStoreCodehash
            || postingStore.codehash != postingStoreCodehash || PostingAccess.writer(postingStore) != core)
            revert FixtureDeploymentState();
        e.coreConfiguration = UpgradeStorage.postingConfiguration(
            UpgradeStorage.expectedConfiguration(e, true), postingStore, postingStoreCodehash);
        e.carrierConfiguration = UpgradeStorage.expectedConfiguration(e, false);
        if (
            FixtureEndpoint(core).configuration() != e.coreConfiguration
                || FixtureEndpoint(carrier).configuration() != e.carrierConfiguration
                || ProxyAdmin(coreAdmin).owner() != address(this) || ProxyAdmin(carrierAdmin).owner() != address(this)
        ) revert FixtureDeploymentState();
        e.id = UpgradeStorage.executionId(e);
        currentRevision = e.ordinal;
        revisions[e.ordinal] = e;
        emit FixtureExecutionActivated(e.ordinal, e.id, e.activationBlock);
    }

    // Deliberately adversarial paths remain in the test utility, never host APIs.
    function upgradeCoreOnlyForTest(address next) external onlyOwner {
        ProxyAdmin(coreAdmin).upgradeAndCall(ITransparentUpgradeableProxy(core), next, "");
    }

    function upgradeCarrierOnlyForTest(address next) external onlyOwner {
        ProxyAdmin(carrierAdmin).upgradeAndCall(ITransparentUpgradeableProxy(carrier), next, "");
    }
}
