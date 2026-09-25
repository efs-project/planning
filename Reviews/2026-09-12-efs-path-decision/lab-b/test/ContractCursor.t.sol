// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import {FilesCarrierIndexTest} from "./FilesCarrierProfile.t.sol";
import {FilesCarrierIndex} from "./FilesCarrierProfile.sol";
import {FilesLiveLens} from "./FilesLiveIndex.sol";
import {FilesPageReader} from "./FilesPageReader.sol";

/// Disposable consumer probe, not a proposed Core or public Files ABI.
contract ContractCursorConsumer {
    FilesPageReader public immutable reader;
    address public immutable signer;
    bytes32 public immutable folder;
    bytes32[] private authors;
    FilesPageReader.Query private query;
    FilesPageReader.Basis private basis;
    bytes private continuation;
    uint64 public pageNumber;
    uint64 public rawTotal;
    uint64 public scannedTotal;
    uint64 public matchedTotal;
    bytes32 public matchedRevisionDigest;
    bytes32 public inventoryPin;
    bool public allRowsKnown = true;
    bool public finished;
    bool public complete;

    error E_SESSION();
    error E_SIGNATURE();
    error E_PAGE();

    event PagePaid(uint64 indexed page, uint64 scanned, uint256 rows, uint64 cumulative,
        uint64 rawTotal, uint256 gasUsed, bool complete);

    constructor(FilesPageReader reader_, address signer_, bytes32 folder_, bytes32[] memory authors_,
        FilesPageReader.Query memory query_, FilesPageReader.Basis memory basis_) {
        if (signer_ == address(0)) revert E_SESSION();
        reader = reader_; signer = signer_; folder = folder_; authors = authors_; query = query_; basis = basis_;
    }

    function cursorHash() external view returns (bytes32) { return keccak256(continuation); }
    function digest() external view returns (bytes32) { return _digest(); }

    // The signer authorizes each state-changing step, binding its page number
    // and the cursor already in this contract. Empty claim is the normal path:
    // no client-supplied cursor is needed to continue. A nonempty claim is only
    // accepted if it exactly echoes the stored cursor.
    function advance(bytes calldata signature, bytes calldata cursorClaim)
        external returns (uint256 gasUsed, uint64 scanned, uint256 rows, bool done)
    {
        uint256 beforeGas = gasleft();
        if (finished || (cursorClaim.length != 0 && keccak256(cursorClaim) != keccak256(continuation))) revert E_SESSION();
        if (signature.length != 65) revert E_SIGNATURE();
        bytes32 r; bytes32 s; uint8 v;
        assembly ("memory-safe") {
            r := calldataload(signature.offset)
            s := calldataload(add(signature.offset, 32))
            v := byte(0, calldataload(add(signature.offset, 64)))
        }
        if (ecrecover(_digest(), v, r, s) != signer) revert E_SIGNATURE();
        FilesPageReader.Page memory page = reader.readPage(folder, authors, query, basis, continuation, 1);
        if (page.observedCurrent != basis.admission || page.scanStatus < 1 || page.scanStatus > 2
            || page.rawTotal < page.scanned || page.scanned > page.rawTotal - scannedTotal) revert E_PAGE();
        if (pageNumber == 0) {
            if (!page.startsAtOrigin) revert E_PAGE();
            rawTotal = page.rawTotal;
            inventoryPin = page.inventoryPin;
        } else if (page.startsAtOrigin || page.rawTotal != rawTotal || page.inventoryPin != inventoryPin) revert E_PAGE();
        if (page.scanStatus == 1 && (page.continuation.length == 0 || page.scanned == 0)) revert E_PAGE();
        if (page.scanStatus == 2 && page.continuation.length != 0) revert E_PAGE();
        scannedTotal += page.scanned;
        for (uint256 i; i < page.rows.length; ++i) {
            if (page.rows[i].matchStatus == 1) {
                ++matchedTotal;
                matchedRevisionDigest = keccak256(abi.encode(matchedRevisionDigest, page.rows[i].head.target));
            }
            else allRowsKnown = false;
        }
        continuation = page.continuation;
        ++pageNumber;
        if (page.scanStatus == 2) {
            if (scannedTotal != rawTotal) revert E_PAGE();
            finished = true;
            complete = allRowsKnown;
        }
        gasUsed = beforeGas - gasleft();
        scanned = page.scanned;
        rows = page.rows.length;
        done = complete;
        emit PagePaid(pageNumber, scanned, rows, scannedTotal, rawTotal, gasUsed, done);
    }

    function _digest() private view returns (bytes32) {
        return keccak256(abi.encode(block.chainid, address(this), signer, pageNumber,
            keccak256(continuation), basis.admission, basis.generation, basis.epoch, basis.executionSet));
    }
}

contract ContractCursorTest is FilesCarrierIndexTest {
    event log_named_uint(string key, uint256 val);

    function _reader() private returns (FilesPageReader) {
        return new FilesPageReader(ledger, new FilesLiveLens(ledger, index), FilesCarrierIndex(address(index)));
    }

    function _basis() private view returns (FilesPageReader.Basis memory) {
        return FilesPageReader.Basis(admissions(), index.generation(), registry.epoch(), ledger.executionSet());
    }

    function _authors() private view returns (bytes32[] memory p) {
        p = new bytes32[](2); p[0] = pid(address(this)); p[1] = pid(address(alice));
    }

    function _file(bytes32 folder_, string memory label, uint256 salt, bool byAlice, bytes32 tag) private returns (bytes32 revision) {
        bytes32 file = byAlice ? alice.create(bytes32(salt)) : ledger.create(bytes32(salt));
        bytes memory body = bytes.concat(abi.encode(file), bytes("hello"));
        revision = byAlice ? alice.publish(rt, body) : ledger.publish(rt, body);
        if (byAlice) alice.bind(HEAD, file, 0, revision, 0);
        else ledger.bind(HEAD, file, 0, revision, 0);
        ledger.publish(nt, bytes(label));
        if (byAlice) alice.bind(FOLDER, folder_, keccak256(bytes(label)), file, 0);
        else ledger.bind(FOLDER, folder_, keccak256(bytes(label)), file, 0);
        if (tag != 0) {
            if (byAlice) alice.bind(TAG, revision, tag, file, 0);
            else ledger.bind(TAG, revision, tag, file, 0);
        }
    }

    function _signature(uint256 privateKey, bytes32 digest_) private pure returns (bytes memory) {
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(privateKey, digest_);
        return abi.encodePacked(r, s, v);
    }

    function test_signed_onchain_cursor_walk_is_complete_only_at_origin_to_end() public {
        bytes32 folder_ = _directory(1);
        bytes32 tag = bytes32(uint256(99));
        bytes32 first = _file(folder_, "a", 2, false, tag);
        _file(folder_, "b", 3, false, 0);
        bytes32 last = _file(folder_, "c", 4, true, tag);
        FilesPageReader.Query memory q = FilesPageReader.Query(tag, 2, false, "");
        ContractCursorConsumer c = new ContractCursorConsumer(_reader(), eoaA, folder_, _authors(), q, _basis());
        require(first != last && c.pageNumber() == 0 && !c.complete(), "fixture/start");
        for (uint256 i; i < 3; ++i) {
            bytes memory sig = _signature(PK_A, c.digest());
            (uint256 gasUsed, uint64 scanned, uint256 rows, bool done) = c.advance(sig, "");
            emit log_named_uint("paid page gas", gasUsed);
            require(gasUsed > 0 && scanned == 1 && rows == (i == 1 ? 0 : 1), "per-page scan and filter");
            require(done == (i == 2) && c.complete() == (i == 2), "no suffix-only completion");
        }
        require(c.pageNumber() == 3 && c.rawTotal() == 3 && c.scannedTotal() == 3 && c.matchedTotal() == 2,
            "full origin-to-end tagged walk");
        require(c.matchedRevisionDigest() == keccak256(abi.encode(keccak256(abi.encode(bytes32(0), first)), last)),
            "selected-revision tag included wrong file");
    }

    function test_forged_claim_wrong_signer_and_replayed_step_leave_cursor_unchanged() public {
        bytes32 folder_ = _directory(10);
        _file(folder_, "a", 11, false, 0);
        _file(folder_, "b", 12, true, 0);
        FilesPageReader.Query memory q;
        ContractCursorConsumer c = new ContractCursorConsumer(_reader(), eoaA, folder_, _authors(), q, _basis());
        bytes memory firstSig = _signature(PK_A, c.digest());
        ContractCursorConsumer other = new ContractCursorConsumer(c.reader(), eoaA, folder_, _authors(), q, _basis());
        try other.advance(firstSig, "") returns (uint256, uint64, uint256, bool) {
            revert("cross-session signature accepted");
        } catch (bytes memory err) { expectSel(err, ContractCursorConsumer.E_SIGNATURE.selector, "session domain refusal"); }
        try c.advance(firstSig, bytes("offchain-forgery")) returns (uint256, uint64, uint256, bool) {
            revert("forged cursor accepted");
        } catch (bytes memory err) { expectSel(err, ContractCursorConsumer.E_SESSION.selector, "forged claim refusal"); }
        try c.advance(_signature(PK_B, c.digest()), "") returns (uint256, uint64, uint256, bool) {
            revert("wrong signer accepted");
        } catch (bytes memory err) { expectSel(err, ContractCursorConsumer.E_SIGNATURE.selector, "wrong signer refusal"); }
        require(c.pageNumber() == 0 && c.cursorHash() == keccak256(""), "failed steps changed origin");
        c.advance(firstSig, "");
        bytes32 stored = c.cursorHash();
        require(stored != keccak256("") && c.pageNumber() == 1 && !c.complete(), "cursor not persisted");
        try c.advance(firstSig, "") returns (uint256, uint64, uint256, bool) {
            revert("replayed signature accepted");
        } catch (bytes memory err) { expectSel(err, ContractCursorConsumer.E_SIGNATURE.selector, "replay refusal"); }
        require(c.pageNumber() == 1 && c.cursorHash() == stored && c.scannedTotal() == 1,
            "rejected step mutated session");
    }

    function test_stale_basis_after_unrelated_admission_refuses_resume_without_state_change() public {
        bytes32 folder_ = _directory(20);
        _file(folder_, "a", 21, false, 0);
        _file(folder_, "b", 22, true, 0);
        FilesPageReader.Query memory q;
        ContractCursorConsumer c = new ContractCursorConsumer(_reader(), eoaA, folder_, _authors(), q, _basis());
        c.advance(_signature(PK_A, c.digest()), "");
        bytes32 stored = c.cursorHash();
        ledger.publish(BINARY, bytes("unrelated new admission"));
        try c.advance(_signature(PK_A, c.digest()), "") returns (uint256, uint64, uint256, bool) {
            revert("stale fixed basis accepted");
        } catch (bytes memory err) { expectSel(err, ContractCursorConsumer.E_PAGE.selector, "basis drift refusal"); }
        require(c.pageNumber() == 1 && c.cursorHash() == stored && c.scannedTotal() == 1 && !c.complete(),
            "stale failure changed pinned session");
    }
}
