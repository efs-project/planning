// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import {Keys} from "../src/Keys.sol";
import {Ledger} from "../src/Ledger.sol";
import {IndexModule} from "../src/IndexModule.sol";
import {LensReader} from "../src/LensReader.sol";
import {TypeRegistry} from "../src/TypeRegistry.sol";
import {IAcceptor} from "../src/Interfaces.sol";
import {QuoteAcceptor, MinBodyAcceptor} from "../src/LabAcceptors.sol";
import {MockAcceptor} from "../src/LabHarness.sol";
import {LabBase} from "./LabBase.sol";

/// DISPOSABLE LAB, NO PROTOCOL CLAIM. PHASE 2 (flipped) falsifiers + repair tests of the
/// authority repair (FALSIFY.md, REPAIR.md). The Phase 1 text that fails on e77f36d is retained
/// verbatim at FALSIFY.phase1.t.sol.txt. UNRUN: written under the no-compile rule.
///   F1  a grade-0 (src.v == 0) import packet is unsupported: fail closed, nothing minted.
///   F2  the EOA-signed import path never lets a source signature authorize destination effects.
///   F3  a Type id is derived from its descriptor; a changed descriptor is a new Type; the same
///       descriptor cannot be registered twice; an old record stays a well-formed instance.
///   F4  Realm acceptance policy is a separate append-only activation history; the policy row
///       that admitted a record is recorded per admission and reported by acceptanceBasis.
///   R3  receipt-bound activation (stale signature, old evidence reconstructs) and import that
///       re-runs the destination's current policy while retaining the source basis.
///   F5  the declared rule is the Type's MANDATORY predicate (always runs, refusal final);
///       policy can only add constraints; activate(0) = no additional policy, never no
///       validation; the mutable-mandatory gap is demonstrated and documented, not repaired.
///       Fixture convention: mandatory rules are stateless/immutable-configured (MinBodyAcceptor);
///       the mutable MockAcceptor is QUOTE's/PAIR's ADDITIONAL policy (row 2) from LabBase.setUp.
///       The Phase 1 F5 text that fails on aaecfed is retained at FALSIFY.phase1-F5.t.sol.txt.

/// Fixture rule v2 of sdk-fixture step 10: a 32-byte uint256 quote whose mantissa is at most
/// 2_500_000_000. A different codehash from MockAcceptor.
contract StrictQuoteAcceptor is IAcceptor {
    uint256 public constant CAP = 2_500_000_000;

    function accept(bytes32, bytes calldata data, bytes32[] calldata) external pure returns (bool) {
        if (data.length != 32) return false;
        return abi.decode(data, (uint256)) <= CAP;
    }
}

/// Accepts everything (pure). The "permissive policy" of F5.
contract PermissiveAcceptor is IAcceptor {
    function accept(bytes32, bytes calldata, bytes32[] calldata) external pure returns (bool) {
        return true;
    }
}

/// An unrelated contract importing on its own behalf (msg.sender == src.author path).
contract Importer {
    function run(Ledger dest, Ledger.SourceEvidence memory src, Ledger.Action[] memory a, bytes[] memory b)
        external
        returns (uint64 publication)
    {
        Ledger.Intent memory none;
        (publication,) = dest.importPublication(src, a, b, none, "");
    }
}

contract FalsifyTest is LabBase {
    bytes32 internal constant REALM2 = keccak256("lab/realm/2");

    Ledger internal dest;
    IndexModule internal destIndex;
    LensReader internal destLens;

    function setUp() public override {
        super.setUp();
        dest = new Ledger(registry, REALM2);
        destIndex = new IndexModule(address(dest));
        dest.setIndexModule(address(destIndex));
        destLens = new LensReader(dest, destIndex);
    }

    function publications(Ledger l) internal view returns (uint64 n) {
        (,,, n) = l.counts();
    }

    function bodies1(bytes memory body) internal pure returns (bytes[] memory b) {
        b = new bytes[](1);
        b[0] = body;
    }

    /// A grade-0 packet: every field is a bare claim (nothing is verifiable when v == 0).
    function claimedPacket(address author, bytes32 claimedPrincipal) internal view returns (Ledger.SourceEvidence memory src) {
        src.realmId = REALM;
        src.coreCodeCommitment = address(ledger).codehash;
        src.author = author;
        src.sourcePrincipal = claimedPrincipal;
        src.nonce = 0;
        src.deadline = uint64(block.timestamp + 3600);
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

    // ------------------------------------------------------------------------ F1 (R1)

    /// F1a. eoaB presents a v == 0 packet claiming eoaA's principal with its own destination
    /// signature: refused before any write; eoaA can still mint its own subject afterwards.
    function test_F1a_grade0_import_is_unsupported_and_mints_nothing() public {
        bytes32 salt = bytes32(uint256(41));
        bytes32 victimSubject = Keys.subject(Keys.principal(eoaA), salt);
        bytes32 r1 = rid(QUOTE, q(3000));
        Ledger.Action[] memory a = new Ledger.Action[](3);
        a[0] = aCreate(salt);
        a[1] = aPublish(QUOTE, q(3000));
        a[2] = aBind(HEAD, victimSubject, NO_ROLE, r1, 0);
        bytes[] memory b = new bytes[](3);
        b[1] = q(3000);
        Ledger.SourceEvidence memory src = claimedPacket(eoaB, Keys.principal(eoaA));
        (Ledger.Intent memory dst, bytes memory dstSig) = signed(PK_B, dest, 0, a);
        try dest.importPublication(src, a, b, dst, dstSig) {
            require(false, "x");
        } catch (bytes memory err) {
            expectSel(err, Ledger.E_SOURCE_UNSUPPORTED.selector, "F1a: unverified native-source claim is refused (Ledger.sol importPublication else-branch)");
        }
        require(dest.subjectCreatedAt(victimSubject) == 0 && publications(dest) == 0 && dest.nonces(eoaB) == 0, "F1a: nothing minted, retained or consumed");
        (uint8 st,,,,) = destLens.resolve(lensOf(eoaB), HEAD, victimSubject, NO_ROLE);
        require(st == 0, "F1a: no head");
        require(dest.sourceEvidence(1).author == address(0), "F1a: no evidence row");
        // the genuine holder mints its subject normally
        (Ledger.Intent memory own, bytes memory ownSig) = signed(PK_A, dest, 0, one(aCreate(salt)));
        dest.executeSigned(own, one(aCreate(salt)), new bytes[](1), ownSig);
        require(dest.subjectCreatedAt(victimSubject) == 1, "F1a: eoaA's subject is minted by eoaA, not squatted");
    }

    /// F1b. An unrelated contract claims the producer contract's origin-qualified source
    /// principal through the msg.sender path: refused before any write.
    function test_F1b_grade0_import_by_contract_is_unsupported_and_mints_nothing() public {
        Importer mallory = new Importer();
        bytes32 salt = bytes32(uint256(42));
        bytes32 aliceSourcePrincipal = ledger.principalOf(address(alice));
        bytes32 victimSubject = Keys.subject(aliceSourcePrincipal, salt);
        bytes32 r1 = rid(QUOTE, q(3000));
        Ledger.Action[] memory a = new Ledger.Action[](3);
        a[0] = aCreate(salt);
        a[1] = aPublish(QUOTE, q(3000));
        a[2] = aBind(HEAD, victimSubject, NO_ROLE, r1, 0);
        bytes[] memory b = new bytes[](3);
        b[1] = q(3000);
        Ledger.SourceEvidence memory src = claimedPacket(address(mallory), aliceSourcePrincipal);
        try mallory.run(dest, src, a, b) {
            require(false, "x");
        } catch (bytes memory err) {
            expectSel(err, Ledger.E_SOURCE_UNSUPPORTED.selector, "F1b: unverified native-source claim is refused");
        }
        require(dest.subjectCreatedAt(victimSubject) == 0, "F1b: the claimed source subject is not minted");
        require(dest.subjectCreatedAt(Keys.subject(dest.principalOf(address(mallory)), salt)) == 0, "F1b: nor a destination-derived one");
        require(publications(dest) == 0 && dest.nonces(address(mallory)) == 0, "F1b: nothing retained or consumed");
    }

    // ------------------------------------------------------------------------ F2 (negative, unchanged)

    /// F2. The EOA-signed import path: a source signature over another domain/realm never
    /// authorizes destination effects, and a signed packet cannot claim another principal.
    /// The KNOWN replay-domain gap (name/version-only EIP-712 domain; PROFILE.md "FUTURE
    /// replay-domain repair") is out of this scope and not asserted here.
    function test_F2_signed_source_packet_authorizes_nothing_at_the_destination() public {
        bytes32 salt = bytes32(uint256(43));
        bytes32 subj = subjectOf(eoaA, 43);
        bytes32 r1 = rid(QUOTE, q(3000));
        Ledger.Action[] memory a = new Ledger.Action[](3);
        a[0] = aCreate(salt);
        a[1] = aPublish(QUOTE, q(3000));
        a[2] = aBind(HEAD, subj, NO_ROLE, r1, 0);
        bytes[] memory b = new bytes[](3);
        b[1] = q(3000);
        (Ledger.Intent memory intent, bytes memory sig) = signed(PK_A, ledger, 0, a);
        (uint64 srcPub,) = ledger.executeSigned(intent, a, b, sig);
        Ledger.SourceEvidence memory src = sourceOf(ledger, srcPub);
        Ledger.Intent memory none;
        Ledger.SourceEvidence memory claimB = sourceOf(ledger, srcPub);
        claimB.sourcePrincipal = Keys.principal(eoaB);
        (Ledger.Intent memory dst, bytes memory dstSig) = signed(PK_A, dest, 0, a);
        try dest.importPublication(claimB, a, b, dst, dstSig) {
            require(false, "x");
        } catch (bytes memory err) {
            expectSel(err, Ledger.E_SOURCE_SIGNATURE.selector, "F2a: signed packet cannot claim another principal");
        }
        Ledger.SourceEvidence memory relabelled = sourceOf(ledger, srcPub);
        relabelled.realmId = REALM2;
        try dest.importPublication(relabelled, a, b, dst, dstSig) {
            require(false, "x");
        } catch (bytes memory err) {
            expectSel(err, Ledger.E_SOURCE_SIGNATURE.selector, "F2b: a source signature is bound to its claimed domain");
        }
        try dest.importPublication(src, a, b, none, "") {
            require(false, "x");
        } catch (bytes memory err) {
            expectSel(err, Ledger.E_DESTINATION_AUTH.selector, "F2c: no destination authorization, no effect");
        }
        try dest.executeSigned(intent, a, b, sig) {
            require(false, "x");
        } catch (bytes memory err) {
            expectSel(err, Ledger.E_INTENT.selector, "F2d: source intent is bound to the source Realm");
        }
        require(dest.subjectCreatedAt(subj) == 0 && publications(dest) == 0 && dest.nonces(eoaA) == 0, "F2: nothing was written");
        (uint64 dstPub,) = dest.importPublication(src, a, b, dst, dstSig);
        require(dest.sourceEvidence(dstPub).grade == 1 && dest.subjectCreatedAt(subj) != 0, "F2e: verified EOA source, id preserved");
    }

    // ------------------------------------------------------------------------ F3 (R2 identity)

    /// F3. Exact Type identity: the id is derived from (shape, refTypes, declared rule); a changed
    /// descriptor is a NEW id and QUOTE is untouched; the same descriptor cannot be registered
    /// twice; a record admitted under QUOTE stays a well-formed QUOTE; the id is reconstructible
    /// and the same on a second registry (Realm).
    function test_F3_type_identity_is_exact_and_immutable() public {
        (bool reg0, address man0, bytes32 ch0, address pol0, bytes32 pch0, uint8 rc0, uint16 act0) = registry.typeInfo(QUOTE);
        require(reg0 && man0 == address(quoteRule) && ch0 == address(quoteRule).codehash && pol0 == address(acceptor) && pch0 == address(acceptor).codehash && rc0 == 0 && act0 == 2, "QUOTE as registered: mandatory rule + mock policy row 2");
        (bytes32 shape0, bytes32 rule0, address dman0, uint8 drc0, uint16 dact0,) = registry.descriptor(QUOTE);
        require(shape0 == QUOTE_SHAPE && rule0 == ch0 && dman0 == address(quoteRule) && drc0 == 0 && dact0 == 2, "descriptor retained");
        bytes32 r1 = alice.publish(QUOTE, q(3000)); // admission 1 under activation 1
        Ledger.Action[] memory same = one(aPublish(QUOTE, q(4000)));
        (Ledger.Intent memory intent, bytes memory sig) = signed(PK_A, ledger, 0, same); // signed at this epoch
        // ---- a changed descriptor under the same shape: a different Type, QUOTE untouched
        QuoteAcceptor other = new QuoteAcceptor();
        bytes32[] memory oneItem = new bytes32[](1);
        oneItem[0] = ITEM;
        bytes32 changed = registry.register(QUOTE_SHAPE, address(other), oneItem);
        require(changed != QUOTE && changed == Keys.typeId(QUOTE_SHAPE, oneItem, address(other).codehash), "F3: changed rule/refs = new exact id, reconstructible");
        (, address man1, bytes32 ch1, address pol1,, uint8 rc1, uint16 act1) = registry.typeInfo(QUOTE);
        require(man1 == man0 && ch1 == ch0 && pol1 == pol0 && rc1 == rc0 && act1 == act0 && registry.refTypes(QUOTE).length == 0, "F3: QUOTE's identity, mandatory rule and policy unchanged");
        (bytes32 tt,, uint32 occ,) = ledger.record(r1);
        require(tt == QUOTE && occ == 1, "the record still says QUOTE");
        (, uint64 reuseOrd) = bob.execute(one(aReuse(QUOTE, r1)), new bytes[](1)); // still a well-formed QUOTE
        (bytes32 bt, uint16 bact, address bman, bytes32 bch, address bpol,,,) = ledger.acceptanceBasis(reuseOrd);
        require(bt == QUOTE && bact == 2 && bman == address(quoteRule) && bch == ch0 && bpol == address(acceptor), "F3: re-admission under the unchanged mandatory rule and policy row 2");
        // the earlier signature is stale (the epoch moved: E.B.4) but nothing about QUOTE changed
        try ledger.executeSigned(intent, same, bodies1(q(4000)), sig) {
            require(false, "x");
        } catch (bytes memory err) {
            expectSel(err, Ledger.E_INTENT.selector, "F3: receipt-bound epoch; old signature stale");
        }
        (,,, address rec, bool ok) = recon.reconstruct(ledger, 1);
        require(ok && rec == address(0), "F3: the old admission's evidence still reconstructs (native)");
        // ---- the same descriptor twice is refused; a different ref list is yet another id
        bytes32[] memory none;
        try registry.register(QUOTE_SHAPE, address(quoteRule), none) {
            require(false, "x");
        } catch (bytes memory err) {
            expectSel(err, TypeRegistry.E_TYPE_EXISTS.selector, "F3: identical descriptor is refused, never re-registered");
        }
        bytes32 refsOnly = registry.register(QUOTE_SHAPE, address(quoteRule), oneItem);
        require(refsOnly != QUOTE && refsOnly != changed, "F3: refs are part of identity");
        // ---- a second registry (another Realm) derives the same id from the same descriptor
        TypeRegistry reg2 = new TypeRegistry();
        require(reg2.register(QUOTE_SHAPE, address(quoteRule), none) == QUOTE, "F3: same descriptor, same id on another Realm");
        StrictQuoteAcceptor v2 = new StrictQuoteAcceptor();
        require(reg2.register(QUOTE_SHAPE, address(v2), none) != QUOTE, "F3: another declared rule is another Type");
        require(registry.typeIdOf(QUOTE_SHAPE, address(quoteRule), none) == QUOTE, "F3: typeIdOf agrees");
        require(registry.typeIdOf(QUOTE_SHAPE, address(acceptor), none) != QUOTE, "F3: the mock policy is NOT part of QUOTE's identity");
    }

    // ------------------------------------------------------------------------ F4 (R2 policy)

    /// F4. Policy activation is separate from identity: activating fixture rule v2 for QUOTE
    /// leaves the descriptor and id untouched, appends a policy row, changes future acceptance
    /// (dedup/reuse included) and every earlier admission keeps its recorded basis.
    function test_F4_policy_activation_is_separate_from_identity_and_basis_is_recorded() public {
        (, address manV1, bytes32 chV1, address polV1,,,) = registry.typeInfo(QUOTE);
        require(manV1 == address(quoteRule) && polV1 == address(acceptor), "baseline: mandatory rule + mock policy row 2");
        uint64 epochV1 = registry.epoch();
        bytes32 rHigh = alice.publish(QUOTE, q(3_000_000_000)); // admission 1, above the v2 cap, admitted under policy row 2 (mock, accept-all)
        StrictQuoteAcceptor v2 = new StrictQuoteAcceptor();
        require(registry.activate(QUOTE, address(v2)) == 3, "F4: policy row 3");
        (, address manNow, bytes32 chNow, address polNow, bytes32 pchNow, uint8 rcNow, uint16 actNow) = registry.typeInfo(QUOTE);
        require(manNow == address(quoteRule) && chNow == chV1 && polNow == address(v2) && pchNow == address(v2).codehash && rcNow == 0 && actNow == 3, "F4: v2 is the active ADDITIONAL policy; the mandatory rule is untouched");
        (bytes32 shape, bytes32 ruleId, address dman,, uint16 activations,) = registry.descriptor(QUOTE);
        require(shape == QUOTE_SHAPE && ruleId == chV1 && dman == address(quoteRule) && activations == 3, "F4: identity untouched, history appended");
        require(registry.epoch() == epochV1 + 1, "F4: epoch moved");
        (bytes32 tt,, uint32 occ,) = ledger.record(rHigh);
        require(tt == QUOTE && occ == 1, "F4: the row-2-era record is retained");
        try bob.execute(one(aReuse(QUOTE, rHigh)), new bytes[](1)) {
            require(false, "x");
        } catch (bytes memory err) {
            expectSel(err, Ledger.E_POLICY_REJECTED.selector, "F4: re-admission runs today's policy on top of the mandatory rule");
        }
        try alice.publish(QUOTE, q(3_000_000_001)) {
            require(false, "x");
        } catch (bytes memory err) {
            expectSel(err, Ledger.E_POLICY_REJECTED.selector, "F4: new publish runs today's policy");
        }
        (bytes32 bt, uint16 bact, address bman, bytes32 bch, address bpol, bytes32 bpch, uint64 bep,) = ledger.acceptanceBasis(1);
        (,, uint64 epochRow2,) = registry.activation(QUOTE, 2);
        require(bt == QUOTE && bact == 2 && bman == address(quoteRule) && bch == chV1 && bpol == address(acceptor) && bpch == address(acceptor).codehash && bep == epochRow2 && bep <= epochV1, "F4: admission 1 reports policy row 2 (mock), not today's row");
        bytes32 rLow = alice.publish(QUOTE, q(2_000_000_000)); // admission 2 under v2
        (, uint16 bact2, address bman2,, address bpol2, bytes32 bpch2, uint64 bep2,) = ledger.acceptanceBasis(2);
        require(bact2 == 3 && bman2 == address(quoteRule) && bpol2 == address(v2) && bpch2 == pchNow && bep2 == epochV1 + 1 && rLow != rHigh, "F4: admission 2 reports policy row 3 (v2) with the same mandatory rule");
        (address a1, bytes32 c1,,) = registry.activation(QUOTE, 1);
        (address a2, bytes32 c2,,) = registry.activation(QUOTE, 2);
        (address a3, bytes32 c3,,) = registry.activation(QUOTE, 3);
        require(a1 == address(0) && c1 == bytes32(0) && a2 == address(acceptor) && c2 == address(acceptor).codehash && a3 == address(v2) && c3 == pchNow, "F4: rows 1..3 readable (append-only): none, mock, v2");
        try registry.activation(QUOTE, 4) {
            require(false, "x");
        } catch (bytes memory err) {
            expectSel(err, TypeRegistry.E_ACTIVATION.selector, "F4: no silent absence for a missing row");
        }
        alice.create(bytes32(uint256(9))); // admission 3: not a publish/reuse
        try ledger.acceptanceBasis(3) {
            require(false, "x");
        } catch (bytes memory err) {
            expectSel(err, Ledger.E_NO_BASIS.selector, "F4: no basis for a non-admission row, loudly");
        }
    }

    // ------------------------------------------------------------------------ R3

    /// A signature made under epoch N is rejected after activation N+1 (receipt-bound rule
    /// activation) while the old admission's evidence still reconstructs; a fresh signature under
    /// N+1 is admitted with the new basis.
    function test_R3_signature_under_epoch_N_rejected_after_activation_old_evidence_reconstructs() public {
        Ledger.Action[] memory a0 = one(aPublish(QUOTE, q(7)));
        (Ledger.Intent memory i0, bytes memory s0) = signed(PK_A, ledger, 0, a0);
        (uint64 pub0,) = ledger.executeSigned(i0, a0, bodies1(q(7)), s0); // epoch N, activation 1
        Ledger.Action[] memory a1 = one(aPublish(QUOTE, q(100)));
        (Ledger.Intent memory i1, bytes memory s1) = signed(PK_A, ledger, 1, a1); // signed at epoch N, unsent
        StrictQuoteAcceptor v2 = new StrictQuoteAcceptor();
        registry.activate(QUOTE, address(v2)); // epoch N+1, policy row 3 (row 2 is the setUp mock)
        uint64 before = admissions();
        try ledger.executeSigned(i1, a1, bodies1(q(100)), s1) {
            require(false, "x");
        } catch (bytes memory err) {
            expectSel(err, Ledger.E_INTENT.selector, "R3: stale profile (epoch/codehash) rejected before any write");
        }
        require(admissions() == before && ledger.nonces(eoaA) == 1, "R3: no effect");
        (,, bytes32 digest, address rec, bool ok) = recon.reconstruct(ledger, pub0);
        require(ok && rec == eoaA && digest == ledger.intentDigest(i0, keccak256(abi.encode(a0))), "R3: the epoch-N admission's evidence still reconstructs from its stored profile");
        (, uint16 bact,,,,,,) = ledger.acceptanceBasis(1);
        require(bact == 2, "R3: and keeps basis row 2");
        (Ledger.Intent memory i2, bytes memory s2) = signed(PK_A, ledger, 1, a1); // re-signed under N+1
        require(i2.acceptanceProfile != i1.acceptanceProfile, "R3: the profile changed with the activation");
        (, uint64 first2) = ledger.executeSigned(i2, a1, bodies1(q(100)), s2);
        (, uint16 bact2, address bman2,, address bpol2,,,) = ledger.acceptanceBasis(first2);
        require(bact2 == 3 && bman2 == address(quoteRule) && bpol2 == address(v2), "R3: admitted under the new basis (mandatory rule + policy row 3)");
    }

    /// Import of an EOA-signed packet re-runs destination acceptance under the DESTINATION's
    /// current policy (its own registry, same exact Type id) and retains the source basis.
    function test_R3_import_reruns_destination_policy_and_retains_source_basis() public {
        TypeRegistry reg2 = new TypeRegistry();
        bytes32[] memory none;
        require(reg2.register(QUOTE_SHAPE, address(quoteRule), none) == QUOTE, "same descriptor => same exact id at the destination");
        Ledger dest2 = new Ledger(reg2, REALM2); // no index module: obligations 0 on both sides is irrelevant, each signs its own
        StrictQuoteAcceptor v2 = new StrictQuoteAcceptor();
        require(reg2.activate(QUOTE, address(v2)) == 2, "destination policy v2 (row 2); the source keeps the mock policy (row 2)");
        // source publication A (v1 admits 3e9)
        bytes32 subjA = subjectOf(eoaA, 51);
        bytes32 rA = rid(QUOTE, q(3_000_000_000));
        Ledger.Action[] memory a = new Ledger.Action[](3);
        a[0] = aCreate(bytes32(uint256(51)));
        a[1] = aPublish(QUOTE, q(3_000_000_000));
        a[2] = aBind(HEAD, subjA, NO_ROLE, rA, 0);
        bytes[] memory b = new bytes[](3);
        b[1] = q(3_000_000_000);
        (Ledger.Intent memory ia, bytes memory sa) = signed(PK_A, ledger, 0, a);
        (uint64 srcA, uint64 srcAFirst) = ledger.executeSigned(ia, a, b, sa);
        (Ledger.Intent memory da, bytes memory dsa) = signed(PK_A, dest2, 0, a);
        try dest2.importPublication(sourceOf(ledger, srcA), a, b, da, dsa) {
            require(false, "x");
        } catch (bytes memory err) {
            expectSel(err, Ledger.E_POLICY_REJECTED.selector, "R3: the destination's ADDITIONAL policy v2 rejects what the source admitted (the mandatory rule accepts on both)");
        }
        require(dest2.subjectCreatedAt(subjA) == 0 && publications(dest2) == 0 && dest2.nonces(eoaA) == 0, "R3: rejected import writes nothing");
        // source publication B (compliant): imports, destination basis 2, source basis 1 retained
        bytes32 subjB = subjectOf(eoaA, 52);
        bytes32 rB = rid(QUOTE, q(2_000_000_000));
        Ledger.Action[] memory a2 = new Ledger.Action[](3);
        a2[0] = aCreate(bytes32(uint256(52)));
        a2[1] = aPublish(QUOTE, q(2_000_000_000));
        a2[2] = aBind(HEAD, subjB, NO_ROLE, rB, 0);
        bytes[] memory b2 = new bytes[](3);
        b2[1] = q(2_000_000_000);
        (Ledger.Intent memory ib, bytes memory sb) = signed(PK_A, ledger, 1, a2);
        (uint64 srcB, uint64 srcBFirst) = ledger.executeSigned(ib, a2, b2, sb);
        (Ledger.Intent memory db, bytes memory dsb) = signed(PK_A, dest2, 0, a2);
        (uint64 dstB, uint64 dstBFirst) = dest2.importPublication(sourceOf(ledger, srcB), a2, b2, db, dsb);
        Ledger.SourceEvidence memory kept = dest2.sourceEvidence(dstB);
        (,,,,,,,,,, bytes32 srcProfile,,) = ledger.evidence(srcB);
        (,,,,,,,,,, bytes32 dstProfile,,) = dest2.evidence(dstB);
        require(kept.grade == 1 && kept.realmId == REALM && kept.acceptanceProfile == srcProfile && srcProfile == ib.acceptanceProfile, "R3: source basis retained verbatim");
        require(dstProfile == db.acceptanceProfile && dstProfile != srcProfile, "R3: destination admission under its own profile");
        (bytes32 st, uint16 sact, address sman,, address spol,,,) = ledger.acceptanceBasis(srcBFirst + 1);
        (bytes32 dt, uint16 dact, address dman,, address dpol,,,) = dest2.acceptanceBasis(dstBFirst + 1);
        require(st == QUOTE && sact == 2 && sman == address(quoteRule) && spol == address(acceptor), "R3: source admission basis: mandatory rule + policy row 2 (mock)");
        require(dt == QUOTE && dact == 2 && dman == address(quoteRule) && dpol == address(v2), "R3: destination admission basis: the same mandatory rule + policy row 2 (v2)");
        require(dest2.subjectCreatedAt(subjB) != 0 && dest2.subjectCreatedAt(subjB) == dstBFirst, "R3: id(F) preserved at the destination");
        (,,, address rec, bool ok) = recon.reconstruct(dest2, dstB);
        require(ok && rec == eoaA, "R3: destination authorization reconstructs");
        (bytes32 sd, address srec, uint8 grade,) = recon.reconstructSource(dest2, dstB);
        require(srec == eoaA && grade == 1 && sd == ledger.intentDigest(ib, keccak256(abi.encode(a2))), "R3: source digest reconstructs at the destination");
        require(srcAFirst == 1 && srcA == 1, "fixture ordinals");
    }

    // ------------------------------------------------------------------------ F5 (repaired)

    bytes32 internal constant STRICT_SHAPE = keccak256("lab/type/quote-strict/1");

    function expectRejected(bytes32 typeId, bytes memory body, bytes4 expected, string memory label) internal {
        uint64 before = admissions();
        try alice.publish(typeId, body) {
            require(false, label);
        } catch (bytes memory err) {
            expectSel(err, expected, label);
        }
        require(admissions() == before, "nothing admitted");
    }

    /// F5a/b. The declared rule is the Type's MANDATORY predicate: it runs on every publish/reuse
    /// and its refusal (E_REJECTED) is final. activate(T, address(0)) means "no additional
    /// policy" and a permissive policy adds nothing — the rejected body stays rejected, and the
    /// basis records the mandatory rule AND the policy row.
    function _f5(address policy, string memory label) internal {
        StrictQuoteAcceptor strict = new StrictQuoteAcceptor();
        bytes32[] memory none;
        bytes32 strictType = registry.register(STRICT_SHAPE, address(strict), none);
        bytes memory high = q(3_000_000_000); // above the declared cap
        expectRejected(strictType, high, Ledger.E_REJECTED.selector, string.concat(label, ": declared rule rejects before any activation"));
        require(registry.activate(strictType, policy) == 2, "policy row 2 installed");
        expectRejected(strictType, high, Ledger.E_REJECTED.selector, string.concat("F5 ", label, ": the mandatory rule still rejects after the activation"));
        (, address man, bytes32 ruleId, address pol,,, uint16 act) = registry.typeInfo(strictType);
        require(man == address(strict) && ruleId == address(strict).codehash && pol == policy && act == 2, "mandatory rule pinned; policy row 2 = the activation");
        bytes32 low = alice.publish(strictType, q(1)); // a compliant body: both accept
        (bytes32 bt, uint16 bact, address bman, bytes32 bch, address bpol,,,) = ledger.acceptanceBasis(1);
        require(bt == strictType && bact == 2 && bman == address(strict) && bch == ruleId && bpol == policy && low == rid(strictType, q(1)), "basis records the mandatory rule AND the policy row");
    }

    function test_F5a_activate_zero_keeps_the_mandatory_rule() public {
        _f5(address(0), "activate(T, address(0))");
    }

    function test_F5b_permissive_policy_keeps_the_mandatory_rule() public {
        _f5(address(new PermissiveAcceptor()), "permissive policy acceptor");
    }

    /// F5c. Policy can ADD a constraint (a strict activation rejects what the mandatory rule
    /// alone accepted) but cannot remove one; profile/epoch behaviour is unchanged otherwise
    /// (one epoch per activation, an unsent signature goes stale, evidence reconstructs).
    function test_F5c_policy_adds_constraints_but_cannot_remove_them() public {
        // QUOTE: mandatory MinBodyAcceptor(32) + the accept-all mock as policy row 2
        bytes memory high = q(3_000_000_000);
        bytes32 rHigh = alice.publish(QUOTE, high); // admission 1: both accept
        Ledger.Action[] memory a1 = one(aPublish(QUOTE, q(5)));
        (Ledger.Intent memory i1, bytes memory s1) = signed(PK_A, ledger, 0, a1); // signed under epoch N
        uint64 e0 = registry.epoch();
        StrictQuoteAcceptor v2 = new StrictQuoteAcceptor();
        require(registry.activate(QUOTE, address(v2)) == 3, "row 3: the strict policy ADDS the cap");
        require(registry.epoch() == e0 + 1, "F5c: one epoch per activation");
        expectRejected(QUOTE, high, Ledger.E_POLICY_REJECTED.selector, "F5c: the added constraint rejects what the mandatory rule alone accepted");
        try bob.execute(one(aReuse(QUOTE, rHigh)), new bytes[](1)) {
            require(false, "x");
        } catch (bytes memory err) {
            expectSel(err, Ledger.E_POLICY_REJECTED.selector, "F5c: reuse re-runs mandatory + policy");
        }
        expectRejected(QUOTE, hex"00", Ledger.E_REJECTED.selector, "F5c: the mandatory rule (>= 32 bytes) still applies underneath, first");
        try ledger.executeSigned(i1, a1, bodies1(q(5)), s1) {
            require(false, "x");
        } catch (bytes memory err) {
            expectSel(err, Ledger.E_INTENT.selector, "F5c: the epoch-N signature is stale after the activation");
        }
        require(registry.activate(QUOTE, address(0)) == 4, "row 4: no additional policy");
        expectRejected(QUOTE, hex"00", Ledger.E_REJECTED.selector, "F5c: activate(0) never means no validation");
        require(alice.publish(QUOTE, high) == rHigh, "F5c: with no additional policy the mandatory rule alone decides (dedup, occurrence 2)");
        (, uint16 bact,,, address bpol,,,) = ledger.acceptanceBasis(1);
        require(bact == 2 && bpol == address(acceptor), "F5c: the first admission keeps policy row 2");
        (,,, address rec, bool ok) = recon.reconstruct(ledger, 1);
        require(ok && rec == address(0), "F5c: its evidence still reconstructs");
    }

    /// F5d. The documented LIMIT (demonstrated, not repaired; no mechanism invented): a codehash
    /// pins CODE, not behaviour. A Type registered with the MUTABLE mock as its mandatory rule
    /// keeps its id and passes E_ACCEPTOR_CODE while `set(1, 0)` flips the rule from accept-all
    /// to reject-all. The registry cannot detect this and no self-declared flag would prove
    /// statelessness, so the fixtures never use the mock as a mandatory rule (lab convention:
    /// mandatory rules are stateless/immutable-configured) and REPAIR.md/TODO state the limit.
    function test_F5d_mutable_mandatory_acceptor_is_a_documented_gap_not_detected() public {
        MockAcceptor mutableRule = new MockAcceptor(); // mode 0, minBody 0: accept-all
        bytes32[] memory none;
        bytes32 mutableType = registry.register(keccak256("lab/type/mutable-mandatory/1"), address(mutableRule), none);
        bytes32 codeBefore = address(mutableRule).codehash;
        bytes32 r = alice.publish(mutableType, q(1)); // admitted under the accept-all behaviour
        mutableRule.set(1, 0); // behaviour flips; code does not
        require(address(mutableRule).codehash == codeBefore, "gap: unchanged codehash");
        (,, bytes32 ruleId,,,,) = registry.typeInfo(mutableType);
        require(ruleId == codeBefore, "gap: the Type still commits to the same rule id");
        expectRejected(mutableType, q(1), Ledger.E_REJECTED.selector, "gap: the SAME body is now refused under the SAME Type id and E_ACCEPTOR_CODE did not fire");
        (bytes32 tt,,,) = ledger.record(r);
        require(tt == mutableType, "the earlier admission stands");
        // the lab convention keeps this out of the fixtures: every mandatory fixture rule is stateless or immutable-configured
        require(quoteRule.minBody() == 32 && pairRule.minBody() == 96, "QUOTE/PAIR mandatory rules are immutable-configured");
        require(address(quoteRule).codehash != address(new MinBodyAcceptor(33)).codehash, "an immutable threshold is part of the code identity");
    }
}
