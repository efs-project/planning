// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import {Keys} from "../src/Keys.sol";
import {Ledger} from "../src/Ledger.sol";
import {IndexModule} from "../src/IndexModule.sol";
import {LensReader} from "../src/LensReader.sol";
import {TypeRegistry} from "../src/TypeRegistry.sol";
import {MockAcceptor, FailingIndexModule, Actor, Consumer, Reconstructor} from "../src/LabHarness.sol";
import {MinBodyAcceptor} from "../src/LabAcceptors.sol";

/// Minimal cheat-code surface, declared by hand (no forge-std). Same pattern as
/// Reviews/2026-09-05-c0-core/test/PointReads.t.sol.
interface Vm {
    function sign(uint256 privateKey, bytes32 digest) external pure returns (uint8 v, bytes32 r, bytes32 s);
    function addr(uint256 privateKey) external pure returns (address);
    function warp(uint256 newTimestamp) external;
}

/// DISPOSABLE LAB, NO PROTOCOL CLAIM. Shared deployment and helpers; assertions are `require`.
abstract contract LabBase {
    Vm internal constant vm = Vm(address(uint160(uint256(keccak256("hevm cheat code")))));

    bytes32 internal constant REALM = keccak256("lab/realm/1");
    // Shape commitments (the lab has no schema language: the Type's name hash stands in). Since the
    // authority repair (REPAIR.md R2) a Type id is DERIVED from (shape, refTypes, declared rule
    // codehash) by the registry, so the ids below are assigned in setUp, not constants.
    bytes32 internal constant QUOTE_SHAPE = keccak256("lab/type/quote/1"); // 32-byte uint256 body, acceptor-gated
    bytes32 internal constant BINARY_SHAPE = keccak256("lab/type/binary/1"); // raw bytes, no acceptor
    bytes32 internal constant ITEM_SHAPE = keccak256("lab/type/item/1");
    bytes32 internal constant PAIR_SHAPE = keccak256("lab/type/pair/1"); // two leading checked refs to ITEM
    bytes32 internal QUOTE;
    bytes32 internal BINARY;
    bytes32 internal ITEM;
    bytes32 internal PAIR;
    bytes32 internal constant HEAD = keccak256("efs2/purpose/head/1"); // (author, HEAD, subjectId) -> record
    bytes32 internal constant FOLDER = keccak256("efs2/purpose/folder/1"); // (author, FOLDER, folderId, nameHash) -> subject
    bytes32 internal constant TAG = keccak256("efs2/purpose/tag/1"); // (author, TAG, subject|record, concept) -> stance
    bytes32 internal constant NO_ROLE = bytes32(0);
    bytes32 internal constant DRAFTS = keccak256("/drafts");
    bytes32 internal constant PUBLISHED = keccak256("/published");
    bytes32 internal constant SWAPS = keccak256("/swaps");
    uint256 internal constant PK_A = 0xA11CE;
    uint256 internal constant PK_B = 0xB0B;

    TypeRegistry internal registry;
    MockAcceptor internal acceptor; // MUTABLE test double: installed only as the ADDITIONAL policy of QUOTE and PAIR (activate), never a mandatory rule
    MinBodyAcceptor internal quoteRule; // QUOTE's mandatory rule: >= 32 bytes (immutable threshold => part of the id)
    MinBodyAcceptor internal pairRule; // PAIR's mandatory rule: >= 96 bytes (two checked refs + one payload word)
    Ledger internal ledger;
    IndexModule internal index;
    LensReader internal lens;
    Actor internal alice; // genuine contract author
    Actor internal bob; // genuine contract author
    Consumer internal consumer;
    Reconstructor internal recon;
    address internal eoaA;
    address internal eoaB;

    function setUp() public virtual {
        vm.warp(1_700_000_000);
        registry = new TypeRegistry();
        acceptor = new MockAcceptor();
        ledger = new Ledger(registry, REALM);
        index = new IndexModule(address(ledger));
        ledger.setIndexModule(address(index));
        lens = new LensReader(ledger, index);
        alice = new Actor(ledger);
        bob = new Actor(ledger);
        consumer = new Consumer(lens);
        recon = new Reconstructor();
        eoaA = vm.addr(PK_A);
        eoaB = vm.addr(PK_B);
        quoteRule = new MinBodyAcceptor(32);
        pairRule = new MinBodyAcceptor(96);
        bytes32[] memory none;
        QUOTE = registry.register(QUOTE_SHAPE, address(quoteRule), none); // mandatory rule: stateless, immutable-configured
        BINARY = registry.register(BINARY_SHAPE, address(0), none);
        ITEM = registry.register(ITEM_SHAPE, address(0), none);
        bytes32[] memory twoItems = new bytes32[](2);
        twoItems[0] = ITEM;
        twoItems[1] = ITEM;
        PAIR = registry.register(PAIR_SHAPE, address(pairRule), twoItems);
        require(QUOTE == Keys.typeId(QUOTE_SHAPE, none, address(quoteRule).codehash) && PAIR == Keys.typeId(PAIR_SHAPE, twoItems, address(pairRule).codehash), "exact ids reconstructible");
        require(address(quoteRule).codehash != address(pairRule).codehash, "an immutable threshold is part of the code identity");
        // the mutable mock is an ADDITIONAL Realm policy (row 2) on QUOTE and PAIR; its refusals are E_POLICY_REJECTED
        require(registry.activate(QUOTE, address(acceptor)) == 2 && registry.activate(PAIR, address(acceptor)) == 2, "mock installed as policy row 2");
    }

    // ---- fixtures
    function q(uint256 price) internal pure returns (bytes memory) {
        return abi.encode(price); // the matched 32-byte quote body
    }

    function f41(bytes1 b) internal pure returns (bytes memory out) {
        out = new bytes(41); // the matched 41-byte binary body
        for (uint256 i; i < 41; ++i) {
            out[i] = b;
        }
    }

    function rid(bytes32 typeId, bytes memory data) internal pure returns (bytes32) {
        return Keys.recordFromHash(typeId, keccak256(data));
    }

    function name(string memory s) internal pure returns (bytes32) {
        return keccak256(bytes(s));
    }

    /// Principal id as the lab ledger names it (origin-qualified for contracts).
    function pid(address account) internal view returns (bytes32) {
        return ledger.principalOf(account);
    }

    function subjectOf(address creator, uint256 salt) internal view returns (bytes32) {
        return Keys.subject(pid(creator), bytes32(salt));
    }

    // ---- action builders
    function aPublish(bytes32 typeId, bytes memory data) internal pure returns (Ledger.Action memory x) {
        x.kind = 1;
        x.typeId = typeId;
        x.bodyHashOrRecordId = keccak256(data);
    }

    function aReuse(bytes32 typeId, bytes32 id) internal pure returns (Ledger.Action memory x) {
        x.kind = 2;
        x.typeId = typeId;
        x.bodyHashOrRecordId = id;
    }

    function aBind(bytes32 purpose, bytes32 subject, bytes32 role, bytes32 target, uint32 rev)
        internal
        pure
        returns (Ledger.Action memory x)
    {
        x.kind = 3;
        x.purpose = purpose;
        x.subject = subject;
        x.role = role;
        x.target = target;
        x.expectedRevision = rev;
    }

    function aUnbind(bytes32 purpose, bytes32 subject, bytes32 role, uint32 rev) internal pure returns (Ledger.Action memory x) {
        x.kind = 4;
        x.purpose = purpose;
        x.subject = subject;
        x.role = role;
        x.expectedRevision = rev;
    }

    function aCreate(bytes32 salt) internal pure returns (Ledger.Action memory x) {
        x.kind = 5;
        x.salt = salt;
    }

    function aWithdraw(uint64 admissionOrdinal) internal pure returns (Ledger.Action memory x) {
        x.kind = 6;
        x.target = bytes32(uint256(admissionOrdinal));
    }

    function one(Ledger.Action memory a) internal pure returns (Ledger.Action[] memory arr) {
        arr = new Ledger.Action[](1);
        arr[0] = a;
    }

    function two(Ledger.Action memory a, Ledger.Action memory b) internal pure returns (Ledger.Action[] memory arr) {
        arr = new Ledger.Action[](2);
        arr[0] = a;
        arr[1] = b;
    }

    /// Deep copy: memory struct assignment aliases, so mutation tests need real clones.
    function clone(Ledger.Action memory x) internal pure returns (Ledger.Action memory) {
        return Ledger.Action(x.kind, x.typeId, x.bodyHashOrRecordId, x.purpose, x.subject, x.role, x.target, x.expectedRevision, x.salt);
    }

    function cloneAll(Ledger.Action[] memory a) internal pure returns (Ledger.Action[] memory m) {
        m = new Ledger.Action[](a.length);
        for (uint256 i; i < a.length; ++i) {
            m[i] = clone(a[i]);
        }
    }

    function cloneIntent(Ledger.Intent memory i) internal pure returns (Ledger.Intent memory) {
        return Ledger.Intent(i.realmId, i.coreCodeCommitment, i.author, i.nonce, i.deadline, i.acceptanceProfile, i.indexObligations);
    }

    // ---- signing (EOA authors)
    function signed(uint256 pk, Ledger l, uint64 nonce, Ledger.Action[] memory a)
        internal
        view
        returns (Ledger.Intent memory intent, bytes memory sig)
    {
        intent = Ledger.Intent(
            l.realmId(),
            address(l).codehash,
            vm.addr(pk),
            nonce,
            uint64(block.timestamp + 3600),
            l.acceptanceProfileOf(a),
            l.indexObligations()
        );
        sig = signIntent(pk, l, intent, a);
    }

    function signIntent(uint256 pk, Ledger l, Ledger.Intent memory intent, Ledger.Action[] memory a)
        internal
        view
        returns (bytes memory sig)
    {
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(pk, l.intentDigest(intent, keccak256(abi.encode(a))));
        sig = abi.encodePacked(r, s, v);
    }

    // ---- assertions and reads
    function sel(bytes memory err) internal pure returns (bytes4 s) {
        assembly ("memory-safe") {
            s := mload(add(err, 32))
        }
    }

    function expectSel(bytes memory err, bytes4 expected, string memory label) internal pure {
        require(sel(err) == expected, label);
    }

    function admissions() internal view returns (uint64 n) {
        (n,,,) = ledger.counts();
    }

    function lensOf(address a) internal pure returns (address[] memory l) {
        l = new address[](1);
        l[0] = a;
    }

    function lensOf(address a, address b) internal pure returns (address[] memory l) {
        l = new address[](2);
        l[0] = a;
        l[1] = b;
    }

    function headOf(address author, bytes32 purpose, bytes32 subject, bytes32 role)
        internal
        view
        returns (uint8 state, uint32 revision, bytes32 target)
    {
        (state, revision,,,, target) = ledger.head(Keys.binding(pid(author), Keys.position(purpose, subject, role)));
    }
}
