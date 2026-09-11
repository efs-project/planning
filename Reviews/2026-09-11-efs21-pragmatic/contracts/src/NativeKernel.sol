// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;
import {ExactTypeRegistry} from "./ExactTypeRegistry.sol";
import {NavigationIndex} from "./NavigationIndex.sol";

/// @notice Fresh-genesis filesystem-profile cost experiment, NOT the generic EFS v2 Core.
/// Native caller authority, one placement per object, no directory moves or upgrades.
contract NativeKernel {
    struct FileInfo {
        address owner;
        bool directory;
        bool live;
        uint64 revision;
        bytes32 recordId;
    }

    struct Revision {
        bytes32 recordId;
        bytes32 parent;
        bytes name;
        bool live;
    }

    // Immutable locations are shared only within one file's revision history.
    // Keys are creation revision 1 or the move's revision, never a dense counter.
    struct StoredRevision {
        bytes32 recordId;
        uint64 locationRevision;
        bool live;
    }

    struct HistoricalLocation {
        bytes32 parent;
        bytes name;
    }

    struct Record {
        bytes32 typeId;
        bytes body;
    }

    struct Entry {
        bytes32 id;
        FileInfo file;
        bytes name;
    }

    struct DirectoryPage {
        Entry[] entries;
        NavigationIndex.Cursor next;
        bool complete;
    }
    NavigationIndex public immutable navigation;
    ExactTypeRegistry public immutable types;
    uint256 public constant MAX_BODY = 4096;
    uint256 public constant MAX_NAME = 64;
    uint256 public constant MAX_PATH_DEPTH = 32;
    bytes32 public constant RECORD_DOMAIN = keccak256("EFS21_RECORD_V1");
    mapping(address => uint256) public fileNonce;
    mapping(bytes32 => FileInfo) private files;
    mapping(bytes32 => StoredRevision[]) private history;
    mapping(bytes32 => Record) private records;
    mapping(bytes32 => bool) private hasRecord;
    mapping(bytes32 => mapping(uint64 => HistoricalLocation)) private locations;

    error MissingFile();
    error MissingRecord();
    error Unauthorized();
    error NotLive();
    error StaleRevision();
    error InvalidParent();
    error InvalidName();
    error InvalidRevision();
    error DirectoryMoveUnsupported();
    error DirectoryContentUnsupported();
    error RootRemovalUnsupported();
    error BodyTooLarge();
    error PathTooDeep();
    event FileChanged(bytes32 indexed fileId, address indexed owner, uint64 revision);
    event RecordStored(bytes32 indexed recordId, bytes32 indexed typeId);

    constructor() {
        navigation = new NavigationIndex();
        types = new ExactTypeRegistry();
    }

    /// @notice One-call coherent bounded metadata hydration. Bodies require readRecord separately.
    function listDirectory(address owner, bytes32 parent, NavigationIndex.Cursor calldata cursor, uint256 limit)
        external
        view
        returns (DirectoryPage memory page)
    {
        _parent(parent, owner);
        NavigationIndex.Page memory ids = navigation.directoryPage(owner, parent, cursor, limit);
        page.entries = new Entry[](ids.ids.length);
        for (uint256 i; i < ids.ids.length; ++i) {
            bytes32 id = ids.ids[i];
            page.entries[i] = Entry(id, files[id], navigation.location(id).name);
        }
        page.next = ids.next;
        page.complete = ids.complete;
    }

    function rootId(address owner) public view returns (bytes32) {
        return _fileId(owner, 0);
    }

    function ensureRoot() external returns (bytes32 id) {
        id = rootId(msg.sender);
        if (files[id].owner != address(0)) return id;
        files[id] = FileInfo(msg.sender, true, true, 1, bytes32(0));
        locations[id][1] = HistoricalLocation(bytes32(0), "");
        history[id].push(StoredRevision(bytes32(0), 1, true));
        navigation.addNode(msg.sender, id, bytes32(0), "", true);
        emit FileChanged(id, msg.sender, 1);
    }

    /// @notice Generic author-neutral immutable bytes admission, independent of file placement.
    function storeRecord(bytes32 typeId, bytes calldata body) external returns (bytes32) {
        return _store(typeId, body);
    }

    function recordId(bytes32 typeId, bytes memory body) public pure returns (bytes32) {
        return keccak256(abi.encode(RECORD_DOMAIN, typeId, body));
    }

    function readRecord(bytes32 id) external view returns (Record memory) {
        if (!hasRecord[id]) revert MissingRecord();
        return records[id];
    }

    function createDirectory(bytes32 parent, bytes calldata name) external returns (bytes32) {
        return _create(parent, name, true, bytes32(0));
    }

    function createFile(bytes32 parent, bytes calldata name, bytes32 typeId, bytes calldata body)
        external
        returns (bytes32)
    {
        _parent(parent, msg.sender);
        _name(name);
        return _create(parent, name, false, _store(typeId, body));
    }

    function editFile(bytes32 id, uint64 expected, bytes32 typeId, bytes calldata body) external {
        FileInfo storage file = _ownedLive(id, expected);
        if (file.directory) revert DirectoryContentUnsupported();
        bytes32 rid = _store(typeId, body);
        uint64 locationRevision = history[id][file.revision - 1].locationRevision;
        _revise(id, file, rid, locationRevision, true);
        navigation.touchNode(id);
    }

    function moveFile(bytes32 id, uint64 expected, bytes32 parent, bytes calldata name) external {
        FileInfo storage file = _ownedLive(id, expected);
        if (file.directory) revert DirectoryMoveUnsupported();
        _parent(parent, msg.sender);
        _name(name);
        uint64 locationRevision = file.revision + 1;
        locations[id][locationRevision] = HistoricalLocation(parent, name);
        _revise(id, file, file.recordId, locationRevision, true);
        navigation.moveNode(id, parent, name);
    }

    function unlink(bytes32 id, uint64 expected) external {
        FileInfo storage file = _ownedLive(id, expected);
        if (id == rootId(msg.sender)) revert RootRemovalUnsupported();
        uint64 locationRevision = history[id][file.revision - 1].locationRevision;
        _revise(id, file, file.recordId, locationRevision, false);
        navigation.removeNode(id);
    }

    function fileInfo(bytes32 id) external view returns (FileInfo memory file) {
        file = files[id];
        if (file.owner == address(0)) revert MissingFile();
    }

    /// @notice 1-based revision; an unlinked file's immutable history remains contract-readable.
    function revisionAt(bytes32 id, uint64 revision) external view returns (Revision memory) {
        if (revision == 0 || revision > history[id].length) revert InvalidRevision();
        StoredRevision storage row = history[id][revision - 1];
        HistoricalLocation storage location = locations[id][row.locationRevision];
        return Revision(row.recordId, location.parent, location.name, row.live);
    }

    /// @notice Zero is exact absence under an existing live directory; invalid parents revert.
    function lookup(address owner, bytes32 parent, bytes calldata name) external view returns (bytes32) {
        _parent(parent, owner);
        _name(name);
        return navigation.child(owner, parent, name);
    }

    /// @notice Literal pre-split ASCII segments. No slash parsing, percent decoding or dot traversal.
    function resolve(address owner, bytes[] calldata path) external view returns (bytes32 id) {
        if (path.length > MAX_PATH_DEPTH) revert PathTooDeep();
        // Validate all syntax before returning absence, even if the first segment is absent.
        for (uint256 i; i < path.length; ++i) {
            _name(path[i]);
        }
        id = rootId(owner);
        if (files[id].owner == address(0)) return bytes32(0);
        for (uint256 i; i < path.length; ++i) {
            _parent(id, owner);
            id = navigation.child(owner, id, path[i]);
            if (id == 0) return bytes32(0);
        }
    }

    function _create(bytes32 parent, bytes memory name, bool directory, bytes32 rid) private returns (bytes32 id) {
        _parent(parent, msg.sender);
        _name(name);
        id = _fileId(msg.sender, ++fileNonce[msg.sender]);
        files[id] = FileInfo(msg.sender, directory, true, 1, rid);
        locations[id][1] = HistoricalLocation(parent, name);
        history[id].push(StoredRevision(rid, 1, true));
        navigation.addNode(msg.sender, id, parent, name, directory);
        emit FileChanged(id, msg.sender, 1);
    }

    function _store(bytes32 typeId, bytes calldata body) private returns (bytes32 id) {
        if (body.length > MAX_BODY) revert BodyTooLarge();
        types.validate(typeId, body);
        id = recordId(typeId, body);
        if (!hasRecord[id]) {
            hasRecord[id] = true;
            records[id] = Record(typeId, body);
            navigation.noteRecord(typeId, id);
            emit RecordStored(id, typeId);
        }
    }

    function _revise(bytes32 id, FileInfo storage file, bytes32 rid, uint64 locationRevision, bool live) private {
        history[id].push(StoredRevision(rid, locationRevision, live));
        ++file.revision;
        file.recordId = rid;
        file.live = live;
        emit FileChanged(id, file.owner, file.revision);
    }

    function _ownedLive(bytes32 id, uint64 expected) private view returns (FileInfo storage file) {
        file = files[id];
        if (file.owner != msg.sender) revert Unauthorized();
        if (!file.live) revert NotLive();
        if (file.revision != expected) revert StaleRevision();
    }

    function _parent(bytes32 id, address owner) private view {
        FileInfo storage parent = files[id];
        if (!parent.live || !parent.directory || parent.owner != owner) revert InvalidParent();
    }

    function _name(bytes memory name) private pure {
        if (name.length == 0 || name.length > MAX_NAME) revert InvalidName();
        if ((name.length == 1 && name[0] == 0x2e) || (name.length == 2 && name[0] == 0x2e && name[1] == 0x2e)) {
            revert InvalidName();
        }
        for (uint256 i; i < name.length; ++i) {
            if (name[i] < 0x20 || name[i] > 0x7e || name[i] == 0x2f) revert InvalidName();
        }
    }

    function _fileId(address owner, uint256 nonce) private view returns (bytes32) {
        return keccak256(abi.encode(keccak256("EFS21_FILE_V1"), block.chainid, address(this), owner, nonce));
    }
}
