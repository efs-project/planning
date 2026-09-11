// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {StateStore} from "C0Core/StateStore.sol";
import {StateKernel} from "C0Core/StateKernel.sol";
import {Preparation} from "C0Core/Preparation.sol";
import {BindingFold} from "C0Core/BindingFold.sol";
import {IndexKeys} from "C0Core/IndexKeys.sol";
import {UpgradeAdmissionLibrary} from "Foundation/UpgradeAdmissionLibrary.sol";
import {IndexLayerStorage} from "./IndexLayerStorage.sol";
import {FieldWalk} from "./FieldWalk.sol";

/// @notice The WRITE HOOK, wrapped around the pinned kernel's admission.
///
/// Why a wrapper and not a kernel edit: the foundation controller copies
/// `admissionLibrary`/`admissionCodehash` from the previous revision into every
/// new execution set and checks the core's `configuration()` against them, so a
/// populated pair cannot be upgraded onto a different (hooked) kernel library.
/// The hook therefore runs INSIDE `executeAuthorized` around the pinned
/// `UpgradeAdmissionLibrary.admit` (a nested delegatecall in the proxy's
/// storage): binding heads are read before admission (the kernel then reads
/// them warm, so the pre-read is net-free), the kernel admits, and the hook
/// derives every bit from the resulting heads and target records in storage.
/// Nothing from calldata becomes an index bit.
library IndexedAdmission {
    using IndexLayerStorage for IndexLayerStorage.Layout;

    struct Pre {
        uint256 leaf; // index into p.leaves
        bytes32 key; // binding key
        bytes32 scopeKey; // kind-10 scope of the position
        uint256 meta; // binding meta before admission
        bytes32 target; // binding target before admission
    }

    error IndexIntegrity(uint8 code);

    uint256 private constant U48 = (uint256(1) << 48) - 1;

    function admit(
        StateStore.Store storage s,
        StateKernel.VerifiedContext memory v,
        StateKernel.Publication memory p,
        Preparation.Config memory prep,
        uint32 revision
    ) external returns (StateKernel.AdmitResult memory r) {
        Pre[] memory pre = preRead(s, p);
        r = UpgradeAdmissionLibrary.admit(s, v, p, prep, revision);
        if (pre.length != 0) afterAdmit(s, r, pre);
    }

    /// Binding-typed leaves and their heads BEFORE the kernel runs. Malformed
    /// bodies are skipped here; the kernel rejects the publication anyway.
    function preRead(StateStore.Store storage s, StateKernel.Publication memory p)
        private
        view
        returns (Pre[] memory pre)
    {
        bytes32 setType = s.init.bindingSetType;
        bytes32 tombType = s.init.bindingTombstoneType;
        uint256 n;
        for (uint256 i; i < p.leaves.length; ++i) {
            bytes32 t = p.leaves[i].typeId;
            if ((t == setType || t == tombType) && p.leaves[i].body.length >= 96) ++n;
        }
        pre = new Pre[](n);
        if (n == 0) return pre;
        bytes32 principal = p.header.principalId;
        uint256 k;
        for (uint256 i; i < p.leaves.length; ++i) {
            bytes32 t = p.leaves[i].typeId;
            if (!((t == setType || t == tombType) && p.leaves[i].body.length >= 96)) continue;
            bytes memory body = p.leaves[i].body;
            bytes32 purpose;
            bytes32 subject;
            bytes32 role;
            assembly ("memory-safe") {
                purpose := mload(add(body, 32))
                subject := mload(add(body, 64))
                role := mload(add(body, 96))
            }
            bytes32 key = BindingFold.bindingKey(principal, positionKey(purpose, subject, role));
            StateStore.BindingRow storage row = s.bindings[key];
            pre[k++] = Pre(i, key, IndexKeys.scope(principal, purpose, subject), row.meta, row.target);
        }
    }

    function positionKey(bytes32 purpose, bytes32 subject, bytes32 role) private pure returns (bytes32) {
        BindingFold.Effect memory e;
        e.purpose = purpose;
        e.subject = subject;
        e.fieldRole = role;
        return BindingFold.positionKey(e);
    }

    function afterAdmit(StateStore.Store storage s, StateKernel.AdmitResult memory r, Pre[] memory pre) private {
        IndexLayerStorage.Layout storage l = IndexLayerStorage.layout();
        for (uint256 j; j < pre.length; ++j) {
            Pre memory e = pre[j];
            if (r.leaves[e.leaf].outcome != 1) continue; // only freshly admitted leaves changed a head
            StateStore.BindingRow storage post = s.bindings[e.key];
            BindingFold.Head memory h1 = BindingFold.unpack(post.meta, post.target);
            BindingFold.Head memory h0 = BindingFold.unpack(e.meta, e.target);
            bytes32 newType = h1.state == 1 && h1.targetKind == 1 ? s.records[h1.targetA].typeId : bytes32(0);
            bytes32 oldType = h0.state == 1 && h0.targetKind == 1 ? s.records[h0.targetA].typeId : bytes32(0);
            uint256 famNew = newType == bytes32(0) ? 0 : l.typeFamilies[newType];
            uint256 famOld = oldType == bytes32(0) ? 0 : (oldType == newType ? famNew : l.typeFamilies[oldType]);
            if (famNew == 0 && famOld == 0) continue;
            uint64 position = h0.state == 0 ? scopeCount(s, e.scopeKey) - 1 : locate(s, e.scopeKey, e.key);
            bytes32[8] memory newBuckets;
            if (famNew != 0) {
                bytes memory body = s.records[h1.targetA].body;
                for (uint256 i; i < 8; ++i) {
                    uint64 ord = uint64(uint32(famNew >> (32 * i)));
                    if (ord == 0) break;
                    IndexLayerStorage.Family storage f = l.families[ord];
                    if (IndexLayerStorage.retiredAtOf(f.packed) != 0) continue;
                    bytes32 bucket = IndexKeys.scalar(FieldWalk.extract(body, f.program));
                    newBuckets[i] = bucket;
                    l.setBit(ord, e.scopeKey, bucket, position);
                }
            }
            if (famOld != 0) {
                bytes memory oldBody = s.records[h0.targetA].body;
                for (uint256 i; i < 8; ++i) {
                    uint64 ord = uint64(uint32(famOld >> (32 * i)));
                    if (ord == 0) break;
                    IndexLayerStorage.Family storage f = l.families[ord];
                    if (IndexLayerStorage.retiredAtOf(f.packed) != 0) continue;
                    bytes32 bucket = IndexKeys.scalar(FieldWalk.extract(oldBody, f.program));
                    if (oldType == newType && newBuckets[i] == bucket) continue;
                    l.clearBit(ord, e.scopeKey, bucket, position);
                }
            }
        }
    }

    function scopeCount(StateStore.Store storage s, bytes32 scopeKey) private view returns (uint64) {
        return uint64(s.postings[IndexKeys.posting(bytes32(0), 10, 0, scopeKey)].head);
    }

    /// Reverse locator for a rebind: the key's first admission ordinal (kind-8
    /// word 0, entry 0) found by binary search over the ordinal-sorted kind-10
    /// list. O(log N) word reads, no extra storage, nothing from calldata.
    function locate(StateStore.Store storage s, bytes32 scopeKey, bytes32 key) private view returns (uint64) {
        uint64 first = uint64(s.postingWords[IndexKeys.posting(bytes32(0), 8, 0, key)][0] & U48);
        bytes32 k10 = IndexKeys.posting(bytes32(0), 10, 0, scopeKey);
        uint64 lo;
        uint64 hi = uint64(s.postings[k10].head);
        while (lo < hi) {
            uint64 mid = lo + (hi - lo) / 2;
            if (ordinalAt(s, k10, mid) < first) lo = mid + 1;
            else hi = mid;
        }
        if (ordinalAt(s, k10, lo) != first) revert IndexIntegrity(1);
        return lo;
    }

    function ordinalAt(StateStore.Store storage s, bytes32 k10, uint64 position) private view returns (uint64) {
        return uint64((s.postingWords[k10][position / 5] >> (48 * (position % 5))) & U48);
    }
}
