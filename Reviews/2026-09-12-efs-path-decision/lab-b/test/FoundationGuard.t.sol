// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;
import {LabBase} from "./LabBase.sol";
import {Ledger} from "../src/Ledger.sol";
import {Keys} from "../src/Keys.sol";
import {FoundationABI as F} from "./FoundationABI.sol";
import {FailingIndexModule} from "../src/LabHarness.sol";

contract FoundationGuardTest is LabBase {
    // Breaks: guard stripping/reordering, source/destination drift, masks, revision-only
    // changes, malformed bounds, or a post-failure partial publication/index write.
    function testSelectedSourceAndDestinationGuardEveryIncludedHead() public {
        bytes32 file = alice.create(bytes32("source"));
        alice.bind(FOLDER, DRAFTS, name("from"), file, 0);
        F.ReadSetV2 memory rs = snapshot(2, 2);
        rs.principalIds[0] = pid(address(bob)); rs.principalIds[1] = pid(address(alice));
        rs.positions[0] = Keys.position(FOLDER, DRAFTS, name("from"));
        rs.positions[1] = Keys.position(FOLDER, DRAFTS, name("to"));
        fillHeads(rs);
        Ledger.Action[] memory a = two(aCreate(bytes32("would-write")), aBind(FOLDER, DRAFTS, name("to"), file, 0));
        F.IntentV2 memory i = intent(a, rs);
        bytes memory sig = signGuard(i, a);
        bob.bind(FOLDER, DRAFTS, name("to"), file, 0);
        rejected(i, a, rs, sig, bytes4(keccak256("E_READSET_STALE(uint256,uint256)")));
        bob.unbind(FOLDER, DRAFTS, name("to"), 1);
        rejected(i, a, rs, sig, bytes4(keccak256("E_READSET_STALE(uint256,uint256)")));
        require(ledger.subjectCreatedAt(Keys.subject(Keys.principal(eoaA), bytes32("would-write"))) == 0, "partial create");
    }

    function testSameTargetNewRevisionAndLowerIncludedAuthorAreStale() public {
        bytes32 file = alice.create(bytes32("revision"));
        alice.bind(HEAD, file, 0, file, 0);
        F.ReadSetV2 memory rs = snapshot(2, 1);
        rs.principalIds[0] = pid(address(alice)); rs.principalIds[1] = pid(address(bob));
        rs.positions[0] = Keys.position(HEAD, file, 0); fillHeads(rs);
        Ledger.Action[] memory a = one(aCreate(bytes32("new")));
        F.IntentV2 memory i = intent(a, rs); bytes memory sig = signGuard(i, a);
        bob.bind(HEAD, file, 0, file, 0);
        rejected(i, a, rs, sig, bytes4(keccak256("E_READSET_STALE(uint256,uint256)")));
        fillHeads(rs); i = intent(a, rs); sig = signGuard(i, a);
        alice.bind(HEAD, file, 0, file, 1);
        rejected(i, a, rs, sig, bytes4(keccak256("E_READSET_STALE(uint256,uint256)")));
    }

    function testReadSetMutationOmissionAndPrincipalOrderRejected() public {
        F.ReadSetV2 memory rs = snapshot(2, 2);
        Ledger.Action[] memory a = one(aCreate(bytes32("mutate")));
        F.IntentV2 memory i = intent(a, rs); bytes memory sig = signGuard(i, a);
        F.ReadSetV2 memory bad = abi.decode(abi.encode(rs), (F.ReadSetV2));
        (bad.principalIds[0], bad.principalIds[1]) = (bad.principalIds[1], bad.principalIds[0]);
        rejected(i, a, bad, sig, Ledger.E_INTENT.selector);
        rejected(i, a, empty(), sig, Ledger.E_INTENT.selector);
        bad = abi.decode(abi.encode(rs), (F.ReadSetV2)); bad.expectedHeads[0] = bytes32("fake");
        rejected(i, a, bad, sig, Ledger.E_INTENT.selector);
        // Matching unsigned hash metadata is not sufficient: the signature still binds the old guard.
        i.readSetHash = F(address(ledger)).readSetHash(empty());
        rejected(i, a, empty(), sig, Ledger.E_SIGNATURE.selector);
    }

    function testReadSetRejectsDuplicatesLengthsAndBounds() public {
        F.ReadSetV2 memory rs = snapshot(2, 2);
        rs.principalIds[1] = rs.principalIds[0]; invalidShape(rs);
        rs = snapshot(2, 2); rs.positions[1] = rs.positions[0]; invalidShape(rs);
        rs = snapshot(1, 1); rs.expectedHeads = new bytes32[](0); invalidShape(rs);
        rs = snapshot(65, 1); invalidShape(rs);
        rs = snapshot(1, 5); invalidShape(rs);
        rs = empty(); rs.principalIds = new bytes32[](1); rs.principalIds[0] = bytes32(uint256(1)); invalidShape(rs);
    }

    function testSamePublicationMultipleWritesCheckOnlyPreState() public {
        bytes32 file = alice.create(bytes32("multiple"));
        F.ReadSetV2 memory rs = snapshot(1, 1); rs.principalIds[0] = Keys.principal(eoaA);
        rs.positions[0] = Keys.position(HEAD, file, 0); fillHeads(rs);
        Ledger.Action[] memory a = two(aBind(HEAD, file, 0, file, 0), aUnbind(HEAD, file, 0, 1));
        F.IntentV2 memory i = intent(a, rs);
        (uint64 pub,) = F(address(ledger)).executeGuardedSigned(i, a, new bytes[](2), rs, signGuard(i, a));
        (uint8 state,uint32 rev,,,,) = ledger.head(Keys.binding(Keys.principal(eoaA), rs.positions[0]));
        require(state == 2 && rev == 2 && pub == 2, "ordered intra-publication CAS");
    }

    function testGuardedRequiredIndexFailureRollsBackReadSetAndAllEffects() public {
        ledger.setIndexModule(address(new FailingIndexModule()));
        F.ReadSetV2 memory rs = snapshot(1, 1);
        bytes memory body = hex"010203";
        Ledger.Action[] memory a = one(aPublish(BINARY, body));
        F.IntentV2 memory i = intent(a, rs);
        bytes[] memory bodies = new bytes[](1); bodies[0] = body;
        (bool ok, bytes memory err) = address(ledger).call(abi.encodeCall(F.executeGuardedSigned, (i,a,bodies,rs,signGuard(i,a))));
        require(!ok && sel(err) == Ledger.E_INDEX.selector, "required index rejection");
        require(admissions() == 0 && ledger.nonces(eoaA) == 0 && ledger.body(rid(BINARY, body)).length == 0, "record rollback");
        require(F(address(ledger)).readSetBytes(i.readSetHash).length == 0 && F(address(ledger)).publicationContext(1).principalId == 0, "guard evidence rollback");
    }

    function testGuardedBindingEpochAndIndexABAAreStale() public {
        bytes32 file = alice.create(bytes32("binding"));
        Ledger.Action[] memory a = one(aBind(FOLDER,DRAFTS,name("x"),file,0));
        F.ReadSetV2 memory rs = empty();
        F.IntentV2 memory i = intent(a,rs); bytes memory sig = signGuard(i,a);
        registry.setBindingRefType(TAG, bytes32("binding-policy"), BINARY);
        rejected(i,a,rs,sig,Ledger.E_INTENT.selector);
        i = intent(a,rs); sig = signGuard(i,a);
        ledger.setIndexModule(address(0)); ledger.setIndexModule(address(index));
        rejected(i,a,rs,sig,Ledger.E_INTENT.selector);
    }

    function testDifferentGuardsDoNotAliasAtSameNonce() public {
        Ledger.Action[] memory a = one(aCreate(bytes32("same-actions")));
        F.ReadSetV2 memory rs = snapshot(1,1); F.ReadSetV2 memory zero = empty();
        F.IntentV2 memory i = intent(a,rs); F.IntentV2 memory j = intent(a,zero);
        bytes memory sig = signGuard(i,a);
        (uint64 pub,) = F(address(ledger)).executeGuardedSigned(j,a,new bytes[](1),zero,signGuard(j,a));
        require(pub == 1, "first publication");
        rejected(i,a,rs,sig,Ledger.E_NONCE.selector);
    }

    function rejected(F.IntentV2 memory i, Ledger.Action[] memory a, F.ReadSetV2 memory rs, bytes memory sig, bytes4 errorSelector) internal {
        bytes32 beforeState = keccak256(abi.encode(ledger.extsload(bytes32(uint256(1))), ledger.nonces(eoaA), index.lastProcessed()));
        (bool ok, bytes memory err) = address(ledger).call(abi.encodeCall(F.executeGuardedSigned,(i,a,new bytes[](a.length),rs,sig)));
        require(!ok && sel(err) == errorSelector, "expected typed guarded refusal");
        require(beforeState == keccak256(abi.encode(ledger.extsload(bytes32(uint256(1))), ledger.nonces(eoaA), index.lastProcessed())), "guard partial effects");
    }
    function invalidShape(F.ReadSetV2 memory rs) internal view {
        (bool ok, bytes memory err) = address(ledger).staticcall(abi.encodeCall(F.readSetHash, (rs)));
        require(!ok && sel(err) == bytes4(keccak256("E_READSET_SHAPE()")), "shape accepted");
    }
    function snapshot(uint256 n, uint256 m) internal view returns (F.ReadSetV2 memory rs) {
        rs.principalIds = new bytes32[](n); rs.positions = new bytes32[](m); rs.expectedHeads = new bytes32[](n*m);
        for(uint256 x;x<n;++x) rs.principalIds[x] = bytes32(x+1);
        for(uint256 y;y<m;++y) rs.positions[y] = bytes32(y+100);
        fillHeads(rs);
    }
    function fillHeads(F.ReadSetV2 memory rs) internal view {
        for(uint256 x;x<rs.positions.length;++x) for(uint256 y;y<rs.principalIds.length;++y) {
            (uint8 state,uint32 rev,uint64 at,,,bytes32 target) = ledger.head(Keys.binding(rs.principalIds[y],rs.positions[x]));
            rs.expectedHeads[x*rs.principalIds.length+y] = keccak256(abi.encode(keccak256("efs.lab.head-snapshot/2"),state,rev,at,target));
        }
    }
    function testRetainsNativePrincipalWithoutAccountReclassification() public {
        alice.create(bytes32("file"));
        (bool ok, bytes memory data) = address(ledger).staticcall(abi.encodeCall(F.publicationContext, (uint64(1))));
        require(ok && data.length != 0, "publication context missing");
        F.PublicationContext memory c = abi.decode(data, (F.PublicationContext));
        require(c.principalId == pid(address(alice)) && c.principalKind == 2, "retained native principal");
        require(c.authorizationProfile == 1 && c.executionSet != 0 && c.intentDigest != 0, "native call context");
    }

    function testGuardedSignatureRetainsFullReadSetAndCannotBeStripped() public {
        // Explicit empty guards are valid. Even this signature is a distinct format.
        F.ReadSetV2 memory rs = empty();
        Ledger.Action[] memory a = one(aCreate(bytes32("guarded")));
        (bool hasExecution, bytes memory data) = address(ledger).staticcall(abi.encodeCall(F.executionSet, ()));
        require(hasExecution && data.length == 32, "execution set missing");
        F.IntentV2 memory i = intent(a, rs);
        bytes memory sig = signGuard(i, a);
        (uint64 pub,) = F(address(ledger)).executeGuardedSigned(i, a, new bytes[](1), rs, sig);
        F.PublicationContext memory c = F(address(ledger)).publicationContext(pub);
        require(c.principalId == Keys.principal(eoaA) && c.principalKind == 1 && c.intentFormat == 2, "guarded key context");
        require(c.readSetHash == i.readSetHash && keccak256(F(address(ledger)).readSetBytes(c.readSetHash)) == keccak256(abi.encode(rs)), "complete state readset");
        (bool reconstructed,) = address(recon).staticcall(abi.encodeCall(recon.reconstruct,(ledger,pub)));
        require(!reconstructed,"legacy reconstructor interpreted guarded evidence");
        Ledger.Intent memory legacy = Ledger.Intent(REALM, address(ledger).codehash, eoaA, 1, i.deadline, i.acceptanceProfile, i.indexObligations);
        (bool ok, bytes memory err) = address(ledger).call(abi.encodeCall(ledger.executeSigned, (legacy, a, new bytes[](1), sig)));
        require(!ok, "guarded signature stripped");
        expectSel(err, Ledger.E_SIGNATURE.selector, "separate signing domain");
    }

    function empty() internal pure returns (F.ReadSetV2 memory rs) {
        rs.principalIds = new bytes32[](0); rs.positions = new bytes32[](0); rs.expectedHeads = new bytes32[](0);
    }
    function intent(Ledger.Action[] memory a, F.ReadSetV2 memory rs) internal view returns (F.IntentV2 memory i) {
        i = F.IntentV2(REALM, ledger.realmOrigin(), F(address(ledger)).executionSet(), eoaA, ledger.nonces(eoaA),
            uint64(block.timestamp + 3600), ledger.acceptanceProfileOf(a), ledger.indexObligations(), F(address(ledger)).readSetHash(rs));
    }
    function signGuard(F.IntentV2 memory i, Ledger.Action[] memory a) internal view returns (bytes memory) {
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(PK_A, F(address(ledger)).guardedIntentDigest(i, keccak256(abi.encode(a))));
        return abi.encodePacked(r, s, v);
    }
}
