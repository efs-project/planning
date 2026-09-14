// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

// DISPOSABLE characterization; see the retained run report for execution evidence.
// Current surprising acceptance is expected; this neither repairs Core nor proves data loss.
import {LabBase} from "./LabBase.sol";
import {Ledger} from "../src/Ledger.sol";
import {IndexModule} from "../src/IndexModule.sol";
import {Keys} from "../src/Keys.sol";

contract IndexConfigNonAdmin {
    function tryRedeclare(IndexModule index, bytes32 family) external returns (bool, bytes memory) {
        return address(index).call(abi.encodeCall(index.declareOptional, (family, uint64(2))));
    }
}

contract IndexConfigExpectationTest is LabBase {
    struct Counts { uint64 admissions; uint64 records; uint64 bindings; uint64 publications; }

    function readCounts() private view returns (Counts memory c) {
        (c.admissions, c.records, c.bindings, c.publications) = ledger.counts();
    }

    // A future refusal of mandatory redeclaration or binding its config into the signature
    // deliberately retires this characterization. Missing admission/posting effects fail it too.
    function test_admin_family_downgrade_does_not_invalidate_signed_publication() public {
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
        index.declareOptional(family, 2);
        require(ledger.indexObligations() == obligation && address(index).codehash == moduleCodehash, "same module obligation after downgrade");
        require(index.generation() == generation, "redeclaration does not bump generation");
        (status, from, through) = index.coverage(family, BINARY);
        require(status == index.PARTIAL() && from == 2 && through == before_.admissions, "downgraded coverage is partial from two");
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
        require(status == index.PARTIAL() && from == 2 && through == after_.admissions, "caught-up hook does not restore mandatory coverage");
        require(ledger.indexObligations() == obligation && index.generation() == generation, "coverage configuration never entered signed obligation");
    }
}
