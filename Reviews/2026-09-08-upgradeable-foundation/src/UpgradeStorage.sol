// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;
import {StateStore} from "C0Core/StateStore.sol";
import {UpgradeAdmissionLibrary} from "./UpgradeAdmissionLibrary.sol";
import {ERC1967Utils} from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Utils.sol";
import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

library UpgradeStorage {
    struct ExecutionSet {
        uint32 ordinal;
        uint64 activationBlock;
        uint64 activationAdmissionHigh;
        address core;
        address carrier;
        address coreImplementation;
        address carrierImplementation;
        bytes32 coreCodehash;
        bytes32 carrierCodehash;
        address coreAdmin;
        address carrierAdmin;
        address controller;
        address operator;
        address helper;
        bytes32 helperCodehash;
        address admissionLibrary;
        bytes32 admissionCodehash;
        bytes32 treeType;
        bytes32 coreConfiguration;
        bytes32 carrierConfiguration;
        bytes32 id;
    }

    /// @custom:storage-location erc7201:efs.fixture.store
    struct EFSState {
        StateStore.Store store;
    }

    /// @custom:storage-location erc7201:efs.fixture.control
    struct Control {
        bool initialized;
        address controller;
        address peer;
        address expectedAdmin;
        address operator;
        bytes32 treeType;
        mapping(uint64 => bool) usedNonces;
        mapping(bytes32 => bytes) stagedBytes;
        mapping(bytes32 => bool) staged;
    }

    /// @custom:storage-location erc7201:efs.fixture.presentation.v2
    struct Presentation {
        bool migrated;
        string label;
    }
    bytes32 internal constant EFS_SLOT =
        keccak256(abi.encode(uint256(keccak256("efs.fixture.store")) - 1)) & ~bytes32(uint256(255));
    bytes32 internal constant CONTROL_SLOT =
        keccak256(abi.encode(uint256(keccak256("efs.fixture.control")) - 1)) & ~bytes32(uint256(255));
    bytes32 internal constant PRESENTATION_SLOT =
        keccak256(abi.encode(uint256(keccak256("efs.fixture.presentation.v2")) - 1)) & ~bytes32(uint256(255));

    function efs() internal pure returns (StateStore.Store storage s) {
        bytes32 slot = EFS_SLOT;
        assembly ("memory-safe") { s.slot := slot }
    }

    function control() internal pure returns (Control storage s) {
        bytes32 slot = CONTROL_SLOT;
        assembly ("memory-safe") { s.slot := slot }
    }

    function presentation() internal pure returns (Presentation storage s) {
        bytes32 slot = PRESENTATION_SLOT;
        assembly ("memory-safe") { s.slot := slot }
    }

    function expectedConfiguration(ExecutionSet memory e, bool isCore) internal pure returns (bytes32) {
        address implementation = isCore ? e.coreImplementation : e.carrierImplementation;
        return keccak256(
            abi.encode(
                isCore ? e.core : e.carrier,
                implementation,
                isCore ? e.coreCodehash : e.carrierCodehash,
                implementation,
                isCore ? e.coreAdmin : e.carrierAdmin,
                e.controller,
                isCore ? e.carrier : e.core,
                e.operator,
                e.treeType,
                e.controller,
                e.helper,
                e.helperCodehash,
                e.admissionLibrary,
                e.admissionCodehash
            )
        );
    }

    function executionId(ExecutionSet memory e) internal pure returns (bytes32) {
        e.id = 0;
        return keccak256(abi.encode(keccak256("efs.fixture.execution-set/1"), e));
    }

    function postingConfiguration(bytes32 base, address store, bytes32 codehash) internal pure returns (bytes32) {
        return keccak256(abi.encode(keccak256("efs.fixture.core-posting-store/1"), base, store, codehash));
    }
}

interface IFixtureEndpoint {
    function configuration() external view returns (bytes32);
}

interface IFixtureController {
    function currentRevision() external view returns (uint32);
    function revisionAt(uint32) external view returns (UpgradeStorage.ExecutionSet memory);
}

/// @notice Shared fixture-only authority/configuration checks, present from U1.
abstract contract FixtureEndpoint {
    address public immutable implementationSelf = address(this);
    address public immutable bootstrapAuthority;
    address public immutable preparationHelper;
    bytes32 public immutable preparationCodehash;
    address public immutable admissionLibrary;
    bytes32 public immutable admissionCodehash;
    error FixtureInitialization();
    error FixtureConfiguration();
    error FixtureRevision();
    error FixtureAuthorization();
    error FixtureNonce();
    error FixtureExpiry();
    error FixtureMigration();

    constructor(address factory, address helper) {
        require(
            factory.code.length != 0 && helper.code.length != 0 && address(UpgradeAdmissionLibrary).code.length != 0,
            "fixed fixture dependencies"
        );
        bootstrapAuthority = factory;
        preparationHelper = helper;
        preparationCodehash = helper.codehash;
        admissionLibrary = address(UpgradeAdmissionLibrary);
        admissionCodehash = address(UpgradeAdmissionLibrary).codehash;
        UpgradeStorage.control().initialized = true;
    }

    function _initialize(address controller, address peer, address admin, address operator, bytes32 treeType) internal {
        UpgradeStorage.Control storage c = UpgradeStorage.control();
        // Stock OZ 5.6 initializes before its immutable ProxyAdmin is created.
        // Only the fixed factory, during proxy construction, can bootstrap.
        // The enclosing factory checks actual peer/admin/config after both CREATEs.
        if (
            c.initialized || msg.sender != bootstrapAuthority || controller != bootstrapAuthority
                || address(this) == implementationSelf || address(this).code.length != 0 || peer == address(0)
                || admin == address(0) || operator == address(0) || treeType == 0
                || ERC1967Utils.getAdmin() != address(0)
        ) revert FixtureInitialization();
        c.initialized = true;
        c.controller = controller;
        c.peer = peer;
        c.expectedAdmin = admin;
        c.operator = operator;
        c.treeType = treeType;
    }

    function namespaceRoots() external pure returns (bytes32, bytes32, bytes32) {
        return (UpgradeStorage.EFS_SLOT, UpgradeStorage.CONTROL_SLOT, UpgradeStorage.PRESENTATION_SLOT);
    }

    function configuration() public view virtual returns (bytes32) {
        UpgradeStorage.Control storage c = UpgradeStorage.control();
        if (
            !c.initialized || address(this) == implementationSelf
                || ERC1967Utils.getImplementation() != implementationSelf || ERC1967Utils.getAdmin() != c.expectedAdmin
                || preparationHelper.codehash != preparationCodehash || admissionLibrary.codehash != admissionCodehash
        ) revert FixtureConfiguration();
        if (abi.decode(_bounded(c.expectedAdmin, abi.encodeWithSignature("owner()"), 32), (address)) != c.controller) {
            revert FixtureConfiguration();
        }
        return keccak256(
            abi.encode(
                address(this),
                implementationSelf,
                implementationSelf.codehash,
                ERC1967Utils.getImplementation(),
                ERC1967Utils.getAdmin(),
                c.controller,
                c.peer,
                c.operator,
                c.treeType,
                bootstrapAuthority,
                preparationHelper,
                preparationCodehash,
                admissionLibrary,
                admissionCodehash
            )
        );
    }

    function _bounded(address target, bytes memory input, uint256 size) private view returns (bytes memory output) {
        bool ok;
        uint256 n;
        assembly ("memory-safe") {
            ok := staticcall(150000, target, add(input, 32), mload(input), 0, 0)
            n := returndatasize()
        }
        if (!ok || n != size) revert FixtureConfiguration();
        output = new bytes(n);
        assembly ("memory-safe") { returndatacopy(add(output, 32), 0, n) }
    }

    function currentRevision() public view returns (uint32) {
        return abi.decode(
            _bounded(UpgradeStorage.control().controller, abi.encodeCall(IFixtureController.currentRevision, ()), 32),
            (uint32)
        );
    }

    function revisionAt(uint32 ordinal) public view returns (UpgradeStorage.ExecutionSet memory) {
        return abi.decode(
            _bounded(
                UpgradeStorage.control().controller, abi.encodeCall(IFixtureController.revisionAt, (ordinal)), 672
            ),
            (UpgradeStorage.ExecutionSet)
        );
    }

    function _execution(uint32 expected) internal view returns (UpgradeStorage.ExecutionSet memory e) {
        if (expected == 0 || currentRevision() != expected) revert FixtureRevision();
        e = revisionAt(expected);
        UpgradeStorage.Control storage c = UpgradeStorage.control();
        bytes32 id = e.id;
        if (e.ordinal != expected || e.controller != c.controller || id == 0 || UpgradeStorage.executionId(e) != id) {
            revert FixtureConfiguration();
        }
        e.id = id;
        bool isCore = e.core == address(this);
        if ((!isCore && e.carrier != address(this)) || (isCore ? e.carrier : e.core) != c.peer) {
            revert FixtureConfiguration();
        }
        if (configuration() != (isCore ? e.coreConfiguration : e.carrierConfiguration)) revert FixtureConfiguration();
        bytes32 peerConfig =
            abi.decode(_bounded(c.peer, abi.encodeCall(IFixtureEndpoint.configuration, ()), 32), (bytes32));
        if (peerConfig != (isCore ? e.carrierConfiguration : e.coreConfiguration)) revert FixtureConfiguration();
    }

    function nonceUsed(uint64 nonce) external view returns (bool) {
        return UpgradeStorage.control().usedNonces[nonce];
    }

    function _authorize(bytes32 structHash, uint64 nonce, uint64 deadline, bytes calldata signature) internal view {
        UpgradeStorage.Control storage c = UpgradeStorage.control();
        if (deadline == 0 || block.timestamp > deadline) revert FixtureExpiry();
        if (c.usedNonces[nonce]) revert FixtureNonce();
        bytes32 domain = keccak256(
            abi.encode(
                keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"),
                keccak256("EFS Upgrade Foundation"),
                keccak256("1"),
                block.chainid,
                address(this)
            )
        );
        if (ECDSA.recover(keccak256(abi.encodePacked(hex"1901", domain, structHash)), signature) != c.operator) {
            revert FixtureAuthorization();
        }
    }

    function _migrate(string calldata label, bool fail) internal {
        // upgradeAndCall reaches delegatecall with the actual ProxyAdmin sender.
        if (
            msg.sender != UpgradeStorage.control().expectedAdmin || UpgradeStorage.presentation().migrated
                || bytes(label).length > 128 || fail
        ) revert FixtureMigration();
        configuration(); // local self/slot/admin owner/dependency checks; peer is intentionally mid-upgrade
        UpgradeStorage.presentation().migrated = true;
        UpgradeStorage.presentation().label = label;
    }
}
