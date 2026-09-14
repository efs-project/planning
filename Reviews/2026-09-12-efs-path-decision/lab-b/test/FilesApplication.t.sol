// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import {FilesJoinedTest} from "./FilesJoined.t.sol";
import {FilesJoinedConsumer} from "./FilesJoinedConsumer.sol";
import {FilesApplication} from "./FilesApplication.sol";
import {FilesFailingParentIndex} from "./FilesJoinedProfile.sol";
import {Ledger} from "../src/Ledger.sol";
import {Keys} from "../src/Keys.sol";

contract ApplicationStranger {
    function adopt(FilesApplication app, bytes32 file, bytes32 parent, FilesJoinedConsumer.Basis calldata basis) external {
        app.adoptApprovedRevision(file, parent, 0, basis);
    }
}

/// Includes inherited Files regressions; report these separately from the app cases.
contract FilesApplicationTest is FilesJoinedTest {
    FilesApplication internal app;
    FilesJoinedConsumer internal joined;

    function _application(address source, address reviewer) internal {
        joined = new FilesJoinedConsumer(ledger, lens, filesIndex, rootType, childType,
            address(rootRule).codehash, address(childRule).codehash);
        app = new FilesApplication(ledger, joined, address(this), source, reviewer, APPROVED);
    }

    function _basisApp() internal view returns (FilesJoinedConsumer.Basis memory) {
        return FilesJoinedConsumer.Basis(admissions(), filesIndex.generation(), registry.epoch(), address(ledger).codehash);
    }

    function _snapshotApp(bytes32 candidate) internal view returns (bytes32) {
        (uint64 a, uint64 r, uint64 b, uint64 p) = ledger.counts();
        bytes32 ownKey = Keys.binding(ledger.principalOf(address(app)), Keys.position(HEAD, file, NO_ROLE));
        (uint8 state, uint32 revision, uint64 at, uint64 previous, uint64 ordinal, bytes32 target) = ledger.head(ownKey);
        (uint64 pc, uint64 pl, uint64 last, uint16 flags) = filesIndex.postingHead(Keys.referenceList(childType, 0, ra));
        (bytes32 t, uint64 first, uint32 occurrence, bytes memory body) = ledger.record(candidate);
        return keccak256(abi.encode(a,r,b,p,ledger.nonces(address(app)),state,revision,at,previous,ordinal,target,
            app.adoptionCount(),app.lastRevision(),pc,pl,last,flags,t,first,occurrence,body,
            filesIndex.lastProcessed(),filesIndex.lastPublication()));
    }

    function _candidate() internal view returns (bytes32) {
        return rid(childType, _childBody(ra, file, bytes("Meeting at 11:00.\n")));
    }

    function _ready() internal {
        _createRoot();
        _publishBranches();
        _application(eoaA, eoaA);
    }

    // Catches helper-authorship laundering, omission of checked parent/type, or lost app effects.
    function test_app_adopts_verified_revision_under_its_own_author() public {
        _ready();
        bytes32 expected = _candidate();
        (bytes32 actual, uint64 pub) = app.adoptApprovedRevision(file, ra, 0, _basisApp());
        require(actual == expected && actual != ra, "new child with preserved document");
        _assertRecord(actual, childType, _childBody(ra, file, bytes("Meeting at 11:00.\n")));
        _assertEvidence(pub, address(app), ledger.PROOF_NATIVE());
        (uint8 st, bytes32 target, uint32 rev, address author,) = lens.resolve(lensOf(address(app)), HEAD, file, NO_ROLE);
        require(st == 1 && target == actual && rev == 1 && author == address(app), "app-owned exact HEAD");
        require(app.adoptionCount() == 1 && app.lastRevision() == actual && ledger.nonces(address(app)) == 1, "app and ledger effects committed");
        _assertParents(ra, actual, bytes32(0));
    }

    function test_app_unauthorized_caller_has_no_effect() public {
        _ready();
        bytes32 beforeState = _snapshotApp(_candidate());
        ApplicationStranger stranger = new ApplicationStranger();
        try stranger.adopt(app, file, ra, _basisApp()) { revert("unauthorized app use"); }
        catch(bytes memory err) { expectSel(err, FilesApplication.E_OPERATOR.selector, "operator gate"); }
        require(_snapshotApp(_candidate()) == beforeState, "all effects unchanged");
    }

    function test_app_wrong_selected_revision_has_no_effect() public {
        _ready();
        bytes32 beforeState = _snapshotApp(_candidate());
        try app.adoptApprovedRevision(file, rb, 0, _basisApp()) { revert("changed selection accepted"); }
        catch(bytes memory err) { expectSel(err, FilesApplication.E_SOURCE.selector, "expected source"); }
        require(_snapshotApp(_candidate()) == beforeState, "all effects unchanged");
    }

    function test_app_file_tag_does_not_authorize_selected_revision() public {
        _createRoot();
        _application(eoaA, eoaA);
        Ledger.Action[] memory a = one(aBind(TAG, file, APPROVED, file, 0));
        _signedActions(a, new bytes[](1));
        bytes32 candidate = rid(childType, _childBody(r0, file, bytes("Meeting at 10:00.\n")));
        bytes32 beforeState = _snapshotApp(candidate);
        try app.adoptApprovedRevision(file, r0, 0, _basisApp()) { revert("wrong tag subject accepted"); }
        catch(bytes memory err) { expectSel(err, FilesApplication.E_APPROVAL.selector, "exact revision approval required"); }
        require(_snapshotApp(candidate) == beforeState, "all effects unchanged");
    }

    function test_app_wrong_approval_author_has_no_effect() public {
        _ready();
        _application(eoaA, address(bob)); // source Alice approved RA, configured reviewer Bob did not
        bytes32 beforeState = _snapshotApp(_candidate());
        try app.adoptApprovedRevision(file, ra, 0, _basisApp()) { revert("untrusted approval accepted"); }
        catch(bytes memory err) { expectSel(err, FilesApplication.E_APPROVAL.selector, "reviewer provenance"); }
        require(_snapshotApp(_candidate()) == beforeState, "all effects unchanged");
    }

    function test_app_stale_own_cas_rolls_back_child_and_app_state() public {
        _ready();
        bytes32 beforeState = _snapshotApp(_candidate());
        try app.adoptApprovedRevision(file, ra, 1, _basisApp()) { revert("stale CAS accepted"); }
        catch(bytes memory err) { expectSel(err, Ledger.E_CAS.selector, "app CAS"); }
        require(_snapshotApp(_candidate()) == beforeState, "publish and app effects rolled back");
    }

    function test_app_stale_basis_rolls_back() public {
        _ready();
        FilesJoinedConsumer.Basis memory old = _basisApp();
        filesIndex.bumpGeneration();
        bytes32 beforeState = _snapshotApp(_candidate());
        try app.adoptApprovedRevision(file, ra, 0, old) { revert("stale basis accepted"); }
        catch(bytes memory err) { expectSel(err, FilesJoinedConsumer.E_BASIS.selector, "read basis"); }
        require(_snapshotApp(_candidate()) == beforeState, "all effects unchanged");
    }

    function test_app_current_policy_refusal_rolls_back() public {
        _ready();
        registry.activate(childType, address(acceptor));
        acceptor.set(1, 0);
        bytes32 beforeState = _snapshotApp(_candidate());
        try app.adoptApprovedRevision(file, ra, 0, _basisApp()) { revert("destination policy bypassed"); }
        catch(bytes memory err) { expectSel(err, Ledger.E_POLICY_REJECTED.selector, "mandatory destination acceptance"); }
        require(_snapshotApp(_candidate()) == beforeState, "all effects unchanged");
    }

    function test_app_withdrawn_parent_still_readable() public {
        _ready();
        (,uint64 first,,) = ledger.record(ra);
        _signedActions(one(aWithdraw(first)), new bytes[](1));
        (,,uint32 remaining,) = ledger.record(ra);
        require(remaining == 0, "last occurrence withdrawn");
        (bytes32 actual,) = app.adoptApprovedRevision(file, ra, 0, _basisApp());
        require(actual == _candidate() && app.adoptionCount() == 1, "retention is not maintenance");
    }

    function test_app_required_index_failure_rolls_back_every_effect() public {
        _installFilesIndex(true);
        _createRoot();
        ra = r0;
        _signedActions(one(aBind(TAG, r0, APPROVED, file, 0)), new bytes[](1));
        _application(eoaA, eoaA);
        bytes32 candidate = rid(childType, _childBody(r0, file, bytes("Meeting at 10:00.\n")));
        bytes32 beforeState = _snapshotApp(candidate);
        try app.adoptApprovedRevision(file, r0, 0, _basisApp()) { revert("required index bypassed"); }
        catch(bytes memory err) {
            require(keccak256(err) == keccak256(abi.encodeWithSelector(Ledger.E_INDEX.selector,
                abi.encodeWithSelector(FilesFailingParentIndex.E_FORCED_CHILD.selector))), "index refusal preserved");
        }
        require(_snapshotApp(candidate) == beforeState, "app, record, HEAD and index rollback");
    }
}
