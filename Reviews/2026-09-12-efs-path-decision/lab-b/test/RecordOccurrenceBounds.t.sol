// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import {LabBase} from "./LabBase.sol";
import {Ledger} from "../src/Ledger.sol";
import {Keys} from "../src/Keys.sol";

interface VmRecordStorage {
    function store(address target, bytes32 slot, bytes32 value) external;
}

/// Arithmetic/atomicity falsifiers, NOT billions of real admissions or a throughput run.
/// Only the count of a genuinely published, retained short Record is injected.
contract RecordOccurrenceBoundsTest is LabBase {
    error UnexpectedOccurrenceIncrement(uint256 fullCount, uint32 publicCount);
    VmRecordStorage private constant storageVm =
        VmRecordStorage(address(uint160(uint256(keccak256("hevm cheat code")))));
    bytes private constant BODY = hex"11223344556677";
    bytes32 private recordId;
    bytes32 private metaSlot;
    uint256 private lowMeta;

    function setUp() public override {
        super.setUp();
        ledger.publish(BINARY, BODY);
        recordId = rid(BINARY, BODY);
        // forge inspect Ledger storage-layout: _record is mapping slot 2;
        // its RecordCell has typeId at +0, packed meta at +1.
        metaSlot = bytes32(uint256(keccak256(abi.encode(recordId, uint256(2)))) + 1);
        lowMeta = uint256(ledger.extsload(metaSlot)) & ((uint256(1) << 80) - 1);
        require(lowMeta == 1 | (uint256(7) << 48), "real first admission and body length");
        _assertRecord(1);
    }

    // Removing the common guard (or using > rather than >=) must fail these.
    function test_max_duplicate_publish_refuses_without_state_or_index_change() public {
        _inject(type(uint32).max);
        _refuse(one(aPublish(BINARY, BODY)), _bodies(1, true));
        _assertRecord(type(uint32).max);
    }

    function test_max_reuse_refuses_without_state_or_index_change() public {
        _inject(type(uint32).max);
        _refuse(one(aReuse(BINARY, recordId)), new bytes[](1));
        _assertRecord(type(uint32).max);
    }

    // An off-by-one overly strict guard must fail the successful increment.
    function test_max_minus_one_allows_exactly_one_publish() public {
        _inject(type(uint32).max - 1);
        ledger.publish(BINARY, BODY);
        _assertRecord(type(uint32).max);
        _assertIncrement();
        _refuse(one(aPublish(BINARY, BODY)), _bodies(1, true));
    }

    function test_max_minus_one_allows_exactly_one_reuse() public {
        _inject(type(uint32).max - 1);
        ledger.execute(one(aReuse(BINARY, recordId)), new bytes[](1), 1);
        _assertRecord(type(uint32).max);
        _assertIncrement();
        _refuse(one(aReuse(BINARY, recordId)), new bytes[](1));
    }

    // The first leaf reaches MAX and writes/indexes a valid prefix; the second
    // must refuse, rolling back that prefix as well as final publication state.
    function test_second_publish_at_max_rolls_back_first_reuse_prefix() public {
        _inject(type(uint32).max - 1);
        bytes[] memory bodies = new bytes[](2);
        bodies[1] = BODY;
        _refuse(two(aReuse(BINARY, recordId), aPublish(BINARY, BODY)), bodies);
        _assertRecord(type(uint32).max - 1);
    }

    function test_second_reuse_at_max_rolls_back_first_publish_prefix() public {
        _inject(type(uint32).max - 1);
        bytes[] memory bodies = new bytes[](2);
        bodies[0] = BODY;
        _refuse(two(aPublish(BINARY, BODY), aReuse(BINARY, recordId)), bodies);
        _assertRecord(type(uint32).max - 1);
    }

    // A uint32 cast before the comparison drops this injected high count bit.
    function test_high_count_bit_refuses_publish_and_reuse_without_truncating_check() public {
        _inject(uint256(1) << 32);
        _refuse(one(aPublish(BINARY, BODY)), _bodies(1, true));
        _refuse(one(aReuse(BINARY, recordId)), new bytes[](1));
        require(uint256(ledger.extsload(metaSlot)) >> 80 == uint256(1) << 32, "high bit retained");
    }

    function test_fresh_one_withdraw_zero_reuse_one_keeps_retained_record() public {
        ledger.execute(one(aWithdraw(1)), new bytes[](1), 1);
        _assertRecord(0);
        ledger.execute(one(aReuse(BINARY, recordId)), new bytes[](1), 2);
        _assertRecord(1);
        (uint64 a, uint64 r, uint64 b, uint64 p) = ledger.counts();
        require(a == 3 && r == 1 && b == 0 && p == 3, "retained identity not recreated");
        (uint64 count, uint64 live,,) = index.postingHead(Keys.byRecordList(recordId));
        require(
            count == 2 && live == 1 && index.postingAt(Keys.byRecordList(recordId), 1) == 3,
            "ordinary occurrence postings"
        );
    }

    function _inject(uint256 count) private {
        storageVm.store(address(ledger), metaSlot, bytes32(lowMeta | (count << 80)));
    }

    function _bodies(uint256 n, bool publishBody) private pure returns (bytes[] memory bodies) {
        bodies = new bytes[](n);
        if (publishBody) bodies[0] = BODY;
    }

    function _assertRecord(uint32 count) private view {
        (bytes32 t, uint64 first, uint32 occurrences, bytes memory bodyBytes) = ledger.record(recordId);
        require(
            t == BINARY && first == 1 && occurrences == count && keccak256(bodyBytes) == keccak256(BODY),
            "retained Record tuple"
        );
        require(uint256(ledger.extsload(metaSlot)) == lowMeta | (uint256(count) << 80), "full packed metadata");
    }

    function _assertIncrement() private view {
        (uint64 a, uint64 r, uint64 b, uint64 p) = ledger.counts();
        require(
            a == 2 && r == 1 && b == 0 && p == 2 && ledger.nonces(address(this)) == 2,
            "one admission not a fresh Record"
        );
        bytes32 key = Keys.byRecordList(recordId);
        (uint64 count, uint64 live, uint64 last,) = index.postingHead(key);
        require(count == 2 && live == 2 && last == 2 && index.postingAt(key, 1) == 2, "increment indexed");
    }

    function _refuse(Ledger.Action[] memory actions, bytes[] memory bodies) private {
        uint64 nonce = ledger.nonces(address(this));
        bytes32 publicationId = keccak256(abi.encode(address(this), nonce, keccak256(abi.encode(actions))));
        bytes32 beforeState = _state(publicationId);
        (bool ok, bytes memory err) = address(ledger).call(abi.encodeCall(ledger.execute, (actions, bodies, nonce)));
        if (ok) {
            (,, uint32 publicCount,) = ledger.record(recordId);
            revert UnexpectedOccurrenceIncrement(uint256(ledger.extsload(metaSlot)) >> 80, publicCount);
        }
        require(
            keccak256(err) == keccak256(abi.encodeWithSelector(Ledger.E_BOUNDS.selector, uint256(7))),
            "exact occurrence bounds code"
        );
        require(_state(publicationId) == beforeState, "refusal leaked canonical state or required postings");
    }

    function _read(address target, bytes memory input) private view returns (bytes memory output) {
        bool ok;
        (ok, output) = target.staticcall(input);
        require(ok, "snapshot read failed");
    }

    function _state(bytes32 publicationId) private view returns (bytes32 h) {
        h = keccak256(
            abi.encode(
                ledger.extsload(metaSlot),
                ledger.nonces(address(this)),
                ledger.publicationOf(publicationId),
                _read(address(ledger), abi.encodeCall(ledger.counts, ())),
                _read(address(ledger), abi.encodeCall(ledger.record, (recordId))),
                index.lastProcessed(),
                index.lastPublication(),
                index.generation()
            )
        );
        // Includes retained rows plus absent rows touched by a two-leaf failure,
        // also when refusal follows the successful MAX-1 increment.
        for (uint64 i = 1; i <= 4; ++i) {
            h = keccak256(
                abi.encode(
                    h,
                    _read(address(ledger), abi.encodeCall(ledger.admission, (i))),
                    _read(address(ledger), abi.encodeCall(ledger.evidence, (i))),
                    ledger.publicationContext(i)
                )
            );
        }
        bytes32[4] memory keys = [
            Keys.byTypeList(BINARY),
            Keys.byAuthorList(pid(address(this))),
            Keys.byRecordList(recordId),
            Keys.uniqueByTypeList(BINARY)
        ];
        for (uint256 i; i < keys.length; ++i) {
            h = keccak256(
                abi.encode(
                    h,
                    _read(address(index), abi.encodeCall(index.postingHead, (keys[i]))),
                    index.postingWord(keys[i], 0),
                    index.postingWord(keys[i], 1),
                    index.postingAt(keys[i], 0),
                    index.postingAt(keys[i], 1),
                    index.postingAt(keys[i], 2)
                )
            );
        }
    }
}
