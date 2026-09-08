// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;
import {FixtureInputs} from "./FixtureInputs.sol";
import {StateStore} from "C0Core/StateStore.sol";
import {StateKernel} from "C0Core/StateKernel.sol";
import {Preparation} from "C0Core/Preparation.sol";
import {PreparationHelper} from "C0Core/PreparationHelper.sol";
import {AdmissionLibrary} from "C0Core/AdmissionLibrary.sol";
import {UpgradeAdmissionLibrary} from "../src/UpgradeAdmissionLibrary.sol";
import {UpgradeableFixtureCore, UpgradeableFixtureCoreU2} from "../src/UpgradeableFixtureCore.sol";
import {UpgradeableFixtureCarrier, UpgradeableFixtureCarrierU2} from "../src/UpgradeableFixtureCarrier.sol";
import {UpgradeStorage, FixtureEndpoint} from "../src/UpgradeStorage.sol";
import {RecordBody} from "C0Core/RecordBody.sol";
import {BindingFold} from "C0Core/BindingFold.sol";
import {C0ChunkTree} from "C0Foundation/C0ChunkTree.sol";
import {FixtureDeployment} from "./FixtureDeployment.sol";
import {ProxyAdmin} from "@openzeppelin/contracts/proxy/transparent/ProxyAdmin.sol";

interface FixtureCore {
    function initialize(address, address, address, address, bytes32, StateKernel.Init calldata) external;
    function executeFixture(StateKernel.Publication calldata, uint32, uint64, uint64, bytes calldata)
        external
        returns (StateKernel.AdmitResult memory);
    function counts() external view returns (StateStore.Counts memory);
    function bootstrap() external view returns (StateStore.Bootstrap memory);
    function record(bytes32) external view returns (StateStore.RecordRow memory);
    function typeRow(bytes32) external view returns (StateStore.TypeRow memory);
    function binding(bytes32) external view returns (StateStore.BindingRow memory);
    function postingHead(bytes32) external view returns (uint256);
    function postingWord(bytes32, uint64) external view returns (uint256);
    function recordIdAt(uint64) external view returns (bytes32);
    function typeIdAt(uint64) external view returns (bytes32);
    function envelopeIdAt(uint64) external view returns (bytes32);
    function principalIdAt(uint64) external view returns (bytes32);
    function postingKeyAt(uint64) external view returns (bytes32);
    function bindingKeyAt(uint64) external view returns (bytes32);
    function envelope(bytes32) external view returns (StateStore.EnvelopeRow memory);
    function principal(bytes32) external view returns (StateStore.PrincipalRow memory);
    function occurrence(bytes32, uint16) external view returns (StateStore.LifecycleRow memory);
    function admissionAt(uint64) external view returns (StateStore.AdmissionRow memory);
    function batchAt(uint64) external view returns (StateStore.BatchRow memory);
    function currentRevision() external view returns (uint32);
    function revisionAt(uint32) external view returns (UpgradeStorage.ExecutionSet memory);
    function nonceUsed(uint64) external view returns (bool);
    function presentationLabel() external view returns (string memory);
    function namespaceRoots() external pure returns (bytes32, bytes32, bytes32);
    function migratePresentation(string calldata, bool) external;
}

interface FixtureCarrier {
    function stageFixtureBytes(bytes32, bytes calldata, bytes calldata, uint32, uint64, uint64, bytes calldata) external;
    function readFixtureBytes(bytes32) external view returns (bytes memory);
    function hasFixtureBytes(bytes32) external view returns (bool);
    function nonceUsed(uint64) external view returns (bool);
    function migratePresentation(string calldata, bool) external;
    function presentationLabel() external view returns (string memory);
}

contract UpgradeFoundationTest is FixtureInputs {
    uint256 constant OP_KEY = 0x123456;
    bytes32 constant IMPLEMENTATION_SLOT = bytes32(uint256(keccak256("eip1967.proxy.implementation")) - 1);
    bytes32 constant ADMIN_SLOT = bytes32(uint256(keccak256("eip1967.proxy.admin")) - 1);
    FixtureDeployment factory;
    FixtureCore core;
    FixtureCarrier carrier;
    address u1;
    address c1;
    address u2;
    address c2;
    address helper;
    address operator;
    uint256 bootstrapGas;
    event log_named_uint(string name, uint256 value);

    function deployCode(string memory artifact, bytes memory args) internal returns (address deployed) {
        bytes memory code = bytes.concat(vm.getCode(artifact), args);
        require(code.length <= 49152, "ordinary initcode cap");
        assembly ("memory-safe") { deployed := create(0, add(code, 32), mload(code)) }
        require(deployed != address(0) && deployed.code.length <= 24576, "ordinary runtime cap");
    }

    function setUp() public {
        loadInputs();
        operator = vm.addr(OP_KEY);
        factory = new FixtureDeployment();
        helper = deployCode("PreparationHelper.sol:PreparationHelper", "");
        bytes memory args = abi.encode(address(factory), helper);
        u1 = deployCode("UpgradeableFixtureCore.sol:UpgradeableFixtureCore", args);
        c1 = deployCode("UpgradeableFixtureCarrier.sol:UpgradeableFixtureCarrier", args);
        u2 = deployCode("UpgradeableFixtureCore.sol:UpgradeableFixtureCoreU2", args);
        c2 = deployCode("UpgradeableFixtureCarrier.sol:UpgradeableFixtureCarrierU2", args);
        uint256 gasBefore = gasleft();
        factory.deployPair(u1, c1, operator, treeType, init);
        bootstrapGas = gasBefore - gasleft();
        core = FixtureCore(factory.core());
        carrier = FixtureCarrier(factory.carrier());
    }

    function sign(address endpoint, bytes32 structHash, uint256 key) internal returns (bytes memory) {
        bytes32 domain = keccak256(
            abi.encode(
                keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"),
                keccak256("EFS Upgrade Foundation"),
                keccak256("1"),
                block.chainid,
                endpoint
            )
        );
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(key, keccak256(abi.encodePacked(hex"1901", domain, structHash)));
        return abi.encodePacked(r, s, v);
    }

    function signature(StateKernel.Publication memory p, uint32 revision, uint64 nonce, uint64 deadline)
        internal
        returns (bytes memory)
    {
        return sign(
            address(core),
            keccak256(
                abi.encode(
                    keccak256(
                        "FixturePlan(bytes32 publicationHash,bytes32 executionSetId,uint64 nonce,uint64 deadline)"
                    ),
                    keccak256(abi.encode(p)),
                    factory.revisionAt(revision).id,
                    nonce,
                    deadline
                )
            ),
            OP_KEY
        );
    }

    function submit(StateKernel.Publication memory p, uint64 nonce) internal returns (StateKernel.AdmitResult memory) {
        uint32 rev = factory.currentRevision();
        uint64 deadline = uint64(block.timestamp + 1000);
        return core.executeFixture(p, rev, nonce, deadline, signature(p, rev, nonce, deadline));
    }

    function objectPublication(uint256 salt) internal view returns (StateKernel.Publication memory p) {
        StateKernel.SelectedLeaf[] memory a = new StateKernel.SelectedLeaf[](1);
        a[0] = StateKernel.SelectedLeaf(0, objectType, abi.encodePacked(AUTHOR, bytes32(salt), hex"00"));
        return publication(a, salt);
    }

    function populate() internal returns (bytes32 target, bytes32 bindKey) {
        installGroups();
        StateKernel.SelectedLeaf[] memory a = new StateKernel.SelectedLeaf[](2);
        a[0] = StateKernel.SelectedLeaf(0, objectType, abi.encodePacked(AUTHOR, bytes32(0), hex"00"));
        target = rid(objectType, a[0].body);
        a[1] = StateKernel.SelectedLeaf(
            1, setType, abi.encodePacked(bytes32(uint256(1)), target, bytes32(uint256(2)), hex"01", target, hex"0000")
        );
        StateKernel.Publication memory p = publication(a, 2);
        p.expectedRevisions = new StateKernel.ExpectedRevision[](1);
        p.expectedRevisions[0] = StateKernel.ExpectedRevision(1, 0);
        submit(p, 2);
        bytes32 position =
            keccak256(abi.encode(keccak256("efs2/position/1"), bytes32(uint256(1)), target, bytes32(uint256(2))));
        bindKey = keccak256(abi.encode(keccak256("efs2/binding/1"), AUTHOR, position));
        require(
            core.binding(bindKey).target == target
                && core.binding(bindKey).meta
                    == uint256(1) | (uint256(1) << 8) | (uint256(4) << 40) | (uint256(1) << 88),
            "independently keyed exact live binding"
        );
    }

    function installGroups() internal {
        for (uint16 i; i < 2; ++i) {
            StateKernel.SelectedLeaf[] memory a = new StateKernel.SelectedLeaf[](1);
            a[0] = StateKernel.SelectedLeaf(0, meta, abi.encodePacked(uint16(groups[i].length), groups[i]));
            submit(publication(a, 1 + uint256(i) * 100), 1 + uint64(i) * 100);
        }
    }

    function stage(uint64 nonce, bytes memory data) internal returns (bytes32 id) {
        bytes memory body =
            abi.encodePacked(uint32(4096), uint32(1), uint64(data.length), keccak256(bytes.concat(hex"00", data)));
        id = rid(treeType, body);
        uint32 rev = factory.currentRevision();
        uint64 deadline = uint64(block.timestamp + 1000);
        bytes memory sig = sign(
            address(carrier),
            keccak256(
                abi.encode(
                    keccak256(
                        "FixtureBytes(bytes32 treeId,bytes32 bodyHash,bytes32 dataHash,bytes32 executionSetId,uint64 nonce,uint64 deadline)"
                    ),
                    id,
                    keccak256(body),
                    keccak256(data),
                    factory.revisionAt(rev).id,
                    nonce,
                    deadline
                )
            ),
            OP_KEY
        );
        carrier.stageFixtureBytes(id, body, data, rev, nonce, deadline, sig);
    }

    function stateDigest() internal view returns (bytes32 d) {
        StateStore.Counts memory c = core.counts();
        d = keccak256(abi.encode(c, core.bootstrap()));
        for (uint64 i = 1; i <= c.records; ++i) {
            bytes32 id = core.recordIdAt(i);
            d = keccak256(abi.encode(d, id, core.record(id)));
        }
        for (uint64 i = 1; i <= c.types; ++i) {
            bytes32 id = core.typeIdAt(i);
            d = keccak256(abi.encode(d, id, core.typeRow(id)));
        }
        for (uint64 i = 1; i <= c.envelopes; ++i) {
            bytes32 id = core.envelopeIdAt(i);
            StateStore.EnvelopeRow memory e = core.envelope(id);
            d = keccak256(abi.encode(d, id, e));
            (, bytes32[] memory ids) = abi.decode(e.canonicalUnsignedEnvelope, (StateKernel.EnvelopeHeader, bytes32[]));
            for (uint16 j; j < ids.length; ++j) {
                d = keccak256(abi.encode(d, core.occurrence(id, j)));
            }
        }
        for (uint64 i = 1; i <= c.principals; ++i) {
            bytes32 id = core.principalIdAt(i);
            d = keccak256(abi.encode(d, id, core.principal(id)));
        }
        for (uint64 i = 1; i <= c.admissions; ++i) {
            d = keccak256(abi.encode(d, core.admissionAt(i)));
        }
        for (uint64 i = 1; i <= c.batches; ++i) {
            d = keccak256(abi.encode(d, core.batchAt(i)));
        }
        for (uint64 i = 1; i <= c.bindingKeys; ++i) {
            bytes32 k = core.bindingKeyAt(i);
            d = keccak256(abi.encode(d, k, core.binding(k)));
        }
        for (uint64 i = 1; i <= c.postingKeys; ++i) {
            bytes32 k = core.postingKeyAt(i);
            uint256 head = core.postingHead(k);
            d = keccak256(abi.encode(d, k, head));
            for (uint64 j; j < (uint64(head) + 4) / 5; ++j) {
                d = keccak256(abi.encode(d, core.postingWord(k, j)));
            }
        }
    }

    function testPopulatedUpgradePreservesEveryOriginalRowBytesNoncesAndRevision() public {
        populate();
        bytes32 tree = stage(1, bytes("hello EFS"));
        require(core.record(tree).recordOrdinal == 0, "detached staging is not admission");
        StateKernel.SelectedLeaf[] memory a = new StateKernel.SelectedLeaf[](1);
        a[0] = StateKernel.SelectedLeaf(
            0,
            treeType,
            abi.encodePacked(uint32(4096), uint32(1), uint64(9), keccak256(bytes.concat(hex"00", bytes("hello EFS"))))
        );
        submit(publication(a, 4), 4);
        require(core.record(tree).typeId == treeType, "bytes keyed by actual admitted ChunkTree Record");
        bytes32 beforeState = stateDigest();
        uint64 previousAdmissionHigh = core.counts().admissions;
        factory.upgradePair(
            u2,
            c2,
            abi.encodeCall(core.migratePresentation, ("U2 Files", false)),
            abi.encodeCall(carrier.migratePresentation, ("U2 carrier", false))
        );
        require(
            stateDigest() == beforeState && keccak256(carrier.readFixtureBytes(tree)) == keccak256("hello EFS"),
            "all original EFS rows and bytes retained"
        );
        require(core.nonceUsed(1) && core.nonceUsed(2) && carrier.nonceUsed(1), "nonce namespace retained");
        require(keccak256(bytes(core.presentationLabel())) == keccak256("U2 Files"), "persistent U2 namespace");
        require(
            core.currentRevision() == 2 && core.revisionAt(1).coreImplementation == u1
                && core.revisionAt(2).coreImplementation == u2,
            "append-only execution history"
        );
        require(
            core.revisionAt(1).activationBlock == block.number && core.revisionAt(2).activationBlock == block.number,
            "activation basis retained"
        );
        require(
            core.revisionAt(1).activationAdmissionHigh == 0
                && core.revisionAt(2).activationAdmissionHigh == previousAdmissionHigh,
            "same-block admission boundary must partition historical revisions"
        );
        StateKernel.AdmitResult memory r = submit(objectPublication(3), 3);
        require(
            r.leaves[0].admissionOrdinal > previousAdmissionHigh, "new revision starts after activation admission high"
        );
        require(
            uint32(core.batchAt(1).meta >> 112) == 1 && uint32(core.batchAt(r.acceptingBatchId).meta >> 112) == 2,
            "never rewrite old batch interpretation"
        );
    }

    function testStaleSignatureReplayUnauthorizedAndExpiryRollback() public {
        installGroups();
        StateKernel.Publication memory p = objectPublication(4);
        uint64 deadline = uint64(block.timestamp + 1000);
        bytes memory sig = signature(p, 1, 7, deadline);
        bytes memory returningSig = signature(p, 1, 9, deadline + 1000);
        factory.upgradePair(u2, c2, "", "");
        bytes32 beforeState = stateDigest();
        (bool ok, bytes memory err) = address(core).call(abi.encodeCall(core.executeFixture, (p, 1, 7, deadline, sig)));
        require(!ok && bytes4(err) == FixtureEndpoint.FixtureRevision.selector, "stale ordinal refuses");
        (ok, err) = address(core).call(abi.encodeCall(core.executeFixture, (p, 2, 7, deadline, sig)));
        require(
            !ok && bytes4(err) == FixtureEndpoint.FixtureAuthorization.selector, "stale execution-set signature refuses"
        );
        require(!core.nonceUsed(7) && stateDigest() == beforeState, "stale plan leaves state and nonce untouched");
        submit(p, 7);
        (ok, err) =
            address(core).call(abi.encodeCall(core.executeFixture, (p, 2, 7, deadline, signature(p, 2, 7, deadline))));
        require(!ok && bytes4(err) == FixtureEndpoint.FixtureNonce.selector, "replay refuses even ACTIVE publication");
        bytes memory bad = sign(address(core), bytes32(0), 999);
        (ok, err) = address(core).call(abi.encodeCall(core.executeFixture, (p, 2, 8, deadline, bad)));
        require(
            !ok && bytes4(err) == FixtureEndpoint.FixtureAuthorization.selector && !core.nonceUsed(8),
            "unauthorized signature"
        );
        (ok, err) = address(core).call(abi.encodeCall(core.executeFixture, (p, 2, 8, 0, signature(p, 2, 8, 0))));
        require(!ok && bytes4(err) == FixtureEndpoint.FixtureExpiry.selector, "zero deadline");
        bytes memory expired = signature(p, 2, 8, deadline);
        vm.warp(deadline + 1);
        (ok, err) = address(core).call(abi.encodeCall(core.executeFixture, (p, 2, 8, deadline, expired)));
        require(!ok && bytes4(err) == FixtureEndpoint.FixtureExpiry.selector, "expired deadline");
        factory.upgradePair(u1, c1, "", "");
        (ok, err) = address(core).call(abi.encodeCall(core.executeFixture, (p, 3, 9, deadline + 1000, returningSig)));
        require(
            !ok && bytes4(err) == FixtureEndpoint.FixtureAuthorization.selector && !core.nonceUsed(9),
            "returning implementation does not revive unused unexpired U1 consent"
        );
    }

    function testMalformedBodyWrongReferenceAndStaleCasRollback() public {
        (bytes32 target, bytes32 bindKey) = populate();
        bytes32 beforeState = stateDigest();
        StateKernel.SelectedLeaf[] memory a = new StateKernel.SelectedLeaf[](1);
        a[0] = StateKernel.SelectedLeaf(0, objectType, hex"00");
        StateKernel.Publication memory p = publication(a, 10);
        uint64 deadline = uint64(block.timestamp + 1000);
        (bool ok, bytes memory err) =
            address(core).call(abi.encodeCall(core.executeFixture, (p, 1, 10, deadline, signature(p, 1, 10, deadline))));
        require(!ok && bytes4(err) == RecordBody.InvalidBody.selector, "malformed body refuses");
        a[0] = StateKernel.SelectedLeaf(
            0,
            setType,
            abi.encodePacked(
                bytes32(uint256(1)),
                bytes32(uint256(65537)),
                bytes32(uint256(2)),
                hex"01",
                bytes32(uint256(65538)),
                hex"0000"
            )
        );
        p = publication(a, 11);
        p.expectedRevisions = new StateKernel.ExpectedRevision[](1);
        p.expectedRevisions[0] = StateKernel.ExpectedRevision(0, 0);
        (ok, err) = address(core)
            .call(abi.encodeCall(core.executeFixture, (p, 1, 11, deadline, signature(p, 1, 11, deadline))));
        require(!ok && bytes4(err) == StateKernel.ReferenceUnproved.selector, "wrong typed reference refuses");
        a[0] = StateKernel.SelectedLeaf(
            0,
            setType,
            abi.encodePacked(
                bytes32(uint256(1)),
                target,
                bytes32(uint256(2)),
                hex"01",
                target,
                hex"0001",
                core.admissionAt(4).envelopeId,
                uint16(1)
            )
        );
        p = publication(a, 12);
        p.expectedRevisions = new StateKernel.ExpectedRevision[](1);
        p.expectedRevisions[0] = StateKernel.ExpectedRevision(0, 99);
        (ok, err) = address(core)
            .call(abi.encodeCall(core.executeFixture, (p, 1, 12, deadline, signature(p, 1, 12, deadline))));
        require(
            !ok
                && keccak256(err)
                    == keccak256(
                        abi.encodeWithSelector(BindingFold.ErrCasRevision.selector, bindKey, uint32(99), uint32(1))
                    ),
            "exact stale CAS refusal"
        );
        require(
            stateDigest() == beforeState && !core.nonceUsed(10) && !core.nonceUsed(11) && !core.nonceUsed(12),
            "invalid admission is atomic"
        );
    }

    function testPartialCoreAndCarrierUpgradesFailClosedFromU1() public {
        installGroups();
        StateKernel.Publication memory p = objectPublication(3);
        uint64 deadline = uint64(block.timestamp + 1000);
        factory.upgradeCoreOnlyForTest(u2);
        (bool ok,) =
            address(core).call(abi.encodeCall(core.executeFixture, (p, 1, 3, deadline, signature(p, 1, 3, deadline))));
        require(!ok, "local implementation mismatch");
        (ok,) = address(this).call(abi.encodeCall(this.stageExternal, (3, bytes("test"))));
        require(!ok, "U1 carrier catches peer implementation mismatch");
        factory.upgradeCoreOnlyForTest(u1);
        factory.upgradeCarrierOnlyForTest(c2);
        (ok,) =
            address(core).call(abi.encodeCall(core.executeFixture, (p, 1, 3, deadline, signature(p, 1, 3, deadline))));
        require(!ok, "U1 core catches peer implementation mismatch");
        require(!core.nonceUsed(3) && !carrier.nonceUsed(3), "partial endpoint writes consume no nonce");
    }

    function stageExternal(uint64 nonce, bytes memory data) external {
        stage(nonce, data);
    }

    function testSecondMigrationFailureRollsBackBothImplementationsAndHistory() public {
        populate();
        bytes32 beforeState = stateDigest();
        (bool ok,) = address(factory)
            .call(
                abi.encodeCall(
                    factory.upgradePair,
                    (
                        u2,
                        c2,
                        abi.encodeCall(core.migratePresentation, ("must rollback", false)),
                        abi.encodeCall(carrier.migratePresentation, ("revert", true))
                    )
                )
            );
        require(!ok && factory.currentRevision() == 1, "failed activation not appended");
        require(
            address(uint160(uint256(vm.load(address(core), IMPLEMENTATION_SLOT)))) == u1
                && address(uint160(uint256(vm.load(address(carrier), IMPLEMENTATION_SLOT)))) == c1,
            "both implementation upgrades rolled back"
        );
        require(stateDigest() == beforeState, "all EFS rows unchanged after failed upgrade");
        (,, bytes32 presentationRoot) = core.namespaceRoots();
        require(
            vm.load(address(core), presentationRoot) == 0
                && vm.load(address(core), bytes32(uint256(presentationRoot) + 1)) == 0,
            "first migration writes rolled back when second fails"
        );
        submit(objectPublication(9), 9);
    }

    function testLockedImplementationsOneTimeBootstrapActualAdminsAndUnauthorizedUpgrade() public {
        bytes memory callData = abi.encodeCall(
            core.initialize, (address(factory), address(carrier), factory.coreAdmin(), operator, treeType, init)
        );
        (bool ok,) = address(core).call(callData);
        require(!ok, "proxy cannot reinitialize");
        (ok,) = u1.call(callData);
        require(!ok, "implementation locked");
        vm.prank(address(0xdead));
        (ok,) = address(factory).call(abi.encodeCall(factory.upgradePair, (u2, c2, bytes(""), bytes(""))));
        require(!ok, "unauthorized controller sender");
        require(
            ProxyAdmin(factory.coreAdmin()).owner() == address(factory)
                && ProxyAdmin(factory.carrierAdmin()).owner() == address(factory),
            "actual ProxyAdmins owned by controller"
        );
        require(
            address(uint160(uint256(vm.load(address(core), ADMIN_SLOT)))) == factory.coreAdmin(), "recorded admin slot"
        );
        (ok,) = address(factory).call(abi.encodeCall(factory.deployPair, (u1, c1, operator, treeType, init)));
        require(!ok, "pair bootstraps once");
    }

    function testAdminControllerOwnershipDriftBlocksOrdinaryWrites() public {
        installGroups();
        address actualAdmin = factory.carrierAdmin();
        vm.prank(address(factory));
        ProxyAdmin(actualAdmin).transferOwnership(address(0xdead));
        StateKernel.Publication memory p = objectPublication(12);
        uint64 deadline = uint64(block.timestamp + 1000);
        (bool ok,) =
            address(core).call(abi.encodeCall(core.executeFixture, (p, 1, 12, deadline, signature(p, 1, 12, deadline))));
        require(!ok && !core.nonceUsed(12), "peer actual admin owner mismatch blocks U1 core");
    }

    function testIndependentNamespacesAndMismatchedPeerConfiguration() public {
        (bytes32 storeRoot, bytes32 controlRoot, bytes32 presentationRoot) = core.namespaceRoots();
        // Literal roots independently computed with ethers, not host/library helpers.
        require(
            storeRoot == 0xbeadc64d0e08a56352fe2b90d4cbb5452f5265a9cc2da0092cc0ce117cbead00,
            "independent ERC7201 Store root"
        );
        require(
            controlRoot == 0x16441f06de582318aa5aa7dd3ed73cd50237cc85bb2c855ceb6dcdea0f675300,
            "independent ERC7201 control root"
        );
        require(
            presentationRoot == 0x7ed2742d110069f2cce902d5a18745b2b667d6a151e217cca72860b3f403a300,
            "independent ERC7201 presentation root"
        );
        require(
            storeRoot != controlRoot && controlRoot != presentationRoot && storeRoot != presentationRoot,
            "disjoint roots"
        );
        installGroups();
        // Control packs bool+controller in root, then peer in root+1.
        vm.store(address(carrier), bytes32(uint256(controlRoot) + 1), bytes32(uint256(uint160(address(0xdead)))));
        StateKernel.Publication memory p = objectPublication(12);
        uint64 deadline = uint64(block.timestamp + 1000);
        (bool ok,) =
            address(core).call(abi.encodeCall(core.executeFixture, (p, 1, 12, deadline, signature(p, 1, 12, deadline))));
        require(!ok && !core.nonceUsed(12), "peer configuration mismatch without changing proxy code");
    }

    function testFixtureBatchAuthorityNamesActualAdapterNotExecutionCommitment() public {
        installGroups();
        require(core.batchAt(1).authorityBasis == uint256(uint160(operator)), "synthetic fixture operator basis");
        require(core.batchAt(1).authorityCodehash == u1.codehash, "actual fixture adapter code identity");
    }

    function carrierSignature(
        bytes32 id,
        bytes memory body,
        bytes memory data,
        uint32 rev,
        uint64 nonce,
        uint64 deadline
    ) internal returns (bytes memory) {
        return sign(
            address(carrier),
            keccak256(
                abi.encode(
                    keccak256(
                        "FixtureBytes(bytes32 treeId,bytes32 bodyHash,bytes32 dataHash,bytes32 executionSetId,uint64 nonce,uint64 deadline)"
                    ),
                    id,
                    keccak256(body),
                    keccak256(data),
                    factory.revisionAt(rev).id,
                    nonce,
                    deadline
                )
            ),
            OP_KEY
        );
    }

    function testCarrierCommitsExactBodyDataTreeNonceAndExecutionSet() public {
        bytes memory data = bytes("carrier data");
        bytes memory body =
            abi.encodePacked(uint32(4096), uint32(1), uint64(data.length), keccak256(bytes.concat(hex"00", data)));
        bytes32 id = rid(treeType, body);
        uint64 deadline = uint64(block.timestamp + 1000);
        bytes memory sig = carrierSignature(id, body, data, 1, 1, deadline);
        (bool ok, bytes memory err) = address(carrier)
            .call(abi.encodeCall(carrier.stageFixtureBytes, (id, body, bytes("tampered"), 1, 1, deadline, sig)));
        require(!ok && bytes4(err) == FixtureEndpoint.FixtureAuthorization.selector, "data digest bound by signature");
        bytes memory malformed = abi.encodePacked(uint32(4096), uint32(1), uint64(data.length), bytes32(0));
        bytes32 wrongId = rid(treeType, malformed);
        (ok, err) = address(carrier)
            .call(
                abi.encodeCall(
                    carrier.stageFixtureBytes,
                    (
                        wrongId,
                        malformed,
                        data,
                        1,
                        1,
                        deadline,
                        carrierSignature(wrongId, malformed, data, 1, 1, deadline)
                    )
                )
            );
        require(
            !ok && bytes4(err) == C0ChunkTree.InvalidChunkTree.selector,
            "signed invalid tree root rejected by actual validator"
        );
        (ok, err) = address(carrier)
            .call(
                abi.encodeCall(
                    carrier.stageFixtureBytes,
                    (
                        bytes32(uint256(65537)),
                        body,
                        data,
                        1,
                        1,
                        deadline,
                        carrierSignature(bytes32(uint256(65537)), body, data, 1, 1, deadline)
                    )
                )
            );
        require(!ok && bytes4(err) == C0ChunkTree.InvalidChunkTree.selector, "exact content addressed tree ID required");
        require(!carrier.nonceUsed(1) && !carrier.hasFixtureBytes(id), "invalid staging no state effects");
        carrier.stageFixtureBytes(id, body, data, 1, 1, deadline, sig);
        (ok, err) =
            address(carrier).call(abi.encodeCall(carrier.stageFixtureBytes, (id, body, data, 1, 1, deadline, sig)));
        require(!ok && bytes4(err) == FixtureEndpoint.FixtureNonce.selector, "carrier nonce replay rejected");
        sig = carrierSignature(id, body, data, 1, 2, deadline);
        factory.upgradePair(u2, c2, "", "");
        (ok, err) =
            address(carrier).call(abi.encodeCall(carrier.stageFixtureBytes, (id, body, data, 2, 2, deadline, sig)));
        require(
            !ok && bytes4(err) == FixtureEndpoint.FixtureAuthorization.selector && !carrier.nonceUsed(2),
            "stale bytes consent cannot cross activation"
        );
        carrier.stageFixtureBytes(id, body, data, 2, 2, deadline, carrierSignature(id, body, data, 2, 2, deadline));
        require(
            keccak256(carrier.readFixtureBytes(id)) == keccak256(data),
            "immutable byte identity survives duplicate staging and upgrade"
        );
        (ok, err) = address(carrier)
            .call(abi.encodeCall(carrier.stageFixtureBytes, (id, body, new bytes(16385), 2, 3, deadline, bytes(""))));
        require(
            !ok && bytes4(err) == UpgradeableFixtureCarrier.FixtureBytesBounds.selector,
            "upload cap checked before copying/validation"
        );
        (ok, err) = address(carrier).staticcall(abi.encodeCall(carrier.readFixtureBytes, (bytes32(uint256(2)))));
        require(!ok && bytes4(err) == UpgradeableFixtureCarrier.FixtureBytesMissing.selector, "absence not empty bytes");
    }

    function testIndividualOperationExecutionAndAllRuntimeCaps() public {
        require(bootstrapGas < 16000000, "atomic pair bootstrap execution ceiling with tx overhead reserve");
        emit log_named_uint("pair bootstrap execution gas, not transaction receipt", bootstrapGas);
        address[10] memory components = [
            u1,
            c1,
            u2,
            c2,
            helper,
            address(UpgradeAdmissionLibrary),
            address(factory),
            address(core),
            address(carrier),
            factory.coreAdmin()
        ];
        for (uint256 i; i < components.length; ++i) {
            require(components[i].code.length != 0 && components[i].code.length <= 24576, "actual deployed runtime cap");
        }
        for (uint16 i; i < 2; ++i) {
            StateKernel.SelectedLeaf[] memory a = new StateKernel.SelectedLeaf[](1);
            a[0] = StateKernel.SelectedLeaf(0, meta, abi.encodePacked(uint16(groups[i].length), groups[i]));
            StateKernel.Publication memory p = publication(a, i + 1);
            uint64 deadline = uint64(block.timestamp + 1000);
            bytes memory sig = signature(p, 1, i + 1, deadline);
            uint256 gasBefore = gasleft();
            core.executeFixture{gas: 16000000}(p, 1, i + 1, deadline, sig);
            emit log_named_uint(i == 0 ? "group 1 execution gas" : "group 2 execution gas", gasBefore - gasleft());
        }
    }
}

contract RevisionSeamHarness {
    StateStore.Store s;
    Preparation.Config prep;

    constructor(StateKernel.Init memory i, address helper) {
        prep = Preparation.Config(helper, helper.codehash);
        StateKernel.initialize(s, i, prep);
    }

    function admit(StateKernel.VerifiedContext memory v, StateKernel.Publication memory p, uint32 active, bool legacy)
        external
        returns (StateKernel.AdmitResult memory)
    {
        if (legacy) return AdmissionLibrary.admit(s, v, p, prep);
        return UpgradeAdmissionLibrary.admit(s, v, p, prep, active);
    }

    function batch() external view returns (StateStore.BatchRow memory) {
        return s.batches[1];
    }

    function count() external view returns (StateStore.Counts memory) {
        return s.count;
    }
}

contract RevisionSeamTest is FixtureInputs {
    RevisionSeamHarness h;

    function setUp() public {
        loadInputs();
        h = new RevisionSeamHarness(init, address(new PreparationHelper()));
    }

    function testLegacyRejectsRevisionTwo() public {
        (bool ok, bytes memory e) = address(h)
            .call(
                abi.encodeCall(
                    h.admit,
                    (
                        StateKernel.VerifiedContext(AUTHOR, 2, 0x1234, bytes32(uint256(0xabcd))),
                        groupPublication(),
                        2,
                        true
                    )
                )
            );
        require(
            !ok && keccak256(e) == keccak256(abi.encodeWithSelector(StateKernel.InvalidRevision.selector, uint32(2))),
            "legacy must remain revision one"
        );
    }

    function testRevisionTwoAdmitsRealGroupsWithOriginalBatchPacking() public {
        StateKernel.AdmitResult memory r = h.admit(
            StateKernel.VerifiedContext(AUTHOR, 2, 0x1234, bytes32(uint256(0xabcd))), groupPublication(), 2, false
        );
        require(
            r.acceptingBatchId == 1 && r.leaves[0].admissionOrdinal == 1 && r.leaves[1].admissionOrdinal == 2,
            "real group admissions"
        );
        require(h.count().records == 2 && h.count().types > 1, "real type cache");
        require(
            h.batch().meta == uint256(1) | (uint256(2) << 48) | (block.number << 64) | (uint256(2) << 112),
            "revision two exact original packing"
        );
    }

    function testZeroAndMismatchedActiveRevisionReject() public {
        for (uint32 a; a < 2; ++a) {
            (bool ok, bytes memory e) = address(h)
                .call(
                    abi.encodeCall(
                        h.admit, (StateKernel.VerifiedContext(AUTHOR, 2, 0, 0), groupPublication(), a, false)
                    )
                );
            require(
                !ok
                    && keccak256(e)
                        == keccak256(abi.encodeWithSelector(StateKernel.InvalidRevision.selector, uint32(2))),
                "checked positive active revision"
            );
        }
    }
}
