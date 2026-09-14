// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

// DISPOSABLE direct-deployment configuration regression; historical downgrade evidence is retained.
import {LabBase} from "./LabBase.sol";
import {Ledger} from "../src/Ledger.sol";
import {IndexModule} from "../src/IndexModule.sol";
import {Keys} from "../src/Keys.sol";
import {LensReader} from "../src/LensReader.sol";

contract IndexConfigNonAdmin {
    function tryRedeclare(IndexModule index, bytes32 family) external returns (bool, bytes memory) {
        return address(index).call(abi.encodeCall(index.declareOptional, (family, uint64(2))));
    }
}

// Exposes the real internal mutation path; no fake coverage or storage writes.
contract IndexConfigDeclarationProbe is IndexModule {
    constructor(address ledger_) IndexModule(ledger_) {}

    function declareForTest(bytes32 family, bool mandatory, uint64 fromAdmission) external {
        if (msg.sender != admin) revert E_ADMIN();
        _declare(family, mandatory, fromAdmission);
    }
}

contract IndexConfigExpectationTest is LabBase {
    struct Counts { uint64 admissions; uint64 records; uint64 bindings; uint64 publications; }

    function readCounts() private view returns (Counts memory c) {
        (c.admissions, c.records, c.bindings, c.publications) = ledger.counts();
    }

    // Catches an authorized optional setter silently replacing a pre-signed required declaration.
    function test_required_downgrade_refuses_without_invalidating_signed_publication() public {
        {
            Ledger.Action[] memory seedActions = one(aPublish(BINARY, hex"01"));
            (Ledger.Intent memory seed, bytes memory seedSig) = signed(PK_A, ledger, ledger.nonces(eoaA), seedActions);
            bytes[] memory seedBodies = new bytes[](1);
            seedBodies[0] = hex"01";
            ledger.executeSigned(seed, seedActions, seedBodies, seedSig);
        }

        bytes32 family = index.FAMILY_BY_TYPE();
        bytes32 postingKey = Keys.byTypeList(BINARY);
        Counts memory before_ = readCounts();
        (uint8 status, uint64 from, uint64 through) = index.coverage(family, BINARY);
        require(status == index.COMPLETE() && from == 1 && through == before_.admissions, "seed family complete");
        (uint64 countBefore, uint64 liveBefore,, uint16 flagsBefore) = index.postingHead(postingKey);
        require(countBefore == 1 && liveBefore == 1, "one real seed posting");

        bytes memory freshBody = hex"0203";
        bytes32 freshId = Keys.recordFromHash(BINARY, keccak256(freshBody));
        Ledger.Action[] memory actions = one(aPublish(BINARY, freshBody));
        uint64 nonceBefore = ledger.nonces(eoaA);
        (Ledger.Intent memory intent, bytes memory signature) = signed(PK_A, ledger, nonceBefore, actions);
        bytes[] memory bodies = new bytes[](1);
        bodies[0] = freshBody;
        bytes32 signedInput = keccak256(abi.encode(intent, signature, actions, bodies));
        bytes32 obligation = ledger.indexObligations();
        bytes32 moduleCodehash = address(index).codehash;
        uint64 generation = index.generation();
        require(intent.indexObligations == obligation && intent.author == eoaA, "saved original signer and obligation");

        {
            (bool ok, bytes memory err) = new IndexConfigNonAdmin().tryRedeclare(index, family);
            require(!ok && keccak256(err) == keccak256(abi.encodeWithSelector(IndexModule.E_ADMIN.selector)), "redeclaration remains admin-only");
        }
        {
            (bool ok, bytes memory err) = address(index).call(abi.encodeCall(index.declareOptional, (family, uint64(2))));
            require(!ok && keccak256(err) == keccak256(abi.encodeWithSelector(IndexModule.E_MANDATORY_FAMILY.selector)),
                "required downgrade must refuse exactly");
        }
        require(ledger.indexObligations() == obligation && address(index).codehash == moduleCodehash, "refused change preserves module obligation");
        require(index.generation() == generation, "refused change preserves generation");
        (status, from, through) = index.coverage(family, BINARY);
        require(status == index.COMPLETE() && from == 1 && through == before_.admissions, "refused change preserves complete declaration");
        require(keccak256(abi.encode(readCounts())) == keccak256(abi.encode(before_)), "metadata change alone does not admit anything");
        require(ledger.nonces(eoaA) == nonceBefore, "metadata change leaves signer nonce untouched");
        require(keccak256(abi.encode(intent, signature, actions, bodies)) == signedInput, "submit untouched signed input");

        (uint64 publication, uint64 first) = ledger.executeSigned(intent, actions, bodies, signature);
        Counts memory after_ = readCounts();
        require(after_.admissions == before_.admissions + 1 && after_.records == before_.records + 1
            && after_.bindings == before_.bindings && after_.publications == before_.publications + 1, "old signature really admits one fresh Record");
        require(first == before_.admissions + 1 && publication == before_.publications + 1, "returned admission and publication match counts");
        require(ledger.nonces(eoaA) == nonceBefore + 1, "accepted old signature advances signer nonce");
        require(keccak256(abi.encode(intent, signature, actions, bodies)) == signedInput, "original signed input unchanged after submission");
        {
            (bytes32 t, uint64 recordFirst, uint32 occurrences, bytes memory observed) = ledger.record(freshId);
            require(t == BINARY && recordFirst == first && occurrences == 1
                && keccak256(observed) == keccak256(freshBody), "exact fresh body retained once");
            (uint64 count, uint64 live, uint64 last, uint16 flags) = index.postingHead(postingKey);
            require(count == countBefore + 1 && live == liveBefore + 1 && last == first && flags == flagsBefore, "normal by-Type hook still appends");
            require(index.postingAt(postingKey, countBefore) == first, "new posting at old count is the real admission");
        }
        (status, from, through) = index.coverage(family, BINARY);
        require(status == index.COMPLETE() && from == 1 && through == after_.admissions, "required family stays complete after real append");
        require(ledger.indexObligations() == obligation && index.generation() == generation, "fixed configuration and ordinary progress remain separate");
    }

    function _refuseDeclaration(IndexConfigDeclarationProbe probe, bytes32 family, bool mandatory, uint64 from) private {
        (bool ok, bytes memory err) = address(probe).call(abi.encodeCall(probe.declareForTest, (family, mandatory, from)));
        require(!ok && keccak256(err) == keccak256(abi.encodeWithSelector(IndexModule.E_MANDATORY_FAMILY.selector)),
            "runtime internal mandatory mutation must refuse exactly");
    }

    // Catches guards placed only on the optional setter, and guards that allow new runtime requirements.
    function test_internal_required_declarations_are_constructor_only() public {
        IndexConfigDeclarationProbe probe = new IndexConfigDeclarationProbe(address(ledger));
        bytes32 required = probe.FAMILY_BY_TYPE();
        (uint8 status, uint64 from, uint64 through) = probe.coverage(required, BINARY);
        require(status == probe.COMPLETE() && from == 1 && through == 0, "real base constructor installs required family");
        bytes32 added = keccak256("lab/index-config/new-required");
        _refuseDeclaration(probe, added, true, 1);
        (status, from, through) = probe.coverage(added, 0);
        require(status == probe.UNKNOWN() && from == 0 && through == 0, "refused new family remains unknown");
        bytes32 optional = keccak256("lab/index-config/optional");
        probe.declareOptional(optional, 2);
        _refuseDeclaration(probe, optional, true, 1);
        (status, from, through) = probe.coverage(optional, 0);
        require(status == probe.PARTIAL() && from == 2 && through == 0, "optional declaration is not promoted");
        _refuseDeclaration(probe, required, true, 2);
        _refuseDeclaration(probe, required, false, 1);
        (status, from, through) = probe.coverage(required, BINARY);
        require(status == probe.COMPLETE() && from == 1 && through == 0, "required declaration cannot be replaced");
        require(admissions() == 0 && ledger.nonces(eoaA) == 0, "declarations are not admissions");
    }

    // Catches accidentally binding processed progress or cursor generation into queued write authority.
    function test_signed_write_survives_other_author_optional_and_generation_progress() public {
        bytes32 sx = bob.create(bytes32(uint256(991)));
        bytes32 sy = bob.create(bytes32(uint256(992)));
        bob.bind(FOLDER, DRAFTS, name("x"), sx, 0);
        bob.bind(FOLDER, DRAFTS, name("y"), sy, 0);
        bytes[] memory bodies = new bytes[](1);
        bodies[0] = hex"a1";
        Ledger.Action[] memory actions = one(aPublish(BINARY, bodies[0]));
        (Ledger.Intent memory intent, bytes memory signature) = signed(PK_A, ledger, 0, actions);
        bytes32 signedInput = keccak256(abi.encode(intent, signature, actions, bodies));
        bytes32 obligation = ledger.indexObligations();
        bytes32 optional = keccak256("lab/index-config/late-optional");
        {
            bytes[] memory bobBodies = new bytes[](1);
            bobBodies[0] = hex"b1";
            (uint64 publication, uint64 first) = bob.execute(one(aPublish(BINARY, bobBodies[0])), bobBodies);
            require(publication == 5 && first == 5 && ledger.nonces(address(bob)) == 5, "actual unrelated Bob publication");
            (address author, uint8 proof,,,,,,,,,,,) = ledger.evidence(publication);
            require(author == address(bob) && proof == ledger.PROOF_NATIVE(), "real Bob author not relayer");
        }
        index.declareOptional(optional, 3);
        {
            LensReader.Cursor memory zero;
            LensReader.Page memory page = lens.list(lensOf(address(bob)), FOLDER, DRAFTS, zero, 1);
            require(page.status == lens.PARTIAL() && page.items.length == 1 && page.items[0].target == sx
                && page.rawTotal == 2 && page.next.indexGeneration == 0, "real partial cursor before generation change");
            index.bumpGeneration();
            (bool ok, bytes memory err) = address(lens).staticcall(abi.encodeCall(lens.list,
                (lensOf(address(bob)), FOLDER, DRAFTS, page.next, uint256(1))));
            require(!ok && keccak256(err) == keccak256(abi.encodeWithSelector(LensReader.E_CURSOR.selector)),
                "generation alone invalidates real old cursor");
        }
        require(index.generation() == 1 && admissions() == 5 && ledger.nonces(eoaA) == 0,
            "optional and generation do not consume Alice nonce or admissions");
        require(ledger.indexObligations() == obligation && intent.indexObligations == obligation,
            "progress does not change queued configuration identity");
        require(keccak256(abi.encode(intent, signature, actions, bodies)) == signedInput, "original Alice input untouched");
        (uint64 publication, uint64 first) = ledger.executeSigned(intent, actions, bodies, signature);
        require(publication == 6 && first == 6 && ledger.nonces(eoaA) == 1, "queued Alice action really admitted");
        (bytes32 t, uint64 recordFirst, uint32 occurrences, bytes memory body) = ledger.record(rid(BINARY, hex"a1"));
        require(t == BINARY && recordFirst == 6 && occurrences == 1 && keccak256(body) == keccak256(hex"a1"), "exact Alice Record");
        (uint64 count, uint64 live, uint64 last,) = index.postingHead(Keys.byTypeList(BINARY));
        require(count == 2 && live == 2 && last == 6 && index.postingAt(Keys.byTypeList(BINARY), 1) == 6, "both real records indexed");
        (uint8 status, uint64 from, uint64 through) = index.coverage(optional, 0);
        require(status == index.PARTIAL() && from == 3 && through == 6, "late optional stays honestly partial");
        (status, from, through) = index.coverage(index.FAMILY_BY_TYPE(), BINARY);
        require(status == index.COMPLETE() && from == 1 && through == 6, "required coverage advances normally");
    }

    // Catches dropping address identity from the signed obligation, without mutating the original intent.
    function test_actual_module_replacement_rejects_old_signature() public {
        bytes[] memory bodies = new bytes[](1);
        bodies[0] = hex"abba";
        Ledger.Action[] memory actions = one(aPublish(BINARY, bodies[0]));
        (Ledger.Intent memory intent, bytes memory signature) = signed(PK_A, ledger, 0, actions);
        IndexModule replacement = new IndexModule(address(ledger));
        ledger.setIndexModule(address(replacement));
        require(intent.indexObligations != ledger.indexObligations(), "actual replacement changes commitment");
        (bool ok, bytes memory err) = address(ledger).call(abi.encodeCall(ledger.executeSigned, (intent, actions, bodies, signature)));
        require(!ok && keccak256(err) == keccak256(abi.encodeWithSelector(Ledger.E_INTENT.selector, uint256(4))),
            "old signature refuses exact changed index field");
        Counts memory c = readCounts();
        require(c.admissions == 0 && c.records == 0 && c.bindings == 0 && c.publications == 0
            && ledger.nonces(eoaA) == 0, "stale obligation refusal writes nothing");
        (intent, signature) = signed(PK_A, ledger, 0, actions);
        (uint64 publication, uint64 first) = ledger.executeSigned(intent, actions, bodies, signature);
        (uint64 count, uint64 live,,) = replacement.postingHead(Keys.byTypeList(BINARY));
        require(publication == 1 && first == 1 && count == 1 && live == 1, "fresh replacement intent maintains required index");
    }

    // Catches treating a default-unset index as a required getter/callback target or fabricating coverage.
    function test_default_unset_index_keeps_zero_obligation_and_unknown_listing() public {
        Ledger detached = new Ledger(registry, REALM);
        require(detached.indexModule() == address(0) && detached.indexObligations() == 0, "default index is explicitly unset");
        bytes[] memory bodies = new bytes[](1);
        bodies[0] = hex"d0";
        Ledger.Action[] memory actions = one(aPublish(BINARY, bodies[0]));
        (Ledger.Intent memory intent, bytes memory signature) = signed(PK_A, detached, 0, actions);
        require(intent.indexObligations == 0, "signed ablation states zero obligation");
        (uint64 publication, uint64 first) = detached.executeSigned(intent, actions, bodies, signature);
        require(publication == 1 && first == 1 && detached.nonces(eoaA) == 1, "unset index does not reject every write");
        (bytes32 t, uint64 recordFirst, uint32 occurrences, bytes memory body) = detached.record(rid(BINARY, hex"d0"));
        require(t == BINARY && recordFirst == 1 && occurrences == 1 && keccak256(body) == keccak256(hex"d0"), "ablation retains exact Record");
        LensReader detachedLens = new LensReader(detached, IndexModule(address(0)));
        LensReader.Cursor memory zero;
        LensReader.Page memory page = detachedLens.list(lensOf(eoaA), FOLDER, DRAFTS, zero, 1);
        require(page.status == detachedLens.UNKNOWN() && page.items.length == 0, "unset index listing is unknown not complete");
    }
}
