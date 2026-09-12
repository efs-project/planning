// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

/// @notice Mandatory unique-record postings. Only the immutable Record kernel appends.
contract LegacyRecordInventoryIndex {
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
    address public immutable kernel;
    uint256 public constant MAX_PAGE = 64;
    bytes32 public constant SUCCESS = keccak256("EFS21_RECORD_INVENTORY_OK");
    mapping(bytes32 => bytes32[]) private admittedRecords;
    error OnlyKernel();
    error InvalidCursor();
    error InvalidLimit();

    constructor() {
        kernel = msg.sender;
    }

    function noteRecord(bytes32 typeId, bytes32 id) external returns (bytes32) {
        if (msg.sender != kernel) revert OnlyKernel();
        admittedRecords[typeId].push(id);
        return SUCCESS;
    }

    function typeInventory(bytes32 typeId, Cursor calldata cursor, uint256 limit) external view returns (Page memory) {
        bytes32 scope = keccak256(abi.encode("EFS21_RECORDS", address(this), typeId));
        uint256 high = cursor.scope == 0 ? admittedRecords[typeId].length : cursor.revision;
        if (high > admittedRecords[typeId].length) revert InvalidCursor();
        return _page(admittedRecords[typeId], scope, high, high, cursor, limit);
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
