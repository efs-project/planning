// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;
import {AdmissionLibrary} from "../src/AdmissionLibrary.sol";
import {PointReadLibrary} from "../src/PointReadLibrary.sol";
import {PreparationHelper} from "../src/PreparationHelper.sol";
import {QueryReadLibrary} from "../src/QueryReadLibrary.sol";
import {StateKernel} from "../src/StateKernel.sol";
import {IndexKeys} from "../src/IndexKeys.sol";
import {BindingReadHarness} from "./BindingReadHarness.sol";
import {K10ScopeHarness} from "./K10ScopeHarness.sol";
import {StateAuditPages} from "../src/StateAuditPages.sol";
import {VmBindingReads} from "./AuditPages.t.sol";

interface VmK10 {
    function cool(address target) external;
}

contract K10ScopeTest {
    event ReadGas(uint8 mode, uint256 coldLookup, uint256 warmLookup, uint256 coldHistory, uint256 warmHistory);
    bytes32 private constant AUTHOR = bytes32(type(uint256).max);
    bytes32 private constant REALM = keccak256("binding-read-realm");
    bytes32 private constant REVISION = keccak256("binding-read-revision");
    VmBindingReads private constant vm = VmBindingReads(address(uint160(uint256(keccak256("hevm cheat code")))));

    function candidateJson() private view returns (string memory) {
        return vm.readFile("../2026-09-05-mvp-build-start/type-inputs/artifacts.v1.json");
    }

    function candidateGroup(uint256 index) private view returns (bytes memory) {
        return vm.parseBytes(
            string.concat(
                "0x", vm.parseJsonString(candidateJson(), string.concat(".groups[", vm.toString(index), "].groupHex"))
            )
        );
    }

    function candidateType(uint256 groupIndex, uint256 memberIndex) private view returns (bytes32) {
        return vm.parseJsonBytes32(
            candidateJson(),
            string.concat(
                ".groups[", vm.toString(groupIndex), "].members[", vm.toString(memberIndex), "].temporaryTypeSchemaId"
            )
        );
    }

    function intrinsicBlob() private pure returns (bytes memory blob) {
        blob = abi.encodePacked(
            hex"0001001154797065536368656d6147726f75702f31000000",
            bytes32(0),
            hex"0001000a67726f75704279746573051ffe0000000000000000"
        );
    }

    function initValue() private view returns (StateKernel.Init memory init, bytes32 metaId) {
        bytes memory blob = intrinsicBlob();
        bytes memory intrinsic = abi.encodePacked(uint16(1), uint16(blob.length), blob);
        metaId = keccak256(
            abi.encode(
                keccak256("efs2/typeschema/1"),
                keccak256(abi.encode(keccak256("efs2/typeschema-group/1"), keccak256(intrinsic))),
                uint256(0)
            )
        );
        init = StateKernel.Init(REALM, REVISION, intrinsic, candidateGroup(0), candidateGroup(1));
    }

    function deployHost(uint8 mode) private returns (K10ScopeHarness h, bytes32 metaId) {
        StateKernel.Init memory init;
        (init, metaId) = initValue();
        PreparationHelper helper = new PreparationHelper();
        h = new K10ScopeHarness(
            init, address(helper), address(helper).codehash, address(AdmissionLibrary).codehash, mode
        );
    }

    function identify(StateKernel.Publication memory p) private pure {
        bytes32 domain = keccak256(
            abi.encode(
                keccak256("EIP712Domain(string name,string version)"), keccak256("EFS2-Envelope"), keccak256("1")
            )
        );
        bytes32 statement = keccak256(
            abi.encode(
                keccak256(
                    "PublicationEnvelope(uint16 profile,bytes32 principalId,bytes32 authorityRef,uint64 authEpoch,bytes32 pubNonce,uint64 notAfter,bytes32[] recordIds)"
                ),
                p.header,
                keccak256(abi.encodePacked(p.recordIds))
            )
        );
        p.envelopeId = keccak256(
            abi.encode(keccak256("efs2/envelope/1"), keccak256(abi.encodePacked(hex"1901", domain, statement)))
        );
    }

    function publication(StateKernel.SelectedLeaf[] memory leaves, uint256 nonce)
        private
        pure
        returns (StateKernel.Publication memory p)
    {
        p.header = StateKernel.EnvelopeHeader(1, AUTHOR, 0, 0, bytes32(nonce), 0);
        p.recordIds = new bytes32[](leaves.length);
        p.leafMask = uint64((uint256(1) << leaves.length) - 1);
        p.leaves = leaves;
        for (uint256 i; i < leaves.length; ++i) {
            p.recordIds[i] =
                keccak256(abi.encode(keccak256("efs2/record/1"), leaves[i].typeId, keccak256(leaves[i].body)));
        }
        identify(p);
    }

    function publicationAs(StateKernel.SelectedLeaf[] memory leaves, uint256 nonce, bytes32 principal)
        private
        pure
        returns (StateKernel.Publication memory p)
    {
        p = publication(leaves, nonce);
        p.header.principalId = principal;
        identify(p);
    }

    function publish(K10ScopeHarness h, StateKernel.Publication memory p)
        private
        returns (StateKernel.AdmitResult memory)
    {
        return h.publishTrustedForTest(
            StateKernel.VerifiedContext(p.header.principalId, 1, 0x1234, bytes32(uint256(0xabcd))), p
        );
    }

    function installGroup(K10ScopeHarness h, bytes32 metaId, uint256 groupIndex, uint256 nonce) private {
        StateKernel.SelectedLeaf[] memory leaves = new StateKernel.SelectedLeaf[](1);
        bytes memory group = candidateGroup(groupIndex);
        leaves[0] = StateKernel.SelectedLeaf(0, metaId, abi.encodePacked(uint16(group.length), group));
        publish(h, publication(leaves, nonce));
    }

    function one(bytes32 typeId, bytes memory body, uint256 nonce, bytes32 principal)
        private
        pure
        returns (StateKernel.Publication memory p)
    {
        StateKernel.SelectedLeaf[] memory leaves = new StateKernel.SelectedLeaf[](1);
        leaves[0] = StateKernel.SelectedLeaf(0, typeId, body);
        p = publicationAs(leaves, nonce, principal);
    }

    function testFirstBindingUsesKeyOrdinalNotAdmissionOrdinal() public {
        (K10ScopeHarness h, bytes32 metaId) = deployHost(1);
        installGroup(h, metaId, 0, 1);
        installGroup(h, metaId, 1, 2);
        StateKernel.Publication memory object =
            one(candidateType(0, 0), abi.encodePacked(AUTHOR, bytes32(uint256(99)), hex"00"), 3, AUTHOR);
        publish(h, object);
        bytes32 subject = object.recordIds[0];
        StateKernel.Publication memory tombstone = one(
            candidateType(1, 1), abi.encodePacked(bytes32(uint256(1)), subject, bytes32(uint256(2)), hex"00"), 4, AUTHOR
        );
        tombstone.expectedRevisions = new StateKernel.ExpectedRevision[](1);
        tombstone.expectedRevisions[0] = StateKernel.ExpectedRevision(0, 0);
        uint64 anchor = publish(h, tombstone).leaves[0].admissionOrdinal;
        bytes32 scope = IndexKeys.scope(AUTHOR, bytes32(uint256(1)), subject);
        bytes32 key = IndexKeys.posting(0, 10, 0, scope);
        require(anchor == 4, "unrelated admissions precede binding");

        require(uint48(h.postingWord(key, 0)) == 1, "K10 physical binding-key ordinal must be one");
        StateAuditPages.PageResult memory raw = h.pagePostings(0, 10, 0, scope, StateAuditPages.PageRequest(0, 10, 0));
        require(raw.items[0] == bytes32(uint256(1)), "raw key domain");
        StateAuditPages.HydratedItem[] memory rows;
        (raw, rows) = h.pagePostingsHydrated(0, 10, 0, scope, StateAuditPages.PageRequest(0, 10, 0));
        require(rows[0].ordinal == 4 && rows[0].envelopeId == tombstone.envelopeId, "hydrated admission domain");
    }

    function setup(uint8 mode) private returns (K10ScopeHarness h, bytes32 subject, bytes32 scope) {
        bytes32 meta;
        (h, meta) = deployHost(mode);
        installGroup(h, meta, 0, 1);
        installGroup(h, meta, 1, 2);
        StateKernel.Publication memory object =
            one(candidateType(0, 0), abi.encodePacked(AUTHOR, bytes32(uint256(99)), hex"00"), 3, AUTHOR);
        publish(h, object);
        subject = object.recordIds[0];
        scope = IndexKeys.scope(AUTHOR, bytes32(uint256(1)), subject);
    }

    function mutation(
        bytes32 subject,
        uint256 role,
        uint256 nonce,
        bytes32 author,
        bytes32 predecessor,
        uint32 revision
    ) private view returns (StateKernel.Publication memory p) {
        p = one(
            candidateType(1, 1),
            abi.encodePacked(
                bytes32(uint256(1)),
                subject,
                bytes32(role),
                predecessor == 0 ? bytes(hex"00") : abi.encodePacked(hex"01", predecessor, uint16(0))
            ),
            nonce,
            author
        );
        p.expectedRevisions = new StateKernel.ExpectedRevision[](1);
        p.expectedRevisions[0] = StateKernel.ExpectedRevision(0, revision);
    }

    function page(K10ScopeHarness h, bytes32 scope, uint64 H, uint256 token, uint16 limit)
        private
        view
        returns (StateAuditPages.PageResult memory)
    {
        return h.pagePostings(0, 10, 0, scope, StateAuditPages.PageRequest(token, limit, H));
    }

    function refuses(address host, bytes memory data) private {
        (bool ok,) = host.call(data);
        require(!ok, "expected refusal");
    }

    function testFreshOnlySelectionAndUnknownModesFailClosed() public {
        (K10ScopeHarness initialized,) = deployHost(1);
        refuses(address(initialized), abi.encodeCall(initialized.select, (0)));
        (StateKernel.Init memory init,) = initValue();
        PreparationHelper helper = new PreparationHelper();
        try new K10ScopeHarness(
            init, address(helper), address(helper).codehash, address(AdmissionLibrary).codehash, 2
        ) {
            revert("unknown initial mode accepted");
        } catch (bytes memory initializationError) {
            require(
                keccak256(initializationError)
                    == keccak256(abi.encodeWithSelector(StateKernel.InvalidScopeLayout.selector, uint256(2))),
                "unknown initialization exact refusal"
            );
        }
        (K10ScopeHarness h, bytes32 subject, bytes32 scope) = setup(1);
        refuses(address(h), abi.encodeCall(h.select, (0)));
        refuses(address(h), abi.encodeCall(h.select, (1)));
        refuses(address(h), abi.encodeCall(h.select, (2)));
        h.corruptMode(2);
        refuses(
            address(h), abi.encodeCall(h.pagePostings, (bytes32(0), 10, 0, scope, StateAuditPages.PageRequest(0, 1, 0)))
        );
        StateKernel.Publication memory p = mutation(subject, 1, 4, AUTHOR, 0, 0);
        (bool accepted, bytes memory reason) = address(h)
            .call(
                abi.encodeCall(
                    h.publishTrustedForTest,
                    (StateKernel.VerifiedContext(AUTHOR, 1, 0x1234, bytes32(uint256(0xabcd))), p)
                )
            );
        require(
            !accepted
                && keccak256(reason) == keccak256(abi.encodeWithSelector(StateKernel.InvalidInitialization.selector)),
            "admission unknown mode is invalid initialization"
        );
        h.corruptMode(uint256(1) << 200);
        require(h.scopeLayout() == uint256(1) << 200, "mode getter must not truncate");
        (accepted, reason) = address(h)
            .call(
                abi.encodeCall(
                    h.publishTrustedForTest,
                    (StateKernel.VerifiedContext(AUTHOR, 1, 0x1234, bytes32(uint256(0xabcd))), p)
                )
            );
        require(
            !accepted
                && keccak256(reason) == keccak256(abi.encodeWithSelector(StateKernel.InvalidInitialization.selector)),
            "out-of-byte mode must not become legacy"
        );
        refuses(
            address(h), abi.encodeCall(h.pagePostings, (bytes32(0), 10, 0, scope, StateAuditPages.PageRequest(0, 1, 0)))
        );
        refuses(address(h), abi.encodeCall(h.select, (uint256(256))));
        refuses(
            address(h),
            abi.encodeCall(
                h.publishTrustedForTest, (StateKernel.VerifiedContext(AUTHOR, 1, 0x1234, bytes32(uint256(0xabcd))), p)
            )
        );
    }

    function testPackedBoundariesHistoricalCutsAndInterleavedScopes() public {
        for (uint8 mode; mode < 2; ++mode) {
            (K10ScopeHarness h, bytes32 subject, bytes32 scope) = setup(mode);
            bytes32 other = bytes32(uint256(123));
            for (uint256 i; i < 7; ++i) {
                publish(h, mutation(subject, i + 1, 10 + i * 2, AUTHOR, 0, 0));
                publish(h, mutation(subject, i + 1, 11 + i * 2, other, 0, 0));
            }
            for (uint64 H = 1; H <= 17; ++H) {
                StateAuditPages.PageResult memory p = page(h, scope, H, 0, 100);
                uint64 want = H < 4 ? 0 : (H - 4) / 2 + 1;
                require(p.items.length == want, "historical first-admission prefix");
                for (uint64 j; j < want; ++j) {
                    require(p.items[j] == bytes32(uint256(mode == 0 ? 4 + j * 2 : 1 + j * 2)), "physical domain");
                }
            }
            bytes32 key = IndexKeys.posting(0, 10, 0, scope);
            require(uint48(h.postingWord(key, 1)) == (mode == 0 ? 14 : 11), "sixth entry in second word");
            (uint64 count, uint64 live, uint64 last,, uint64 high) = h.auditCounts(scope);
            require(count == 7 && live == 7 && last == (mode == 0 ? 16 : 13) && high == 17, "count last domain");
            StateAuditPages.PageResult memory start = page(h, scope, 17, 0, 2);
            publish(h, mutation(subject, 99, 100, AUTHOR, 0, 0));
            StateAuditPages.PageResult memory tail = page(h, scope, 17, start.cursor, 100);
            require(tail.items.length == 5 && tail.highWaterOrdinal == 17, "append pinned continuation");
            StateAuditPages.PageResult memory otherPage =
                page(h, IndexKeys.scope(other, bytes32(uint256(1)), subject), 17, 0, 100);
            require(
                otherPage.items.length == 7 && otherPage.items[0] == bytes32(uint256(mode == 0 ? 5 : 2)),
                "author separation"
            );
        }
    }

    function testRebindOldAndSelectedWithdrawalAndReplayKeepFirstAnchor() public {
        for (uint8 mode; mode < 2; ++mode) {
            (K10ScopeHarness h, bytes32 subject, bytes32 scope) = setup(mode);
            StateKernel.Publication memory first = mutation(subject, 1, 4, AUTHOR, 0, 0);
            publish(h, first);
            StateKernel.Publication memory second = mutation(subject, 1, 5, AUTHOR, first.envelopeId, 1);
            second.leaves[0].typeId = candidateType(1, 0);
            second.leaves[0].body = abi.encodePacked(
                bytes32(uint256(1)),
                subject,
                bytes32(uint256(1)),
                hex"01",
                subject,
                hex"00",
                hex"01",
                first.envelopeId,
                uint16(0)
            );
            second.recordIds[0] = keccak256(
                abi.encode(keccak256("efs2/record/1"), second.leaves[0].typeId, keccak256(second.leaves[0].body))
            );
            identify(second);
            publish(h, second);
            require(publish(h, second).leaves[0].outcome == 2, "exact replay reused");
            publish(h, one(candidateType(1, 2), abi.encodePacked(first.envelopeId, uint16(0)), 6, AUTHOR));
            publish(h, one(candidateType(1, 2), abi.encodePacked(second.envelopeId, uint16(0)), 7, AUTHOR));
            require(h.counts().bindingKeys == 1 && h.counts().admissions == 7, "no new key on rebind withdrawal replay");
            bytes32 history = IndexKeys.posting(0, 8, 0, h.bindingKeyAt(1));
            require(uint64(h.postingHead(history)) == 3, "old withdrawal not head history");
            require(uint48(h.postingWord(history, 0)) == 4, "kind8 remains admission domain");
            (StateAuditPages.PageResult memory p, StateAuditPages.HydratedItem[] memory rows) =
                h.pagePostingsHydrated(0, 10, 0, scope, StateAuditPages.PageRequest(0, 10, 4));
            require(
                p.items.length == 1 && rows[0].ordinal == 4 && rows[0].occurrenceStatus == 1,
                "historical active first op"
            );
            (, rows) = h.pagePostingsHydrated(0, 10, 0, scope, StateAuditPages.PageRequest(0, 10, 0));
            require(
                rows[0].ordinal == 4 && rows[0].revokedAtOrdinal == 6 && rows[0].occurrenceStatus == 2,
                "retained first op after withdrawal"
            );
        }
    }

    function testCursorModesScopeAndBasisCannotBeReused() public {
        (K10ScopeHarness legacy, bytes32 subject, bytes32 scope) = setup(0);
        (K10ScopeHarness k10,,) = setup(1);
        for (uint256 i; i < 3; ++i) {
            StateKernel.Publication memory p = mutation(subject, i + 1, 4 + i, AUTHOR, 0, 0);
            publish(legacy, p);
            publish(k10, p);
        }
        uint256 token = page(legacy, scope, 6, 0, 1).cursor;
        refuses(
            address(k10),
            abi.encodeCall(k10.pagePostings, (bytes32(0), 10, 0, scope, StateAuditPages.PageRequest(token, 1, 6)))
        );
        token = page(k10, scope, 6, 0, 1).cursor;
        refuses(
            address(legacy),
            abi.encodeCall(legacy.pagePostings, (bytes32(0), 10, 0, scope, StateAuditPages.PageRequest(token, 1, 6)))
        );
        refuses(
            address(k10),
            abi.encodeCall(
                k10.pagePostingsHydrated, (bytes32(0), 10, 0, scope, StateAuditPages.PageRequest(token, 1, 6))
            )
        );
        refuses(
            address(k10),
            abi.encodeCall(k10.pagePostings, (bytes32(0), 10, 0, scope, StateAuditPages.PageRequest(token, 1, 5)))
        );
        refuses(
            address(k10),
            abi.encodeCall(
                k10.pagePostings, (bytes32(0), 10, 0, bytes32(uint256(5)), StateAuditPages.PageRequest(token, 1, 6))
            )
        );
    }

    function testMalformedKeysHistoryAndPackedWordsRefuse() public {
        (K10ScopeHarness h, bytes32 subject, bytes32 scope) = setup(1);
        for (uint256 i; i < 6; ++i) {
            publish(h, mutation(subject, i + 1, 4 + i, AUTHOR, 0, 0));
        }
        bytes32 key = IndexKeys.posting(0, 10, 0, scope);
        bytes memory call =
            abi.encodeCall(h.pagePostings, (bytes32(0), 10, 0, scope, StateAuditPages.PageRequest(0, 10, 0)));
        uint256 snapshot = vm.snapshotState();
        h.corruptKey(1, 0);
        refuses(address(h), call);
        require(vm.revertToState(snapshot));
        snapshot = vm.snapshotState();
        h.corruptKey(1, bytes32(uint256(42)));
        refuses(address(h), call);
        require(vm.revertToState(snapshot));
        snapshot = vm.snapshotState();
        h.corruptHead(IndexKeys.posting(0, 8, 0, h.bindingKeyAt(1)), 0);
        refuses(address(h), call);
        require(vm.revertToState(snapshot));
        uint256 word = h.postingWord(key, 0);
        uint256[5] memory bad = [
            word | (uint256(1) << 240),
            word - 1,
            word | ((uint256(1) << 48) - 1),
            uint256(2) | (uint256(1) << 48) | (uint256(3) << 96) | (uint256(4) << 144) | (uint256(5) << 192),
            word & ~(((uint256(1) << 48) - 1) << 48)
        ];
        for (uint256 i; i < bad.length; ++i) {
            snapshot = vm.snapshotState();
            h.corruptWord(key, 0, bad[i]);
            refuses(address(h), call);
            require(vm.revertToState(snapshot));
        }
        snapshot = vm.snapshotState();
        h.corruptWord(key, 1, 6 | (uint256(1) << 48));
        refuses(address(h), call);
        require(vm.revertToState(snapshot));
        snapshot = vm.snapshotState();
        h.corruptBindingCount(uint64((uint256(1) << 48) - 1));
        refuses(address(h), call);
        require(vm.revertToState(snapshot));
        snapshot = vm.snapshotState();
        h.corruptHead(key, h.postingHead(key) | (uint256(1) << 192));
        refuses(address(h), call);
        require(vm.revertToState(snapshot));
    }

    function testMeasureColdAndWarmLookupAndHistory() public {
        for (uint8 mode; mode < 2; ++mode) {
            (K10ScopeHarness h, bytes32 subject, bytes32 scope) = setup(mode);
            for (uint256 i; i < 7; ++i) {
                publish(h, mutation(subject, i + 1, 4 + i, AUTHOR, 0, 0));
            }
            bytes32 expected = h.bindingKeyAt(1);
            VmK10(address(vm)).cool(address(h));
            VmK10(address(vm)).cool(address(QueryReadLibrary));
            uint256 start = gasleft();
            bytes32 key = h.scopeLookup(scope);
            uint256 coldLookup = start - gasleft();
            require(key == expected, "lookup same logical key");
            start = gasleft();
            key = h.scopeLookup(scope);
            uint256 warmLookup = start - gasleft();
            require(key == expected, "warm lookup same logical key");
            VmK10(address(vm)).cool(address(h));
            VmK10(address(vm)).cool(address(QueryReadLibrary));
            start = gasleft();
            h.scopeHistory(scope);
            uint256 coldHistory = start - gasleft();
            start = gasleft();
            h.scopeHistory(scope);
            uint256 warmHistory = start - gasleft();
            require(h.scopeHistory(scope)[0].admissionOrdinal == 4, "history is first admission");
            emit ReadGas(mode, coldLookup, warmLookup, coldHistory, warmHistory);
        }
    }

    function testLastValidU48ActualAdmissionAndNextGuard() public {
        (K10ScopeHarness h, bytes32 subject, bytes32 scope) = setup(1);
        uint64 lastValid = uint64((uint256(1) << 48) - 2);
        h.corruptBindingCount(lastValid - 1);
        h.corruptAdmissionCount(lastValid - 1);
        StateKernel.Publication memory p = mutation(subject, 1, 4, AUTHOR, 0, 0);
        require(publish(h, p).leaves[0].admissionOrdinal == lastValid, "last valid admission");
        require(page(h, scope, lastValid, 0, 1).items[0] == bytes32(uint256(lastValid)), "last valid physical key");
        StateKernel.Publication memory next = mutation(subject, 2, 5, AUTHOR, 0, 0);
        refuses(
            address(h),
            abi.encodeCall(
                h.publishTrustedForTest,
                (StateKernel.VerifiedContext(AUTHOR, 1, 0x1234, bytes32(uint256(0xabcd))), next)
            )
        );
        require(h.counts().admissions == lastValid && h.counts().bindingKeys == lastValid, "guard atomic");
    }

    function testSingleAndCumulativeBodyBudgetRemainIdentical() public {
        (K10ScopeHarness h,) = deployHost(1);
        for (uint256 count = 1; count <= 2; ++count) {
            StateKernel.SelectedLeaf[] memory leaves = new StateKernel.SelectedLeaf[](count);
            leaves[0] = StateKernel.SelectedLeaf(0, bytes32(uint256(1)), new bytes(count == 1 ? 8193 : 4096));
            if (count == 2) leaves[1] = StateKernel.SelectedLeaf(1, bytes32(uint256(1)), new bytes(4097));
            StateKernel.Publication memory p = publication(leaves, 10 + count);
            (bool ok, bytes memory reason) = address(h)
                .call(
                    abi.encodeCall(
                        h.publishTrustedForTest,
                        (StateKernel.VerifiedContext(AUTHOR, 1, 0x1234, bytes32(uint256(0xabcd))), p)
                    )
                );
            require(
                !ok && keccak256(reason) == keccak256(abi.encodeWithSelector(StateKernel.E_BOUNDS.selector, uint16(3))),
                "single and aggregate body budget"
            );
            require(h.counts().admissions == 0, "body budget refusal no writes");
        }
    }

    function testSamePublicationUsesShadowBindingKeyCounter() public {
        (K10ScopeHarness h, bytes32 subject, bytes32 scope) = setup(1);
        StateKernel.SelectedLeaf[] memory leaves = new StateKernel.SelectedLeaf[](2);
        leaves[0] = StateKernel.SelectedLeaf(
            0, candidateType(1, 1), abi.encodePacked(bytes32(uint256(1)), subject, bytes32(uint256(1)), hex"00")
        );
        leaves[1] = StateKernel.SelectedLeaf(
            1, candidateType(1, 1), abi.encodePacked(bytes32(uint256(1)), subject, bytes32(uint256(2)), hex"00")
        );
        StateKernel.Publication memory p = publication(leaves, 4);
        p.expectedRevisions = new StateKernel.ExpectedRevision[](2);
        p.expectedRevisions[0] = StateKernel.ExpectedRevision(0, 0);
        p.expectedRevisions[1] = StateKernel.ExpectedRevision(1, 0);
        StateKernel.AdmitResult memory admitted = publish(h, p);
        require(
            admitted.leaves[0].admissionOrdinal == 4 && admitted.leaves[1].admissionOrdinal == 5,
            "same batch admissions"
        );
        StateAuditPages.PageResult memory raw = page(h, scope, 5, 0, 10);
        require(
            raw.items.length == 2 && raw.items[0] == bytes32(uint256(1)) && raw.items[1] == bytes32(uint256(2)),
            "shadow binding key ordinal counter"
        );
        (StateAuditPages.PageResult memory hydrated,) =
            h.pagePostingsHydrated(0, 10, 0, scope, StateAuditPages.PageRequest(0, 1, 5));
        refuses(
            address(h),
            abi.encodeCall(
                h.pagePostings, (bytes32(0), 10, 0, scope, StateAuditPages.PageRequest(hydrated.cursor, 1, 5))
            )
        );
        bytes32 history = IndexKeys.posting(0, 8, 0, h.bindingKeyAt(1));
        h.corruptWord(history, 0, uint256(4) | (uint256(1) << 240));
        refuses(
            address(h),
            abi.encodeCall(h.pagePostings, (bytes32(0), 10, 0, scope, StateAuditPages.PageRequest(0, 10, 5)))
        );
    }
}
