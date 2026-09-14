// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

// TEST-ONLY DIAGNOSTIC. Intended destination: lab-b/test/FilesParentBudget.t.sol.
// GREEN candidate: raw-slot acceptor performs only bounded metadata/File-word reads.
// No Core change or Files design adoption. UNRUN here: coordinator owns compilation.

import {Keys} from "../src/Keys.sol";
import {Ledger} from "../src/Ledger.sol";
import {IAcceptor} from "../src/Interfaces.sol";
import {LabBase} from "./LabBase.sol";
/// Upstream `cool(address)` marks the address and its storage slots cold.
interface VmCold {
    function cool(address target) external;
}

/// Exact test profile: Child body = (parent Record id, stable File Subject id).
/// Parent is arbitrary raw bytes whose first word is that same nonzero File id.
contract ExactRootParentAcceptor is IAcceptor {
    bytes32 public immutable expectedRootType;
    constructor(bytes32 expectedRootType_) {
        expectedRootType = expectedRootType_;
    }

    function accept(bytes32, bytes calldata data, bytes32[] calldata refs) external view returns (bool) {
        if (data.length != 64 || refs.length != 1) return false;
        (bytes32 parentId, bytes32 fileId) = abi.decode(data, (bytes32, bytes32));
        if (parentId != refs[0] || fileId == bytes32(0)) return false;

        // msg.sender is the Ledger's bounded STATICCALL context. This deliberately
        // exercises its public full-body getter; no arbitrary Ledger argument exists.
        (bytes32 parentType,,, bytes memory parent) = Ledger(msg.sender).record(parentId);
        if (parentType != expectedRootType || parent.length < 32) return false;
        bytes32 parentFile;
        assembly ("memory-safe") {
            parentFile := mload(add(parent, 32))
        }
        return parentFile == fileId;
    }
}

/// TEST-ONLY layout-coupled alternative. Slots 2/3 are the source-declared
/// `_record`/`_bodyWord` mappings; this diagnoses `extsload`, not a product ABI.
contract ExtsloadRootParentAcceptor is IAcceptor {
    bytes32 public immutable expectedRootType;
    constructor(bytes32 expectedRootType_) { expectedRootType = expectedRootType_; }
    function recordBase(bytes32 parentId) public pure returns (bytes32) { return keccak256(abi.encode(parentId, uint256(2))); }

    function metaSlot(bytes32 parentId) public pure returns (bytes32 slot) {
        unchecked { slot = bytes32(uint256(recordBase(parentId)) + 1); }
    }

    function word0Slot(bytes32 parentId) public pure returns (bytes32) {
        bytes32 inner = keccak256(abi.encode(parentId, uint256(3)));
        return keccak256(abi.encode(uint256(0), inner));
    }

    /// Bounded test predicate: exact Root Type, length >= 32 and matching File word.
    function accept(bytes32, bytes calldata data, bytes32[] calldata refs) external view returns (bool) {
        if (expectedRootType == bytes32(0) || data.length != 64 || refs.length != 1) return false;
        (bytes32 parentId, bytes32 fileId) = abi.decode(data, (bytes32, bytes32));
        if (fileId == bytes32(0) || parentId != refs[0]) return false;
        Ledger caller = Ledger(msg.sender);
        uint256 meta = uint256(caller.extsload(metaSlot(parentId)));
        return caller.extsload(recordBase(parentId)) == expectedRootType && uint32(meta >> 48) >= 32
            && caller.extsload(word0Slot(parentId)) == fileId;
    }
}

contract ColdParentReadBudgetTest is LabBase {
    VmCold private constant vmCold = VmCold(address(uint160(uint256(keccak256("hevm cheat code")))));

    bytes32 private constant ROOT_SHAPE = keccak256("lab/type/files-root-budget/1");
    bytes32 private constant CHILD_SHAPE = keccak256("lab/type/files-child-budget/1");
    uint256 private constant LARGE = 8192;
    uint256 private constant SMALL = 64;
    uint256 private constant OUTER_GAS = 2_000_000;

    bytes32 private ROOT;
    bytes32 private CHILD;
    bytes32 private RAW_CHILD;
    ExactRootParentAcceptor private parentRule;
    ExtsloadRootParentAcceptor private rawParentRule;

    function setUp() public override {
        super.setUp();
        ROOT = registry.register(ROOT_SHAPE, address(0), new bytes32[](0));
        parentRule = new ExactRootParentAcceptor(ROOT);
        bytes32[] memory rootRef = new bytes32[](1);
        rootRef[0] = ROOT;
        CHILD = registry.register(CHILD_SHAPE, address(parentRule), rootRef);
        rawParentRule = new ExtsloadRootParentAcceptor(ROOT);
        RAW_CHILD = registry.register(keccak256("lab/type/files-child-budget-extsload/1"), address(rawParentRule), rootRef);
        require(CHILD == Keys.typeId(CHILD_SHAPE, rootRef, address(parentRule).codehash), "child Type descriptor");
        require(rawParentRule.expectedRootType() == ROOT, "raw child pins exact Root Type");
        require(ledger.MAX_BODY() == LARGE && ledger.ACCEPT_GAS() == 300_000, "diagnostic constants changed");
    }

    function parentBody(bytes32 fileId, uint256 length) private pure returns (bytes memory body) {
        require(fileId != bytes32(0) && length >= 32, "parent fixture shape");
        body = new bytes(length); // remaining bytes are opaque document payload
        assembly ("memory-safe") {
            mstore(add(body, 32), fileId)
        }
    }

    function childBody(bytes32 parentId, bytes32 fileId) private pure returns (bytes memory) {
        return abi.encode(parentId, fileId);
    }

    function assertChild(bytes32 childId, bytes memory expectedBody) private view {
        (bytes32 typeId, uint64 first, uint32 occurrences, bytes memory observed) = ledger.record(childId);
        require(typeId == CHILD && first != 0 && occurrences == 1, "child Record admitted once");
        require(keccak256(observed) == keccak256(expectedBody), "child body retained");
    }

    /// Control: a just-written large parent's body slots remain warm.
    function test_warm_fresh_8192_parent_permits_valid_child() public {
        bytes32 fileId = alice.create(bytes32(uint256(101)));
        bytes memory rootBody = parentBody(fileId, LARGE);
        bytes32 parentId = alice.publish{gas: 15_000_000}(ROOT, rootBody);
        bytes memory child = childBody(parentId, fileId);
        bytes32 childId = alice.publish{gas: OUTER_GAS}(CHILD, child);

        assertChild(childId, child);
        (uint64 count, uint64 live,,) = index.postingHead(Keys.byTypeList(CHILD));
        require(count == 1 && live == 1, "warm child indexed");
    }

    /// `cool` is a diagnostic cold-state simulation, not a paid separate transaction.
    /// No parent getter is called after cooling and before the attempted child publish.
    function test_cold_8192_parent_refuses_exactly_and_rolls_back() public {
        bytes32 fileId = alice.create(bytes32(uint256(102)));
        bytes memory rootBody = parentBody(fileId, LARGE);
        bytes32 parentId = alice.publish{gas: 15_000_000}(ROOT, rootBody);
        bytes memory child = childBody(parentId, fileId);
        bytes32 childId = rid(CHILD, child);

        uint64 nonceBefore = ledger.nonces(address(alice));
        (uint64 a0, uint64 r0, uint64 b0, uint64 p0) = ledger.counts();
        bytes32 authorList = Keys.byAuthorList(pid(address(alice)));
        (uint64 typeCount0, uint64 typeLive0,,) = index.postingHead(Keys.byTypeList(CHILD));
        (uint64 authorCount0, uint64 authorLive0,,) = index.postingHead(authorList);

        vmCold.cool(address(ledger));
        try alice.publish{gas: OUTER_GAS}(CHILD, child) {
            require(false, "cold 8192-byte parent unexpectedly accepted");
        } catch (bytes memory err) {
            bytes memory expected = abi.encodeWithSelector(Ledger.E_REJECTED.selector, uint256(0), CHILD);
            require(keccak256(err) == keccak256(expected), "not E_REJECTED(leaf 0, child Type)");
        }

        require(ledger.nonces(address(alice)) == nonceBefore, "nonce rolled back");
        (uint64 a1, uint64 r1, uint64 b1, uint64 p1) = ledger.counts();
        require(a1 == a0 && r1 == r0 && b1 == b0 && p1 == p0, "all counts rolled back");
        (bytes32 t, uint64 first, uint32 occurrences, bytes memory data) = ledger.record(childId);
        require(t == bytes32(0) && first == 0 && occurrences == 0 && data.length == 0, "no child Record");
        (uint64 typeCount1, uint64 typeLive1,,) = index.postingHead(Keys.byTypeList(CHILD));
        (uint64 authorCount1, uint64 authorLive1,,) = index.postingHead(authorList);
        require(typeCount1 == typeCount0 && typeLive1 == typeLive0, "child Type postings unchanged");
        require(authorCount1 == authorCount0 && authorLive1 == authorLive0, "author postings unchanged");
    }

    /// Small cold parent separates size/gas from rule logic.
    function test_cold_64_parent_permits_valid_child() public {
        bytes32 fileId = alice.create(bytes32(uint256(103)));
        bytes memory rootBody = parentBody(fileId, SMALL);
        bytes32 parentId = alice.publish(ROOT, rootBody);
        bytes memory child = childBody(parentId, fileId);

        vmCold.cool(address(ledger));
        bytes32 childId = alice.publish{gas: OUTER_GAS}(CHILD, child);

        assertChild(childId, child);
        (uint64 count, uint64 live,,) = index.postingHead(Keys.byTypeList(CHILD));
        require(count == 1 && live == 1, "cold small child indexed");
    }

    function assertRawParent(bytes32 parentId, bytes32 fileId, uint32 length) private view {
        require(ledger.extsload(rawParentRule.recordBase(parentId)) == ROOT, "raw parent Type slot");
        uint256 meta = uint256(ledger.extsload(rawParentRule.metaSlot(parentId)));
        require(uint32(meta >> 48) == length, "raw parent length field");
        require(ledger.extsload(rawParentRule.word0Slot(parentId)) == fileId, "raw parent File word");
    }

    function expectRawReject(bytes memory child) private {
        bytes32 childId = rid(RAW_CHILD, child);
        uint64 nonceBefore = ledger.nonces(address(alice));
        (uint64 a0, uint64 r0, uint64 b0, uint64 p0) = ledger.counts();
        bytes32 authorList = Keys.byAuthorList(pid(address(alice)));
        (uint64 tc0, uint64 tl0,,) = index.postingHead(Keys.byTypeList(RAW_CHILD));
        (uint64 ac0, uint64 al0,,) = index.postingHead(authorList);
        vmCold.cool(address(ledger));
        try alice.publish{gas: OUTER_GAS}(RAW_CHILD, child) { require(false, "raw child unexpectedly accepted"); }
        catch (bytes memory err) {
            require(keccak256(err) == keccak256(abi.encodeWithSelector(Ledger.E_REJECTED.selector, uint256(0), RAW_CHILD)), "raw rejection shape");
        }
        require(ledger.nonces(address(alice)) == nonceBefore, "raw nonce rollback");
        (uint64 a1, uint64 r1, uint64 b1, uint64 p1) = ledger.counts();
        require(a1 == a0 && r1 == r0 && b1 == b0 && p1 == p0, "raw count rollback");
        (bytes32 t, uint64 first, uint32 occ, bytes memory data) = ledger.record(childId);
        require(t == 0 && first == 0 && occ == 0 && data.length == 0, "no raw child Record");
        (uint64 tc1, uint64 tl1,,) = index.postingHead(Keys.byTypeList(RAW_CHILD));
        (uint64 ac1, uint64 al1,,) = index.postingHead(authorList);
        require(tc1 == tc0 && tl1 == tl0 && ac1 == ac0 && al1 == al0, "raw postings unchanged");
    }

    function test_cold_8192_extsload_same_file_accepts_and_indexes() public {
        bytes32 fileId = alice.create(bytes32(uint256(104)));
        bytes memory rootBody = parentBody(fileId, LARGE);
        bytes32 parentId = alice.publish{gas: 15_000_000}(ROOT, rootBody);
        bytes memory child = childBody(parentId, fileId);

        require(parentId == rid(ROOT, rootBody), "full parent ID unchanged");
        assertRawParent(parentId, fileId, uint32(LARGE));
        vmCold.cool(address(ledger));
        bytes32 childId = alice.publish{gas: OUTER_GAS}(RAW_CHILD, child);

        require(childId == rid(RAW_CHILD, child), "exact raw child ID");
        (bytes32 pt,,, bytes memory parentAfter) = ledger.record(parentId);
        require(pt == ROOT && keccak256(parentAfter) == keccak256(rootBody), "full parent Type/body unchanged");
        (bytes32 t,, uint32 occurrences, bytes memory observed) = ledger.record(childId);
        require(t == RAW_CHILD && occurrences == 1 && keccak256(observed) == keccak256(child), "raw child admitted");
        (uint64 count, uint64 live,,) = index.postingHead(Keys.byTypeList(RAW_CHILD));
        require(count == 1 && live == 1, "raw child indexed");
    }

    function test_cold_8192_extsload_wrong_file_rejects_and_rolls_back() public {
        bytes32 fileId = alice.create(bytes32(uint256(105)));
        bytes32 otherFile = alice.create(bytes32(uint256(106)));
        bytes memory rootBody = parentBody(otherFile, LARGE);
        bytes32 parentId = alice.publish{gas: 15_000_000}(ROOT, rootBody);
        bytes memory child = childBody(parentId, fileId);
        assertRawParent(parentId, otherFile, uint32(LARGE));
        expectRawReject(child);
    }

    /// A one-byte body occupies word0 and can equal a padded synthetic File word;
    /// Bounded predicate must preserve the full getter's length >= 32 rule.
    function test_cold_short_extsload_matching_padded_word_still_rejects_and_rolls_back() public {
        bytes memory shortBody = new bytes(1);
        shortBody[0] = 0x7f;
        bytes32 syntheticFile = bytes32(bytes1(0x7f));
        bytes32 parentId = alice.publish(ROOT, shortBody);
        bytes memory child = childBody(parentId, syntheticFile);
        assertRawParent(parentId, syntheticFile, 1);
        expectRawReject(child);
    }
}
