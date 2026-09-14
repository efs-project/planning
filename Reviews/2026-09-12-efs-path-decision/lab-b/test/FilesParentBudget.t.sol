// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

// TEST-ONLY DIAGNOSTIC. Intended destination: lab-b/test/FilesParentBudget.t.sol.
// No Core change or Files design adoption. Results are reported by the coordinator.

import {Keys} from "../src/Keys.sol";
import {Ledger} from "../src/Ledger.sol";
import {IAcceptor} from "../src/Interfaces.sol";
import {LabBase} from "./LabBase.sol";

/// Upstream forge-std Vm.sol exposes `cool(address)`: mark the address and its
/// storage slots cold. This diagnostic verifies the effect through paired outcomes.
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

contract ColdParentReadBudgetTest is LabBase {
    VmCold private constant vmCold = VmCold(address(uint160(uint256(keccak256("hevm cheat code")))));

    bytes32 private constant ROOT_SHAPE = keccak256("lab/type/files-root-budget/1");
    bytes32 private constant CHILD_SHAPE = keccak256("lab/type/files-child-budget/1");
    uint256 private constant LARGE = 8192;
    uint256 private constant SMALL = 64;
    uint256 private constant OUTER_GAS = 2_000_000;

    bytes32 private ROOT;
    bytes32 private CHILD;
    ExactRootParentAcceptor private parentRule;

    function setUp() public override {
        super.setUp();
        ROOT = registry.register(ROOT_SHAPE, address(0), new bytes32[](0));
        parentRule = new ExactRootParentAcceptor(ROOT);
        bytes32[] memory rootRef = new bytes32[](1);
        rootRef[0] = ROOT;
        CHILD = registry.register(CHILD_SHAPE, address(parentRule), rootRef);
        require(CHILD == Keys.typeId(CHILD_SHAPE, rootRef, address(parentRule).codehash), "child Type descriptor");
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

    /// A just-written large parent has warm body slots in this top-level test call.
    /// This is the control that could conceal the cold-parent defect.
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

    /// A cold parent is semantically valid at small size, separating size/gas from rule logic.
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
}
