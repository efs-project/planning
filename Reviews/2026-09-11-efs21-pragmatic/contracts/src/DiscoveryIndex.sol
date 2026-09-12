// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;
import {ExactTypeRegistry, Uint256Validator} from "./ExactTypeRegistry.sol";
import {NavigationIndex} from "./NavigationIndex.sol";

interface DiscoverySource {
    struct FileInfo {
        address owner;
        bool directory;
        bool live;
        uint64 revision;
        bytes32 recordId;
    }

    struct Record {
        bytes32 typeId;
        bytes body;
    }
    function fileInfo(bytes32) external view returns (FileInfo memory);
    function readRecord(bytes32) external view returns (Record memory);
}

/// @notice Disposable one-profile UINT256_EQ experiment, NOT an admitted-occurrence index.
contract DiscoveryIndex {
    enum Health {
        UNSUPPORTED,
        BUILDING,
        READY,
        DIRTY
    }
    enum Membership {
        UNKNOWN,
        PRESENT,
        ABSENT
    }

    struct Profile {
        bytes32 typeId;
        uint256 epoch;
        uint256 highWater;
        uint256 through;
        uint256 generation;
        Health health;
        bool required;
    }

    struct Cursor {
        bytes32 scope;
        uint256 generation;
        uint256 offset;
    }

    struct Page {
        bytes32[] ids;
        Cursor next;
        bool complete;
    }

    struct Prior {
        uint256 value;
        uint256 position;
    }
    address public immutable kernel;
    NavigationIndex public immutable navigation;
    ExactTypeRegistry public immutable types;
    bytes32 public constant SUCCESS = keccak256("EFS21_DISCOVERY_OK");
    uint256 public constant MAX_PAGE = 64;
    uint256 public constant MAINTENANCE_GAS = 350_000;
    uint256 public constant HEALTH_RESERVE = 100_000;
    bool private processing;
    mapping(address => Profile) private profiles;
    mapping(address => mapping(uint256 => mapping(uint256 => bytes32[]))) private members;
    mapping(address => mapping(uint256 => mapping(bytes32 => Prior))) private prior;

    error Unsupported();
    error UnsupportedType();
    error AlreadyAttached();
    error InvalidEpoch();
    error InvalidFrontier();
    error InvalidLimit();
    error InvalidCursor();
    error Unqualified();
    error OnlyKernel();
    error OnlySelf();
    error Busy();
    error InsufficientGas();
    error MaintenanceFailed();

    modifier idle() {
        if (processing) revert Busy();
        _;
    }

    constructor(NavigationIndex nav, ExactTypeRegistry registry) {
        kernel = msg.sender;
        navigation = nav;
        types = registry;
    }

    function attach(bytes32 exactType, bool required) external idle {
        Profile storage p = profiles[msg.sender];
        if (p.health != Health.UNSUPPORTED) revert AlreadyAttached();
        ExactTypeRegistry.TypeInfo memory info = types.typeInfo(exactType);
        if (info.codeHash != keccak256(type(Uint256Validator).runtimeCode) || info.validator.codehash != info.codeHash)
        {
            revert UnsupportedType();
        }
        p.typeId = exactType;
        p.required = required;
        _restart(msg.sender, p);
    }

    function restart() external idle {
        Profile storage p = profiles[msg.sender];
        if (p.health == Health.UNSUPPORTED) revert Unsupported();
        _restart(msg.sender, p);
    }

    function detach() external idle {
        Profile storage p = profiles[msg.sender];
        if (p.health == Health.UNSUPPORTED) revert Unsupported();
        ++p.epoch;
        ++p.generation;
        p.health = Health.UNSUPPORTED;
        p.typeId = 0;
    }

    function _restart(address namespace, Profile storage p) private {
        ++p.epoch;
        ++p.generation;
        p.highWater = navigation.fileCount(namespace);
        p.through = 0;
        p.health = p.highWater == 0 ? Health.READY : Health.BUILDING;
    }

    function status(address namespace) external view idle returns (Profile memory) {
        return profiles[namespace];
    }

    function backfill(address namespace, uint256 expectedEpoch, uint256 expectedThrough, uint256 maxItems)
        external
        idle
    {
        Profile storage p = _profile(namespace, expectedEpoch);
        if (p.health != Health.BUILDING || p.through != expectedThrough) revert InvalidFrontier();
        if (maxItems == 0 || maxItems > MAX_PAGE) revert InvalidLimit();
        uint256 end = p.through + maxItems;
        if (end > p.highWater) end = p.highWater;
        processing = true;
        while (p.through < end) {
            if (!_attempt(namespace, navigation.fileAt(namespace, p.through), p)) break;
            ++p.through;
        }
        ++p.generation;
        if (p.health != Health.DIRTY && p.through == p.highWater) p.health = Health.READY;
        processing = false;
    }

    function onFileChanged(address namespace, bytes32 id) external idle returns (bytes32) {
        if (msg.sender != kernel) revert OnlyKernel();
        Profile storage p = profiles[namespace];
        if (p.health == Health.UNSUPPORTED) return SUCCESS;
        ++p.generation;
        processing = true;
        if (p.health != Health.DIRTY) _attempt(namespace, id, p);
        processing = false;
        return SUCCESS;
    }

    /// @dev Only the trusted coordinator can enter this separately revertible CALL frame.
    function maintain(address namespace, bytes32 id) external returns (bytes32) {
        if (msg.sender != address(this) || !processing) revert OnlySelf();
        _maintain(namespace, id);
        return SUCCESS;
    }

    function _attempt(address namespace, bytes32 id, Profile storage p) private returns (bool ok) {
        // Never mistake caller starvation for a safely isolated child failure.
        if (gasleft() < MAINTENANCE_GAS + HEALTH_RESERVE) revert InsufficientGas();
        bytes memory input = abi.encodeCall(this.maintain, (namespace, id));
        address target = address(this);
        uint256 budget = MAINTENANCE_GAS;
        bytes32 marker = SUCCESS;
        assembly ("memory-safe") {
            let out := mload(0x40)
            mstore(out, 0)
            ok := call(budget, target, 0, add(input, 32), mload(input), out, 32)
            ok := and(and(ok, eq(returndatasize(), 32)), eq(mload(out), marker))
        }
        if (!ok) {
            if (p.required) revert MaintenanceFailed();
            p.health = Health.DIRTY;
        }
    }

    function probe(address namespace, uint256 epoch, uint256 value, bytes32 id)
        external
        view
        idle
        returns (Membership)
    {
        Profile storage p = _profile(namespace, epoch);
        Prior storage old = prior[namespace][epoch][id];
        if (old.position != 0 && old.value == value) return Membership.PRESENT;
        return p.health == Health.READY ? Membership.ABSENT : Membership.UNKNOWN;
    }

    function page(address namespace, uint256 epoch, uint256 value, Cursor calldata cursor, uint256 limit)
        external
        view
        idle
        returns (Page memory result)
    {
        Profile storage p = _profile(namespace, epoch);
        if (limit == 0 || limit > MAX_PAGE) revert InvalidLimit();
        bytes32 scope = keccak256(abi.encode("EFS21_UINT256_EQ", block.chainid, address(this), namespace, epoch, value));
        bool initial = cursor.scope == 0;
        if (
            (initial && (cursor.generation != 0 || cursor.offset != 0))
                || (!initial && (cursor.scope != scope || cursor.generation != p.generation))
        ) revert InvalidCursor();
        bytes32[] storage list = members[namespace][epoch][value];
        if (cursor.offset > list.length) revert InvalidCursor();
        uint256 count = list.length - cursor.offset;
        if (count > limit) count = limit;
        result.ids = new bytes32[](count);
        for (uint256 i; i < count; ++i) {
            result.ids[i] = list[cursor.offset + i];
        }
        result.next = Cursor(scope, p.generation, cursor.offset + count);
        result.complete = p.health == Health.READY && result.next.offset == list.length;
    }

    function _profile(address namespace, uint256 epoch) private view returns (Profile storage p) {
        p = profiles[namespace];
        if (p.health == Health.UNSUPPORTED) revert Unsupported();
        if (p.epoch != epoch) revert InvalidEpoch();
        if (p.health == Health.DIRTY) revert Unqualified();
    }

    function _maintain(address namespace, bytes32 id) internal virtual {
        Profile storage p = profiles[namespace];
        DiscoverySource.FileInfo memory f = DiscoverySource(kernel).fileInfo(id);
        bool eligible = f.owner == namespace && f.live && !f.directory;
        uint256 value;
        if (eligible) {
            DiscoverySource.Record memory r = DiscoverySource(kernel).readRecord(f.recordId);
            eligible = r.typeId == p.typeId;
            if (eligible) value = abi.decode(r.body, (uint256));
        }
        Prior storage old = prior[namespace][p.epoch][id];
        if (old.position != 0) {
            if (eligible && old.value == value) return;
            bytes32[] storage list = members[namespace][p.epoch][old.value];
            bytes32 last = list[list.length - 1];
            list[old.position - 1] = last;
            prior[namespace][p.epoch][last].position = old.position;
            list.pop();
            delete prior[namespace][p.epoch][id];
        }
        if (eligible) {
            bytes32[] storage list = members[namespace][p.epoch][value];
            list.push(id);
            old.value = value;
            old.position = list.length;
        }
    }
}
