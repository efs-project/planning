// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;
import {EfsLab} from "../src/EfsLab.sol";

interface Vm {
    function addr(uint256) external returns (address);
    function sign(uint256, bytes32) external returns (uint8, bytes32, bytes32);
    function prank(address) external;
    function expectRevert() external;
    function warp(uint256) external;
    function chainId(uint256) external;
    function store(address, bytes32, bytes32) external;
}

interface ByteStore {
    function put(bytes calldata) external returns (bytes32);
    function read(bytes32) external view returns (bytes memory);
    function readRange(bytes32, uint64, uint32) external view returns (bytes memory);
    function exists(bytes32) external view returns (bool);
}

contract EfsLabTest {
    Vm constant vm = Vm(address(uint160(uint256(keccak256("hevm cheat code")))));
    uint256 constant OWNER_KEY = 111;
    uint256 constant SESSION_KEY = 222;
    EfsLab lab;
    address owner;

    function setUp() public {
        owner = vm.addr(OWNER_KEY);
        lab = new EfsLab(owner, bytes32(uint256(9)));
    }

    function testRootIsStableDirectory() public view {
        bytes32 expected = keccak256(abi.encode(keccak256("efs-lab/root/1"), bytes32(uint256(9)), owner));
        require(lab.rootId() == expected, "root identity");
        require(lab.getNode(expected).kind == 1, "root directory");
    }

    function op(uint8 kind, bytes32 target, string memory name, bytes memory data)
        internal
        view
        returns (EfsLab.Operation memory)
    {
        return EfsLab.Operation(
            kind,
            target,
            name,
            0,
            data,
            kind <= 2 ? bytes32(uint256(1)) : bytes32(0),
            0,
            lab.ownerNonce(),
            uint64(block.timestamp + 100),
            0
        );
    }

    function domain() internal view returns (bytes32) {
        return keccak256(
            abi.encode(
                keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"),
                keccak256("efs-lab"),
                keccak256("1"),
                block.chainid,
                address(lab)
            )
        );
    }

    function digest(EfsLab.Operation memory o) internal view returns (bytes32) {
        bytes32 s = keccak256(
            abi.encode(
                keccak256(
                    "Operation(uint8 kind,bytes32 target,string name,bytes32 schemaId,bytes data,bytes32 salt,uint64 expectedRevision,uint64 nonce,uint64 deadline,bytes32 grantId)"
                ),
                o.kind,
                o.target,
                keccak256(bytes(o.name)),
                o.schemaId,
                keccak256(o.data),
                o.salt,
                o.expectedRevision,
                o.nonce,
                o.deadline,
                o.grantId
            )
        );
        return keccak256(abi.encodePacked(hex"1901", domain(), s));
    }

    function sign(uint256 key, bytes32 d) internal returns (bytes memory) {
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(key, d);
        return abi.encodePacked(r, s, v);
    }

    function direct(EfsLab.Operation memory o) internal returns (bytes32) {
        vm.prank(owner);
        return lab.executeDirect(o);
    }

    function content(bytes memory b) internal pure returns (bytes32) {
        return keccak256(abi.encode(keccak256("efs-lab/bytes/1"), keccak256(b)));
    }

    function grant(bytes32 scope, uint32 writes, uint64 size) internal returns (bytes32 id) {
        return grantMasked(scope, writes, size, 7);
    }

    function grantMasked(bytes32 scope, uint32 writes, uint64 size, uint8 mask) internal returns (bytes32 id) {
        EfsLab.Grant memory g = EfsLab.Grant(
            vm.addr(SESSION_KEY), scope, mask, uint64(block.timestamp + 200), writes, size, 7
        );
        bytes32 h = keccak256(
            abi.encode(
                keccak256(
                    "Grant(address key,bytes32 scope,uint8 operations,uint64 expiry,uint32 maxWrites,uint64 maxBytes,uint64 nonce)"
                ),
                g.key,
                g.scope,
                g.operations,
                g.expiry,
                g.maxWrites,
                g.maxBytes,
                g.nonce
            )
        );
        id = keccak256(abi.encodePacked(hex"1901", domain(), h));
        require(lab.registerGrant(g, sign(OWNER_KEY, id)) == id, "grant digest");
    }

    function testDirectCreateReadReviseRetainsHistory() public {
        bytes32 dir = direct(op(1, lab.rootId(), "docs", ""));
        bytes32 file = direct(op(2, dir, "hello.txt", "hello"));
        require(lab.child(dir, "hello.txt") == file, "placement");
        require(lab.getNode(file).revision == 1, "initial revision");
        require(
            keccak256(ByteStore(address(lab.byteStore())).read(lab.getRevision(file, 1).contentId))
                == keccak256("hello"),
            "bytes"
        );
        EfsLab.Operation memory edit = op(3, file, "", "world");
        edit.expectedRevision = 1;
        require(direct(edit) == file, "stable file");
        require(lab.getNode(file).revision == 2, "advance");
        require(lab.getRevision(file, 1).contentId == content("hello"), "immutable old");
        bytes32 prior =
            keccak256(abi.encode(keccak256("efs-lab/revision/1"), file, uint64(1), content("hello"), bytes32(0)));
        require(lab.getRevision(file, 2).previous == prior, "revision chain");
        require(lab.ownerNonce() == 3 && lab.receiptCount() == 3, "exact counts");
        EfsLab.Receipt memory r = lab.receipt(2);
        require(r.mode == 1 && r.signer == owner && r.witness.length == 0, "direct qualified");
        require(keccak256(r.operationBytes) == keccak256(abi.encode(edit)), "retained operation");
    }

    function testRelayedSignatureAndWitnessReplayReject() public {
        EfsLab.Operation memory o = op(2, lab.rootId(), "signed", "ok");
        bytes memory sig = sign(OWNER_KEY, digest(o));
        bytes32 f = lab.execute(o, sig);
        EfsLab.Receipt memory r = lab.receipt(0);
        require(r.resultId == f && r.mode == 2 && r.signer == owner && r.digest == digest(o), "receipt");
        require(keccak256(r.witness) == keccak256(sig), "witness");
        vm.expectRevert();
        lab.execute(o, sig);
        require(lab.receiptCount() == 1 && lab.ownerNonce() == 1, "replay no effect");
    }

    function testCollisionAndStaleCasLeaveBytesAndNonceUntouched() public {
        bytes32 f = direct(op(2, lab.rootId(), "a", "old"));
        EfsLab.Operation memory collision = op(2, lab.rootId(), "a", "collision");
        vm.expectRevert();
        direct(collision);
        EfsLab.Operation memory edit = op(3, f, "", "stale");
        edit.expectedRevision = 0;
        vm.expectRevert();
        direct(edit);
        require(lab.ownerNonce() == 1 && lab.receiptCount() == 1 && lab.getNode(f).revision == 1, "rollback");
        require(!ByteStore(address(lab.byteStore())).exists(content("stale")), "no stale bytes");
        require(!ByteStore(address(lab.byteStore())).exists(content("collision")), "no collision bytes");
    }

    function testSignatureSubstitutionWrongSignerExpiryAndDomainReject() public {
        EfsLab.Operation memory o = op(2, lab.rootId(), "a", "data");
        bytes memory sig = sign(OWNER_KEY, digest(o));
        o.data = "evil";
        vm.expectRevert();
        lab.execute(o, sig);
        vm.expectRevert();
        lab.execute(o, sign(SESSION_KEY, digest(o)));
        o.data = "data";
        uint256 chain = block.chainid;
        vm.chainId(chain + 1);
        vm.expectRevert();
        lab.execute(o, sig);
        vm.chainId(chain);
        vm.warp(o.deadline + 1);
        vm.expectRevert();
        lab.execute(o, sig);
        require(lab.receiptCount() == 0 && lab.ownerNonce() == 0, "no authorization mutation");
    }

    function testSessionScopeBudgetRevocationAndHistoricalWitness() public {
        bytes32 dir = direct(op(1, lab.rootId(), "scope", ""));
        bytes32 id = grant(dir, 2, 5);
        EfsLab.Operation memory o = op(2, dir, "session", "123");
        o.grantId = id;
        o.nonce = 0;
        bytes32 f = lab.execute(o, sign(SESSION_KEY, digest(o)));
        require(lab.receipt(1).mode == 3 && lab.receipt(1).signer == vm.addr(SESSION_KEY), "session receipt");
        EfsLab.Operation memory outside = op(2, lab.rootId(), "outside", "1");
        outside.grantId = id;
        outside.nonce = 1;
        vm.expectRevert();
        lab.execute(outside, sign(SESSION_KEY, digest(outside)));
        EfsLab.Operation memory edit = op(3, f, "", "123");
        edit.grantId = id;
        edit.nonce = 1;
        edit.expectedRevision = 1;
        vm.expectRevert();
        lab.execute(edit, sign(SESSION_KEY, digest(edit)));
        edit.data = "12";
        lab.execute(edit, sign(SESSION_KEY, digest(edit)));
        (, bytes memory approval,, uint32 writes, uint64 size) = lab.grantInfo(id);
        require(approval.length == 65 && writes == 2 && size == 5, "grant retained budgets");
        edit.nonce = 2;
        edit.expectedRevision = 2;
        edit.data = "";
        vm.expectRevert();
        lab.execute(edit, sign(SESSION_KEY, digest(edit)));
        vm.prank(owner);
        lab.revokeGrant(id);
        (, bytes memory afterApproval, bool revoked, uint32 afterWrites,) = lab.grantInfo(id);
        require(revoked && afterWrites == 2 && keccak256(approval) == keccak256(afterApproval), "historical grant");
        require(lab.getRevision(f, 1).contentId == content("123"), "session history");
    }

    function testRevokedSessionAndRegistrationReplayReject() public {
        bytes32 id = grant(lab.rootId(), 5, 99);
        (EfsLab.Grant memory g, bytes memory approval,,,) = lab.grantInfo(id);
        vm.prank(owner);
        lab.revokeGrant(id);
        vm.expectRevert();
        lab.registerGrant(g, approval);
        EfsLab.Operation memory o = op(2, lab.rootId(), "x", "1");
        o.grantId = id;
        vm.expectRevert();
        lab.execute(o, sign(SESSION_KEY, digest(o)));
        require(lab.receiptCount() == 0, "revoked no effect");
    }

    function testStrictTypedDataAndExistingRecordReference() public {
        vm.prank(owner);
        bytes32 s = lab.registerSchema(hex"010204");
        require(s == keccak256(abi.encode(keccak256("efs-lab/schema/1"), keccak256(hex"010204"))), "schema id");
        EfsLab.Operation memory o = op(4, lab.rootId(), "", hex"000000000000002a010003616263");
        o.schemaId = s;
        bytes32 record = direct(o);
        require(lab.getRecord(record).schemaId == s, "typed schema");
        require(lab.getRecord(record).contentId == content(o.data), "typed exact bytes");
        o.nonce = lab.ownerNonce();
        o.data = hex"000000000000002a020003616263";
        vm.expectRevert();
        direct(o);
        o.data = hex"000000000000002a01000361626300";
        vm.expectRevert();
        direct(o);
        o.data = hex"000000000000002a01000361";
        vm.expectRevert();
        direct(o);
        vm.prank(owner);
        bytes32 refSchema = lab.registerSchema(abi.encodePacked(hex"05", s));
        o.schemaId = refSchema;
        o.data = abi.encodePacked(record);
        direct(o);
        o.nonce = lab.ownerNonce();
        o.data = abi.encodePacked(bytes32(uint256(19)));
        vm.expectRevert();
        direct(o);
        require(lab.receiptCount() == 2, "invalid records not admitted");
    }

    function testListingPagesCloseExactInventory() public {
        bytes32 a = direct(op(1, lab.rootId(), "a", ""));
        bytes32 b = direct(op(2, lab.rootId(), "b", ""));
        (bytes32[] memory first, uint256 next, uint256 total) = lab.list(lab.rootId(), 0, 1);
        require(first.length == 1 && first[0] == a && next == 1 && total == 2, "page1");
        (bytes32[] memory last, uint256 end, uint256 total2) = lab.list(lab.rootId(), next, 64);
        require(last.length == 1 && last[0] == b && end == 2 && total2 == 2, "page2");
        (bytes32[] memory empty, uint256 finalCursor,) = lab.list(lab.rootId(), end, 64);
        require(empty.length == 0 && finalCursor == 2, "closed");
        bytes32 root = lab.rootId();
        vm.expectRevert();
        lab.list(root, 0, 65);
        vm.expectRevert();
        lab.list(root, 3, 1);
        require(lab.child(lab.rootId(), "missing") == 0, "local absence");
    }

    function testCarrierAccessEmptyMissingAndRangeBounds() public {
        bytes32 f = direct(op(2, lab.rootId(), "empty", ""));
        ByteStore store = ByteStore(address(lab.byteStore()));
        bytes32 emptyId = lab.getRevision(f, 1).contentId;
        require(store.exists(emptyId) && store.read(emptyId).length == 0, "empty exists");
        require(store.readRange(emptyId, 0, 0).length == 0, "empty range");
        vm.expectRevert();
        store.readRange(emptyId, 1, 0);
        vm.expectRevert();
        store.read(bytes32(uint256(123)));
        vm.expectRevert();
        store.put("unauthorized");
        f = direct(op(2, lab.rootId(), "data", "abcdef"));
        bytes32 id = lab.getRevision(f, 1).contentId;
        require(keccak256(store.readRange(id, 2, 3)) == keccak256("cde"), "range");
        vm.expectRevert();
        store.readRange(id, 5, 2);
    }

    function testNamesSizesAndDirectAuthorityFailClosed() public {
        EfsLab.Operation memory o = op(1, lab.rootId(), "ok", "");
        vm.expectRevert();
        lab.executeDirect(o);
        o.name = "..";
        vm.expectRevert();
        direct(o);
        o.name = "a/b";
        vm.expectRevert();
        direct(o);
        o.name = "";
        vm.expectRevert();
        direct(o);
        o.kind = 2;
        o.name = "big";
        o.data = new bytes(16385);
        vm.expectRevert();
        direct(o);
        vm.prank(owner);
        vm.expectRevert();
        lab.registerSchema(hex"06");
        require(lab.ownerNonce() == 0, "invalid no nonce");
    }

    function testTypedReferenceRejectsExistingWrongSchema() public {
        vm.prank(owner);
        bytes32 a = lab.registerSchema(hex"01");
        vm.prank(owner);
        bytes32 b = lab.registerSchema(hex"03");
        EfsLab.Operation memory o = op(4, lab.rootId(), "", abi.encodePacked(bytes32(uint256(8))));
        o.schemaId = b;
        bytes32 wrongRecord = direct(o);
        vm.prank(owner);
        bytes32 refSchema = lab.registerSchema(abi.encodePacked(hex"05", a));
        o.nonce = lab.ownerNonce();
        o.schemaId = refSchema;
        o.data = abi.encodePacked(wrongRecord);
        vm.expectRevert();
        direct(o);
        require(lab.receiptCount() == 1, "wrong typed reference no effect");
        (bytes32[] memory ids,, uint256 total) = lab.records(0, 64);
        require(total == 1 && ids[0] == wrongRecord, "record inventory");
        (bytes32[] memory types,, uint256 count) = lab.schemas(0, 64);
        require(count == 3 && types[0] == a && types[1] == b && types[2] == refSchema, "schema inventory");
    }

    function testSameBlockGrantBoundariesRetainPriorAuthority() public {
        bytes32 id = grant(lab.rootId(), 3, 10);
        EfsLab.Operation memory o = op(2, lab.rootId(), "x", "one");
        o.grantId = id;
        lab.execute(o, sign(SESSION_KEY, digest(o)));
        vm.prank(owner);
        lab.revokeGrant(id);
        (uint256 registered, uint256 revoked, uint64 rb, uint64 vb, uint64 rt, uint64 vt) = lab.grantBasis(id);
        require(registered == 0 && revoked == 1 && rb == vb && rt == vt, "same block exact receipt boundary");
        EfsLab.Receipt memory r = lab.receipt(0);
        require(r.timestamp == rt && r.blockNumber == rb && r.digest == digest(o), "historical basis");
        o.nonce = 1;
        o.name = "next";
        vm.expectRevert();
        lab.execute(o, sign(SESSION_KEY, digest(o)));
    }

    function testSessionExpiryWrongOperationAndGrantSubstitution() public {
        bytes32 id = grant(lab.rootId(), 3, 30);
        EfsLab.Operation memory o = op(2, lab.rootId(), "x", "one");
        o.grantId = id;
        bytes memory sig = sign(SESSION_KEY, digest(o));
        o.grantId = bytes32(uint256(99));
        vm.expectRevert();
        lab.execute(o, sig);
        o.grantId = id;
        o.kind = 4;
        vm.expectRevert();
        lab.execute(o, sign(SESSION_KEY, digest(o)));
        o.kind = 2;
        vm.warp(block.timestamp + 201);
        vm.expectRevert();
        lab.execute(o, sig);
        (, bytes memory approval,, uint32 writes, uint64 size) = lab.grantInfo(id);
        require(approval.length == 65 && writes == 0 && size == 0, "rejected grant no budget use");
    }

    function testLateFailureRollsBackBothContracts() public {
        EfsLab.Operation memory o = op(2, lab.rootId(), "rolled-back", "unique rollback bytes");
        bytes32 root = lab.rootId();
        // Verified with forge inspect EfsLab storageLayout: receiptCount slot1.
        // Reach finite exhaustion without 4096 setup writes. No production hook.
        vm.store(address(lab), bytes32(uint256(1)), bytes32(uint256(4096)));
        require(lab.receiptCount() == 4096, "failure setup");
        vm.expectRevert();
        direct(o);
        require(lab.child(root, "rolled-back") == 0 && lab.ownerNonce() == 0, "semantic rollback");
        require(!lab.byteStore().exists(content(o.data)), "separate byte storage rollback");
        (, uint256 next, uint256 total) = lab.list(root, 0, 64);
        require(next == 0 && total == 0 && lab.receiptCount() == 4096, "inventory rollback");
    }

    function testSignatureRejectsHighSAndShortWitness() public {
        EfsLab.Operation memory o = op(2, lab.rootId(), "x", "a");
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(OWNER_KEY, digest(o));
        bytes32 high = bytes32(uint256(0xfffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141) - uint256(s));
        bytes memory sig = abi.encodePacked(r, high, v == 27 ? uint8(28) : uint8(27));
        vm.expectRevert();
        lab.execute(o, sig);
        vm.expectRevert();
        lab.execute(o, hex"1234");
        lab.execute(o, abi.encodePacked(r, s, v));
        require(lab.receiptCount() == 1, "canonical signature admitted");
    }

    function testDepthBoundAndOrdinaryRuntimeLimits() public {
        bytes32 parent = lab.rootId();
        for (uint256 i; i < 16; ++i) {
            parent = direct(op(1, parent, "d", ""));
        }
        EfsLab.Operation memory o = op(1, parent, "too-deep", "");
        vm.expectRevert();
        direct(o);
        require(lab.receiptCount() == 16, "depth bound");
        require(
            address(lab).code.length <= 24576 && address(lab.byteStore()).code.length <= 24576, "normal runtime limits"
        );
    }

    function testFuzzExactPayloadAndRanges(uint16 sizeSeed, uint16 offsetSeed, uint16 lengthSeed) public {
        uint256 size = uint256(sizeSeed) % 513;
        bytes memory data = new bytes(size);
        for (uint256 i; i < size; ++i) {
            data[i] = bytes1(uint8(i));
        }
        bytes32 file = direct(op(2, lab.rootId(), "fuzz", data));
        bytes32 id = lab.getRevision(file, 1).contentId;
        require(id == content(data), "content identity");
        require(keccak256(lab.byteStore().read(id)) == keccak256(data), "full exact bytes");
        uint64 offset = uint64(uint256(offsetSeed) % (size + 1));
        uint32 length = uint32(uint256(lengthSeed) % (size - offset + 1));
        bytes memory range = lab.byteStore().readRange(id, offset, length);
        require(range.length == length, "exact range length");
        for (uint256 i; i < length; ++i) {
            require(range[i] == data[offset + i], "exact range bytes");
        }
    }

    function testLeastPrivilegeMkdirGrantDeniesFileAndRevision() public {
        bytes32 file=direct(op(2,lab.rootId(),"existing","old"));
        bytes32 id=grantMasked(lab.rootId(),2,20,1);
        EfsLab.Operation memory denied=op(2,lab.rootId(),"denied","new"); denied.grantId=id; denied.nonce=0;
        bytes memory signature=sign(SESSION_KEY,digest(denied));
        vm.expectRevert(); lab.execute(denied,signature);
        denied=op(3,file,"","changed"); denied.grantId=id; denied.nonce=0; denied.expectedRevision=1;
        signature=sign(SESSION_KEY,digest(denied)); vm.expectRevert(); lab.execute(denied,signature);
        (, , ,uint32 beforeWrites,uint64 beforeBytes)=lab.grantInfo(id);
        require(beforeWrites==0&&beforeBytes==0&&lab.getNode(file).revision==1,"denied mask no effects");
        require(!lab.byteStore().exists(content("new"))&&!lab.byteStore().exists(content("changed")),"denied mask no bytes");
        EfsLab.Operation memory allowed=op(1,lab.rootId(),"allowed",""); allowed.grantId=id; allowed.nonce=0;
        bytes32 dir=lab.execute(allowed,sign(SESSION_KEY,digest(allowed)));
        require(lab.getNode(dir).kind==1,"mkdir-only permits mkdir");
    }

    function testLeastPrivilegeCreateGrantDeniesMkdirAndRevision() public {
        bytes32 file=direct(op(2,lab.rootId(),"existing","old"));
        bytes32 id=grantMasked(lab.rootId(),2,20,2);
        EfsLab.Operation memory denied=op(1,lab.rootId(),"denied",""); denied.grantId=id; denied.nonce=0;
        bytes memory signature=sign(SESSION_KEY,digest(denied)); vm.expectRevert(); lab.execute(denied,signature);
        denied=op(3,file,"","changed"); denied.grantId=id; denied.nonce=0; denied.expectedRevision=1;
        signature=sign(SESSION_KEY,digest(denied)); vm.expectRevert(); lab.execute(denied,signature);
        (, , ,uint32 beforeWrites,uint64 beforeBytes)=lab.grantInfo(id);
        require(beforeWrites==0&&beforeBytes==0&&lab.getNode(file).revision==1,"create-only denied no effects");
        EfsLab.Operation memory allowed=op(2,lab.rootId(),"allowed","new"); allowed.grantId=id; allowed.nonce=0;
        bytes32 created=lab.execute(allowed,sign(SESSION_KEY,digest(allowed)));
        require(lab.getNode(created).kind==2,"create-only permits file");
    }

    function testLeastPrivilegeRevisionGrantDeniesBothCreateKinds() public {
        bytes32 file=direct(op(2,lab.rootId(),"existing","old"));
        bytes32 id=grantMasked(lab.rootId(),2,20,4);
        EfsLab.Operation memory denied=op(1,lab.rootId(),"denied",""); denied.grantId=id; denied.nonce=0;
        bytes memory signature=sign(SESSION_KEY,digest(denied)); vm.expectRevert(); lab.execute(denied,signature);
        denied=op(2,lab.rootId(),"denied","new"); denied.grantId=id; denied.nonce=0;
        signature=sign(SESSION_KEY,digest(denied)); vm.expectRevert(); lab.execute(denied,signature);
        (, , ,uint32 beforeWrites,uint64 beforeBytes)=lab.grantInfo(id);
        require(beforeWrites==0&&beforeBytes==0&&lab.receiptCount()==1,"revision-only denied no effects");
        EfsLab.Operation memory allowed=op(3,file,"","new"); allowed.grantId=id; allowed.nonce=0; allowed.expectedRevision=1;
        lab.execute(allowed,sign(SESSION_KEY,digest(allowed)));
        require(lab.getNode(file).revision==2,"revision-only permits revision");
    }
}
