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
import {ScopeOrdinals} from "./ScopeOrdinals.sol";

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
///
/// Positions (round 2, README §8 item 1): a first binding's position is the
/// scope's PRE-admission kind-10 count plus the number of earlier first
/// bindings of distinct keys in the same scope in this publication, in leaf
/// order — exactly the order the kernel appends them. The pre-admission count
/// is read in `preRead` (warm for the kernel's own append, so net-free). A
/// second leaf on the same key inside one publication is a rebind the kernel
/// journals against the first leaf's after-value; the hook skips it, because
/// the first occurrence already reads the publication's FINAL head for that
/// key from storage.
library IndexedAdmission {
    using IndexLayerStorage for IndexLayerStorage.Layout;

    struct Pre {
        uint256 leaf; // index into p.leaves
        bytes32 key; // binding key
        bytes32 scopeKey; // kind-10 scope of the position
        uint256 meta; // binding meta before admission
        bytes32 target; // binding target before admission
        uint64 scopeCount; // kind-10 count of the scope BEFORE admission (read only for a first binding)
    }

    error IndexIntegrity(uint8 code);

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
            bytes32 scopeKey = IndexKeys.scope(principal, purpose, subject);
            StateStore.BindingRow storage row = s.bindings[key];
            uint256 meta = row.meta;
            // A first binding appends to the scope: read its count now (the kernel re-reads it warm).
            uint64 count = uint8(meta) == 0 ? scopeCount(s, scopeKey) : 0;
            pre[k++] = Pre(i, key, scopeKey, meta, row.target, count);
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
        uint256 n = pre.length;
        uint256 layout = type(uint256).max; // read lazily: only a rebind needs the locator
        // Pass 1: which leaves carry a position. `skip`: not freshly admitted, or a
        // later leaf on a key an earlier admitted leaf already carries (the kernel
        // treated it as a rebind of that leaf; the first occurrence reads the final
        // head). `isNew`: the first binding of a distinct key in this publication.
        bool[] memory skip = new bool[](n);
        bool[] memory isNew = new bool[](n);
        for (uint256 j; j < n; ++j) {
            if (r.leaves[pre[j].leaf].outcome != 1) {
                skip[j] = true;
                continue;
            }
            for (uint256 i; i < j; ++i) {
                if (!skip[i] && pre[i].key == pre[j].key) {
                    skip[j] = true;
                    break;
                }
            }
            if (!skip[j]) isNew[j] = uint8(pre[j].meta) == 0;
        }
        // Pass 2: positions in leaf order from the pre-admission count, then bits.
        for (uint256 j; j < n; ++j) {
            if (skip[j]) continue;
            Pre memory e = pre[j];
            StateStore.BindingRow storage post = s.bindings[e.key];
            BindingFold.Head memory h1 = BindingFold.unpack(post.meta, post.target);
            BindingFold.Head memory h0 = BindingFold.unpack(e.meta, e.target);
            bytes32 newType = h1.state == 1 && h1.targetKind == 1 ? s.records[h1.targetA].typeId : bytes32(0);
            bytes32 oldType = h0.state == 1 && h0.targetKind == 1 ? s.records[h0.targetA].typeId : bytes32(0);
            uint256 famNew = newType == bytes32(0) ? 0 : l.typeFamilies[newType];
            uint256 famOld = oldType == bytes32(0) ? 0 : (oldType == newType ? famNew : l.typeFamilies[oldType]);
            if (famNew == 0 && famOld == 0) continue;
            uint64 position;
            if (isNew[j]) {
                uint64 before;
                for (uint256 i; i < j; ++i) {
                    if (isNew[i] && pre[i].scopeKey == e.scopeKey) ++before;
                }
                position = e.scopeCount + before;
            } else {
                if (layout == type(uint256).max) layout = ScopeOrdinals.layoutOf(s);
                position = ScopeOrdinals.locate(s, ScopeOrdinals.k10(e.scopeKey), e.key, layout);
            }
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
        return ScopeOrdinals.count(s, ScopeOrdinals.k10(scopeKey));
    }
}
