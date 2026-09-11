// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {LensPlan} from "./LensPlan.sol";
import {BindingFold} from "./BindingFold.sol";
import {StateStore} from "./StateStore.sol";
import {StatePointReads} from "./StatePointReads.sol";
import {StateBindingReads} from "./StateBindingReads.sol";
import {StateReadPrimitives} from "./StateReadPrimitives.sol";
import {StorageByteView} from "./StorageByteView.sol";

/// @notice Current revision-one, trusted-publication B0 experiment. Not authenticated C0.
library StateLensReads {
    error PlanUnavailable(bytes32 planRecordId);
    error PlanMalformed(bytes32 planRecordId, uint8 rejectCode);
    error ResolveNotAccepted(uint8 presence, uint8 reasonCode);

    function validatePlan(StateStore.Store storage s, bytes32 id) internal view returns (bool ok, uint8 code) {
        (bytes32 typeId, bytes memory body) = load(s, id);
        code = LensPlan.validate(typeId, body);
        return (code == 0, code);
    }

    function resolveStrict(StateStore.Store storage s, bytes32 id, bytes32 position, uint8 acceptMask)
        internal
        view
        returns (LensPlan.ResolvedTarget memory, LensPlan.ResolveResult memory r)
    {
        r = resolve(s, id, position);
        if (acceptMask & (uint8(1) << uint8(r.presence)) == 0) {
            revert ResolveNotAccepted(uint8(r.presence), r.reasonCode);
        }
        return (r.target, r);
    }

    function resolve(StateStore.Store storage s, bytes32 id, bytes32 position)
        internal
        view
        returns (LensPlan.ResolveResult memory r)
    {
        (bytes32 typeId, bytes memory body) = load(s, id);
        uint8 code = LensPlan.validate(typeId, body);
        if (code != 0) revert PlanMalformed(id, code);
        LensPlan.Plan memory p = LensPlan.decode(body);
        (bytes32 revision,, uint64 high) = StateReadPrimitives.basis(s, 0, id);
        if (block.number > type(uint64).max) revert StorageByteView.ErrReadState(id);
        // Explicitly bounded before narrowing the executing block.
        // forge-lint: disable-next-line(unsafe-typecast)
        r.basis = LensPlan.BasisReport(revision, uint64(block.number), high, 0);
        r.winnerIndex = LensPlan.WINNER_NONE;
        if (p.semanticsProfileId != LensPlan.SEMANTICS_PROFILE_B0) {
            r.presence = LensPlan.Presence.UNSUPPORTED;
            r.reasonCode = 1;
            return r;
        }
        BindingFold.Head[] memory heads = new BindingFold.Head[](p.entries.length);
        uint256 start;
        while (start < heads.length) {
            uint256 end = heads.length;
            if (p.combiner == 1) {
                end = start + 1;
                while (end < heads.length && p.entries[end].tier == p.entries[start].tier) ++end;
            }
            for (uint256 i = start; i < end; ++i) {
                bytes32 key = LensPlan.deriveBindingKey(p.entries[i].principalId, position);
                bytes32 headRevision;
                uint64 headHigh;
                (heads[i], headRevision, headHigh) = StateBindingReads.getBindingHead(s, key);
                if (headRevision != revision || headHigh != high) revert StorageByteView.ErrReadState(key);
                // B0 authority is intrinsic only under this host's explicit synthetic
                // trusted-publication premise. No managed authority grading is claimed.
                if (heads[i].state == 1) ++r.presentCount;
            }
            (LensPlan.Presence presence, uint16 winner, uint16 agree) = combine(heads, start, end, p);
            r.presence = presence;
            if (presence == LensPlan.Presence.FOUND) {
                BindingFold.Head memory h = heads[winner];
                r.target = LensPlan.ResolvedTarget(h.targetKind, h.targetA, h.targetLeaf);
                r.winnerIndex = winner;
                r.winnerTier = p.entries[winner].tier;
                r.winnerAdmissionOrdinal = h.admissionOrdinal;
                r.agreeCount = agree;
            }
            if (presence != LensPlan.Presence.ABSENT || p.combiner != 1) return r;
            start = end;
        }
    }

    function load(StateStore.Store storage s, bytes32 id) private view returns (bytes32 typeId, bytes memory body) {
        uint64 first;
        (typeId, body, first) = StatePointReads.getRecord(s, id);
        if (first == 0) revert PlanUnavailable(id);
        // The old projection validates row shape, not content identity. Do not
        // interpret substituted retained bytes as an ordinary admitted PlanId.
        if (keccak256(abi.encode(keccak256("efs2/record/1"), typeId, keccak256(body))) != id) {
            revert StorageByteView.ErrReadState(id);
        }
    }

    function combine(BindingFold.Head[] memory heads, uint256 start, uint256 end, LensPlan.Plan memory p)
        private
        pure
        returns (LensPlan.Presence, uint16 winner, uint16 agree)
    {
        winner = LensPlan.WINNER_NONE;
        uint16 present;
        uint16 qualifying;
        for (uint256 i = start; i < end; ++i) {
            if (heads[i].state != 1) continue;
            ++present;
            if (p.combiner != 2) {
                if (winner == LensPlan.WINNER_NONE) {
                    // Plan validation bounds all indexes below 64.
                    // forge-lint: disable-next-line(unsafe-typecast)
                    winner = uint16(i);
                } else if (!equal(heads[i], heads[winner])) {
                    return (LensPlan.Presence.CONFLICT, LensPlan.WINNER_NONE, 0);
                }
            } else {
                bool seen;
                for (uint256 j = start; j < i; ++j) {
                    if (heads[j].state == 1 && equal(heads[i], heads[j])) {
                        seen = true;
                        break;
                    }
                }
                if (seen) continue;
                uint16 count;
                for (uint256 j = i; j < end; ++j) {
                    if (heads[j].state == 1 && equal(heads[i], heads[j])) ++count;
                }
                if (count >= p.thresholdK) {
                    ++qualifying;
                    // Plan validation bounds all indexes below 64.
                    // forge-lint: disable-next-line(unsafe-typecast)
                    winner = uint16(i);
                    agree = count;
                }
            }
        }
        if (p.combiner == 2) {
            if (qualifying > 1) return (LensPlan.Presence.CONFLICT, LensPlan.WINNER_NONE, 0);
            if (qualifying == 1) return (LensPlan.Presence.FOUND, winner, agree);
        } else if (present != 0 && (p.combiner == 1 || present == end - start)) {
            return (LensPlan.Presence.FOUND, winner, present);
        }
        return (LensPlan.Presence.ABSENT, LensPlan.WINNER_NONE, 0);
    }

    function equal(BindingFold.Head memory a, BindingFold.Head memory b) private pure returns (bool) {
        return a.targetKind == b.targetKind && a.targetA == b.targetA && a.targetLeaf == b.targetLeaf;
    }
}
