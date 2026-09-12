// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;
import {LegacyRecordInventoryIndex} from "./LegacyRecordInventoryIndex.sol";

contract LegacyNavigationIndex {
    struct Cursor {
        bytes32 scope;
        uint256 revision;
        uint256 offset;
    }

    struct Page {
        bytes32[] ids;
        Cursor next;
        bool complete;
    }

    struct Location {
        address owner;
        bytes32 parent;
        bytes name;
        bool directory;
        bool live;
    }
    address public immutable kernel;
    uint256 public constant MAX_PAGE = 64;
    mapping(bytes32 => Location) private locations;
    mapping(bytes32 => bytes32[]) private children;
    mapping(bytes32 => mapping(bytes32 => bytes32)) private byName;
    mapping(bytes32 => uint256) private position;
    mapping(bytes32 => uint256) private generation;
    mapping(address => bytes32[]) private createdFiles;
    LegacyRecordInventoryIndex public immutable recordInventory;

    error OnlyKernel();
    error InvalidNode();
    error NameConflict();
    error NonemptyDirectory();
    error InvalidCursor();
    error StaleCursor();
    error InvalidLimit();

    modifier onlyKernel() {
        if (msg.sender != kernel) revert OnlyKernel();
        _;
    }

    constructor(LegacyRecordInventoryIndex inventory) {
        kernel = msg.sender;
        recordInventory = inventory;
    }

    function addNode(address owner, bytes32 id, bytes32 parent, bytes calldata name, bool directory)
        external
        onlyKernel
    {
        if (owner == address(0) || id == 0 || locations[id].owner != address(0)) revert InvalidNode();
        if (parent != 0) _insert(owner, id, parent, name);
        else if (!directory || name.length != 0) revert InvalidNode();
        locations[id] = Location(owner, parent, name, directory, true);
        if (directory) generation[id] = 1;
        createdFiles[owner].push(id);
    }

    function moveNode(bytes32 id, bytes32 parent, bytes calldata name) external onlyKernel {
        Location storage node = locations[id];
        if (!node.live || node.directory || node.parent == 0) revert InvalidNode();
        _detach(id, node);
        _insert(node.owner, id, parent, name);
        node.parent = parent;
        node.name = name;
    }

    function removeNode(bytes32 id) external onlyKernel {
        Location storage node = locations[id];
        if (!node.live || node.parent == 0) revert InvalidNode();
        if (children[id].length != 0) revert NonemptyDirectory();
        _detach(id, node);
        node.live = false;
    }

    function touchNode(bytes32 id) external onlyKernel {
        Location storage node = locations[id];
        if (!node.live || node.parent == 0) revert InvalidNode();
        ++generation[node.parent];
    }

    function location(bytes32 id) external view returns (Location memory node) {
        node = locations[id];
        if (node.owner == address(0)) revert InvalidNode();
    }

    function child(address owner, bytes32 parent, bytes calldata name) external view returns (bytes32) {
        _directory(owner, parent);
        return byName[parent][keccak256(name)];
    }

    function childCount(bytes32 id) external view returns (uint256) {
        Location storage node = locations[id];
        _directory(node.owner, id);
        return children[id].length;
    }

    /// @notice Live IDs in swap-pop order. Any child metadata/content/placement mutation stales a cursor.
    function directoryPage(address owner, bytes32 parent, Cursor calldata cursor, uint256 limit)
        external
        view
        returns (Page memory)
    {
        _directory(owner, parent);
        bytes32 scope = keccak256(abi.encode("EFS21_DIRECTORY", address(this), owner, parent));
        uint256 current = generation[parent];
        if (cursor.scope != 0 && cursor.revision != current) revert StaleCursor();
        return _page(children[parent], scope, current, children[parent].length, cursor, limit);
    }

    /// @notice All created IDs including roots, directories and terminally unlinked files.
    /// Historical cursors pin an append-only high-water, and do not freeze hydrated file state.
    function fileInventory(address owner, Cursor calldata cursor, uint256 limit) external view returns (Page memory) {
        bytes32 scope = keccak256(abi.encode("EFS21_FILES", address(this), owner));
        uint256 high = cursor.scope == 0 ? createdFiles[owner].length : cursor.revision;
        if (high > createdFiles[owner].length) revert InvalidCursor();
        return _page(createdFiles[owner], scope, high, high, cursor, limit);
    }

    /// @notice Stable all-created ordinal source, including roots/directories/unlinked files.
    function fileCount(address owner) external view returns (uint256) {
        return createdFiles[owner].length;
    }

    function fileAt(address owner, uint256 ordinal) external view returns (bytes32) {
        return createdFiles[owner][ordinal];
    }

    /// @notice Read-only compatibility; cursor scope names the actual Record inventory.
    function typeInventory(bytes32 typeId, Cursor calldata cursor, uint256 limit) external view returns (Page memory) {
        LegacyRecordInventoryIndex.Page memory page = recordInventory.typeInventory(
            typeId, LegacyRecordInventoryIndex.Cursor(cursor.scope, cursor.revision, cursor.offset), limit
        );
        return Page(page.ids, Cursor(page.next.scope, page.next.revision, page.next.offset), page.complete);
    }

    function _directory(address owner, bytes32 id) private view {
        Location storage node = locations[id];
        if (!node.live || !node.directory || node.owner != owner) revert InvalidNode();
    }

    function _insert(address owner, bytes32 id, bytes32 parent, bytes memory name) private {
        _directory(owner, parent);
        bytes32 key = keccak256(name);
        if (byName[parent][key] != 0) revert NameConflict();
        byName[parent][key] = id;
        children[parent].push(id);
        position[id] = children[parent].length;
        ++generation[parent];
    }

    function _detach(bytes32 id, Location storage node) private {
        bytes32 parent = node.parent;
        bytes32[] storage list = children[parent];
        uint256 at = position[id] - 1;
        bytes32 last = list[list.length - 1];
        list[at] = last;
        position[last] = at + 1;
        list.pop();
        delete position[id];
        delete byName[parent][keccak256(node.name)];
        ++generation[parent];
    }

    function _page(
        bytes32[] storage source,
        bytes32 scope,
        uint256 revision,
        uint256 end,
        Cursor calldata cursor,
        uint256 limit
    ) private view returns (Page memory page) {
        if (limit == 0 || limit > MAX_PAGE) revert InvalidLimit();
        if (cursor.scope == 0) {
            if (cursor.offset != 0 || cursor.revision != 0) revert InvalidCursor();
        } else if (cursor.scope != scope) {
            revert InvalidCursor();
        }
        uint256 offset = cursor.offset;
        if (offset > end) revert InvalidCursor();
        uint256 count = end - offset;
        if (count > limit) count = limit;
        page.ids = new bytes32[](count);
        for (uint256 i; i < count; ++i) {
            page.ids[i] = source[offset + i];
        }
        page.next = Cursor(scope, revision, offset + count);
        page.complete = offset + count == end;
    }
}
