// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import {Keys} from "../src/Keys.sol";
import {Ledger} from "../src/Ledger.sol";
import {IndexModule} from "../src/IndexModule.sol";
import {LensReader} from "../src/LensReader.sol";
import {Reconstructor} from "../src/LabHarness.sol";
import {LabBase} from "./LabBase.sol";

/// DISPOSABLE LAB, NO PROTOCOL CLAIM. Pre-seal checks: origin-qualified contract principals (1),
/// fresh-reader digest reconstruction with negatives (2), import = source evidence + separate
/// destination authorization (3), cursor basis beyond the admission ordinal and name dedupe (4).
contract LedgerImportTest is LabBase {
    bytes32 internal constant REALM2 = keccak256("lab/realm/2");

    function test_contract_principal_is_origin_qualified() public {
        // this test contract is a producer contract; it authors natively on two Realms
        Ledger other = new Ledger(registry, REALM2); // a distinct instance, independently of the Realm label or code
        require(address(other).codehash != address(ledger).codehash, "distinct Realms");
        bytes32 salt = bytes32(uint256(9));
        bytes32 s1 = ledger.create(salt);
        bytes32 s2 = other.create(salt);
        require(s1 != s2, "same contract address + same salt => different subject ids on different Realms");
        require(ledger.principalOf(address(this)) != other.principalOf(address(this)), "contract principals differ by origin");
        require(ledger.principalOf(eoaA) == other.principalOf(eoaA) && ledger.principalOf(eoaA) == Keys.principal(eoaA), "an EOA is its key everywhere");
        bytes32 origin = keccak256(abi.encode(keccak256("efs.lab.realm-origin/2"),block.chainid,address(ledger)));
        require(ledger.principalOf(address(this)) == Keys.contractPrincipal(origin, address(this)), "explicit derivation");
        require(s1 == Keys.subject(ledger.principalOf(address(this)), salt), "subject id from the origin-qualified creator");
    }

    function test_fresh_reader_reconstructs_identical_digest_with_negatives() public {
        bytes32 subj = subjectOf(eoaA, 3);
        bytes32 r1 = rid(QUOTE, q(3000));
        Ledger.Action[] memory a = new Ledger.Action[](4);
        a[0] = aCreate(bytes32(uint256(3)));
        a[1] = aPublish(QUOTE, q(3000));
        a[2] = aReuse(QUOTE, r1);
        a[3] = aBind(HEAD, subj, NO_ROLE, r1, 0);
        bytes[] memory b = new bytes[](4);
        b[1] = q(3000);
        (Ledger.Intent memory intent, bytes memory sig) = signed(PK_A, ledger, 0, a);
        bytes32 expected = ledger.intentDigest(intent, keccak256(abi.encode(a)));
        (uint64 pub,) = ledger.executeSigned(intent, a, b, sig);
        Reconstructor fresh = new Reconstructor(); // deployed after the fact: no cache, no calldata, no logs
        (Ledger.Action[] memory rebuilt, bytes32 h, bytes32 digest, address recovered, bool ok) = fresh.reconstruct(ledger, pub);
        require(ok && recovered == eoaA && digest == expected, "byte-identical digest from public getters only");
        require(rebuilt[1].kind == 1 && rebuilt[2].kind == 2 && rebuilt[2].typeId == QUOTE, "discriminator and typeId retained");
        (,, uint8 v,,, bytes32 r, bytes32 s0,,,,,,) = ledger.evidence(pub);
        Ledger.Action[] memory m = cloneAll(rebuilt);
        m[1].kind = 2; // flip the bodyHash-vs-recordId discriminator
        bytes32 d1 = ledger.intentDigest(intent, keccak256(abi.encode(m)));
        require(d1 != digest && ecrecover(d1, v, r, s0) != eoaA, "flipped discriminator changes the digest");
        m = cloneAll(rebuilt);
        m[2].typeId = ITEM; // flip a typeId
        bytes32 d2 = ledger.intentDigest(intent, keccak256(abi.encode(m)));
        require(d2 != digest && ecrecover(d2, v, r, s0) != eoaA, "flipped typeId changes the digest");
    }

    function sourceOf(Ledger l, uint64 pub) internal view returns (Ledger.SourceEvidence memory src) {
        (address author,, uint8 v,,, bytes32 r, bytes32 s, uint64 nonce, uint64 deadline,, bytes32 prof, bytes32 obl,) = l.evidence(pub);
        src.realmId = l.realmId();
        src.coreCodeCommitment = address(l).codehash;
        src.author = author;
        src.nonce = nonce;
        src.deadline = deadline;
        src.acceptanceProfile = prof;
        src.indexObligations = obl;
        src.v = v;
        src.r = r;
        src.s = s;
        src.sourcePrincipal = l.principalOf(author);
    }

    function test_import_requires_destination_authorization_and_keeps_identity() public {
        Ledger dest = new Ledger(registry, REALM2);
        IndexModule destIndex = new IndexModule(address(dest));
        dest.setIndexModule(address(destIndex));
        bytes32 subj = subjectOf(eoaA, 4);
        bytes32 r1 = rid(QUOTE, q(3000));
        Ledger.Action[] memory a = new Ledger.Action[](3);
        a[0] = aCreate(bytes32(uint256(4)));
        a[1] = aPublish(QUOTE, q(3000));
        a[2] = aBind(HEAD, subj, NO_ROLE, r1, 0);
        bytes[] memory b = new bytes[](3);
        b[1] = q(3000);
        (Ledger.Intent memory intent, bytes memory sig) = signed(PK_A, ledger, 0, a);
        (uint64 srcPub,) = ledger.executeSigned(intent, a, b, sig);
        Ledger.SourceEvidence memory src = sourceOf(ledger, srcPub);
        Ledger.Intent memory none;
        // source signature alone authorizes nothing at the destination
        try dest.importPublication(src, a, b, none, "") {
            require(false, "x");
        } catch (bytes memory err) {
            expectSel(err, Ledger.E_DESTINATION_AUTH.selector, "source signature is not destination authority");
        }
        try dest.executeSigned(intent, a, b, sig) {
            require(false, "x");
        } catch (bytes memory err) {
            expectSel(err, Ledger.E_INTENT.selector, "the source intent is bound to the source Realm");
        }
        // destination authorization: the same EOA signs under the destination context
        (Ledger.Intent memory dst, bytes memory dstSig) = signed(PK_A, dest, 0, a);
        Ledger.Intent memory wrongRealm = cloneIntent(dst);
        wrongRealm.realmId = REALM;
        try dest.importPublication(src, a, b, wrongRealm, dstSig) {
            require(false, "x");
        } catch (bytes memory err) {
            expectSel(err, Ledger.E_DESTINATION_AUTH.selector, "destination authorization must name the destination");
        }
        (uint64 dstPub,) = dest.importPublication(src, a, b, dst, dstSig);
        require(dest.subjectCreatedAt(subj) != 0 && dest.subjectCreatedAt(subj) == ledger.subjectCreatedAt(subj), "id(F) preserved");
        require(dest.isImported(dstPub) && !ledger.isImported(srcPub), "marked as imported");
        Ledger.SourceEvidence memory kept = dest.sourceEvidence(dstPub);
        require(kept.grade == 1 && kept.realmId == REALM && kept.r == src.r, "source evidence retained and verified");
        (bytes32 sd, address srec, uint8 grade,) = recon.reconstructSource(dest, dstPub);
        require(srec == eoaA && grade == 1 && sd == ledger.intentDigest(intent, keccak256(abi.encode(a))), "source digest rebuilt at the destination");
        (,,, address drec, bool dok) = recon.reconstruct(dest, dstPub);
        require(dok && drec == eoaA, "destination authorization rebuilt from destination rows");
        LensReader destLens = new LensReader(dest, destIndex);
        (uint8 st, bytes32 t,, address au,) = destLens.resolve(lensOf(eoaA), HEAD, subj, NO_ROLE);
        require(st == 1 && t == r1 && au == eoaA, "destination head under destination authority");
        // destination acceptance is its own gate: source acceptance never becomes destination authority
        Ledger.Action[] memory a2 = one(aPublish(QUOTE, q(3100)));
        bytes[] memory b2 = new bytes[](1);
        b2[0] = q(3100);
        (Ledger.Intent memory i2, bytes memory s2) = signed(PK_A, ledger, 1, a2);
        (uint64 p2,) = ledger.executeSigned(i2, a2, b2, s2); // accepted at the source under the current rule
        (Ledger.Intent memory d2, bytes memory ds2) = signed(PK_A, dest, 1, a2);
        acceptor.set(1, 0); // the destination's POLICY acceptor (the mutable mock, row 2) now refuses (its codehash is unchanged: same profile)
        try dest.importPublication(sourceOf(ledger, p2), a2, b2, d2, ds2) {
            require(false, "x");
        } catch (bytes memory err) {
            expectSel(err, Ledger.E_POLICY_REJECTED.selector, "destination acceptance (mandatory + policy) re-runs on import");
        }
        acceptor.set(0, 0);
    }

    /// Authority repair R1 (replaces test_import_by_contract_author_keeps_source_subject, which
    /// asserted the unsafe grade-0 path): a native-source packet is UNSUPPORTED and fails closed.
    function test_import_of_native_source_is_unsupported_and_fails_closed() public {
        Ledger dest = new Ledger(registry, REALM2);
        bytes32 salt = bytes32(uint256(8));
        Ledger.Action[] memory a = one(aCreate(salt));
        bytes[] memory b = new bytes[](1);
        (uint64 srcPub,) = ledger.execute(a, b, 0); // this contract authors natively at the source
        bytes32 subj = Keys.subject(ledger.principalOf(address(this)), salt);
        require(ledger.subjectCreatedAt(subj) != 0, "source subject");
        Ledger.SourceEvidence memory src = sourceOf(ledger, srcPub); // v == 0: chain-state witness only
        Ledger.Intent memory none;
        try dest.importPublication(src, a, b, none, "") {
            require(false, "x");
        } catch (bytes memory err) {
            expectSel(err, Ledger.E_SOURCE_UNSUPPORTED.selector, "native-source import: unsupported, fail closed");
        }
        require(dest.subjectCreatedAt(subj) == 0 && dest.subjectCreatedAt(Keys.subject(dest.principalOf(address(this)), salt)) == 0, "nothing minted under either derivation");
        (,,, uint64 pubs) = dest.counts();
        require(pubs == 0 && dest.nonces(address(this)) == 0 && dest.sourceEvidence(1).author == address(0), "nothing retained");
        // local native authorship at the destination is unchanged: a destination-qualified subject
        (uint64 p,) = dest.execute(a, b, 0);
        require(p == 1 && dest.subjectCreatedAt(Keys.subject(dest.principalOf(address(this)), salt)) != 0, "native local publication still supported");
    }

    function test_cursor_rejects_stale_basis_and_dedupes_names() public {
        bytes32 sx = alice.create(bytes32(uint256(31)));
        bytes32 sy = alice.create(bytes32(uint256(32)));
        bytes32 sbx = bob.create(bytes32(uint256(33)));
        bytes32 sz = bob.create(bytes32(uint256(34)));
        alice.bind(FOLDER, DRAFTS, name("x"), sx, 0);
        alice.bind(FOLDER, DRAFTS, name("y"), sy, 0);
        bob.bind(FOLDER, DRAFTS, name("x"), sbx, 0);
        bob.bind(FOLDER, DRAFTS, name("z"), sz, 0);
        address[] memory ab = lensOf(address(alice), address(bob));
        LensReader.Cursor memory fresh;
        LensReader.Page memory full = lens.list(ab, FOLDER, DRAFTS, fresh, 10);
        require(full.status == 2 && full.selectedSoFar == 3 && full.rawTotal == 4, "x bound by both authors is one selected entry");
        require(full.items[0].target == sx && full.items[2].target == sz, "A's x, A's y, B's z");
        require(full.hydrations == 4 + 2 && full.scanned == 4, "candidate budget and mask probes are charged explicitly");
        LensReader.Page memory p1 = lens.list(ab, FOLDER, DRAFTS, fresh, 1);
        require(p1.status == 1 && p1.next.indexGeneration == 0, "page 1");
        index.bumpGeneration();
        try lens.list(ab, FOLDER, DRAFTS, p1.next, 1) {
            require(false, "x");
        } catch (bytes memory err) {
            expectSel(err, LensReader.E_CURSOR.selector, "a new index generation invalidates the cursor");
        }
        p1 = lens.list(ab, FOLDER, DRAFTS, fresh, 1);
        registry.setBindingRefType(TAG, name("any"), bytes32(0)); // a rule change without new admissions
        try lens.list(ab, FOLDER, DRAFTS, p1.next, 1) {
            require(false, "x");
        } catch (bytes memory err) {
            expectSel(err, LensReader.E_CURSOR.selector, "a new rules epoch invalidates the cursor");
        }
        p1 = lens.list(ab, FOLDER, DRAFTS, fresh, 1);
        LensReader.Page memory p2 = lens.list(ab, FOLDER, DRAFTS, p1.next, 10);
        require(p2.status == 2 && p2.selectedSoFar == 3, "continuation under an unchanged basis completes");
    }
}
