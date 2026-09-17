// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import {Ledger} from "./Ledger.sol";
import {LensReader} from "./LensReader.sol";
import {IAcceptor, IIndexModule} from "./Interfaces.sol";

/// DISPOSABLE LAB, NO PROTOCOL CLAIM. Harness contracts shared by the Solidity tests and the
/// node measurement script: a toggleable acceptor, an always-refusing index module, a genuine
/// contract author, a paid consumer, and a state-only reconstructor of signed publications.

/// Acceptance rule with failure modes. mode 0 = accept when body >= minBody; 1 = return
/// false; 2 = revert; 3 = burn all bounded gas (proves the STATICCALL bound rejects it).
/// MUTABLE TEST DOUBLE (authority repair F5 addendum): `mode`/`minBody` change its behaviour with
/// an UNCHANGED runtime codehash, so pinning its codehash pins nothing about what it accepts. It
/// is therefore never a Type's MANDATORY rule in the fixtures; it is installed only as an
/// ADDITIONAL Realm policy acceptor through TypeRegistry.activate (its refusal is
/// E_POLICY_REJECTED). Mandatory fixture rules are stateless or immutable-configured
/// (LabAcceptors.sol: QuoteAcceptor, LabelAcceptor, MinBodyAcceptor).
contract MockAcceptor is IAcceptor {
    uint8 public mode;
    uint256 public minBody;

    function set(uint8 mode_, uint256 minBody_) external {
        mode = mode_;
        minBody = minBody_;
    }

    function accept(bytes32, bytes calldata data, bytes32[] calldata) external view returns (bool) {
        if (mode == 1) return false;
        if (mode == 2) revert("acceptor refused");
        if (mode == 3) {
            bytes32 acc;
            for (uint256 i;; ++i) {
                acc = keccak256(abi.encode(acc, i));
            }
        }
        return data.length >= minBody;
    }
}

/// A mandatory index that refuses everything: every publication routed through it must roll back.
contract FailingIndexModule is IIndexModule {
    function fieldProfile() external pure returns(address){return address(0);}
    function manifestHash() external pure returns(bytes32){return keccak256("lab/failing-required-index/1");}
    function afterPublication(uint64, Effect[] calldata) external pure returns(bytes4) { revert("final index refused"); }
    function onAdmission(uint64, Effect[] calldata) external pure {
        revert("index refused");
    }
}

/// A genuine contract author: it originates publications itself (msg.sender = this contract).
/// No EOA signature exists or is fabricated for it; its portability proof is a chain-state witness.
contract Actor {
    Ledger public immutable ledger;

    constructor(Ledger ledger_) {
        ledger = ledger_;
    }

    function publish(bytes32 typeId, bytes calldata data) external returns (bytes32) {
        return ledger.publish(typeId, data);
    }

    function create(bytes32 salt) external returns (bytes32) {
        return ledger.create(salt);
    }

    function bind(bytes32 purpose, bytes32 subject, bytes32 role, bytes32 target, uint32 expectedRevision) external returns (uint64) {
        return ledger.bind(purpose, subject, role, target, expectedRevision);
    }

    function unbind(bytes32 purpose, bytes32 subject, bytes32 role, uint32 expectedRevision) external returns (uint64) {
        return ledger.unbind(purpose, subject, role, expectedRevision);
    }

    /// Batch under this contract's next nonce.
    function execute(Ledger.Action[] calldata actions, bytes[] calldata bodies) external returns (uint64, uint64) {
        return ledger.execute(actions, bodies, ledger.nonces(address(this)));
    }

    /// Batch under an explicit nonce (exact-retry experiments).
    function executeWithNonce(Ledger.Action[] calldata actions, bytes[] calldata bodies, uint64 nonce)
        external
        returns (uint64, uint64)
    {
        return ledger.execute(actions, bodies, nonce);
    }
}

/// An unrelated consuming contract: paid reads through public interfaces only. Each call is a
/// transaction that stores what it read, so receipt gas is the paid-read budget (not eth_call).
contract Consumer {
    LensReader public immutable lens;
    uint8 public lastStatus;
    bytes32 public lastTarget;
    uint32 public lastRevision;
    uint64 public lastAdmission;
    uint64 public lastCount;
    uint64 public lastScanned;
    uint256 public lastValue;

    constructor(LensReader lens_) {
        lens = lens_;
    }

    /// Resolve a quote head and decode its 32-byte uint256 body.
    function readQuote(address[] calldata lensPrincipals, bytes32 purpose, bytes32 subject, bytes32 role) external {
        (uint8 status, bytes32 target, uint32 revision,, uint64 admission) = lens.resolve(lensPrincipals, purpose, subject, role);
        require(status == 1, "consumer: not selected");
        bytes memory data = lens.body(target);
        require(data.length == 32, "consumer: shape");
        lastValue = abi.decode(data, (uint256));
        lastStatus = status;
        lastTarget = target;
        lastRevision = revision;
        lastAdmission = admission;
    }

    /// Resolve any head without decoding (subject placements, tags).
    function readHead(address[] calldata lensPrincipals, bytes32 purpose, bytes32 subject, bytes32 role) external {
        (uint8 status, bytes32 target, uint32 revision,, uint64 admission) = lens.resolve(lensPrincipals, purpose, subject, role);
        lastStatus = status;
        lastTarget = target;
        lastRevision = revision;
        lastAdmission = admission;
    }

    /// One budgeted folder page from a fresh cursor.
    function readList(address[] calldata lensPrincipals, bytes32 purpose, bytes32 subject, uint256 budget) external {
        LensReader.Cursor memory fresh;
        LensReader.Page memory page = lens.list(lensPrincipals, purpose, subject, fresh, budget);
        lastStatus = page.status;
        lastCount = page.selectedSoFar;
        lastScanned = page.scanned;
    }

    function readHistory(address author, bytes32 position, uint64 asOf) external {
        (uint8 status, bool live, bytes32 target, uint32 revision, uint64 admission) = lens.history(author, position, asOf);
        require(status == 2, "consumer: no history");
        lastStatus = live ? 1 : 0;
        lastTarget = target;
        lastRevision = revision;
        lastAdmission = admission;
    }
}

/// CANDIDATE SELF-CHECK, not the independent oracle: it calls the candidate's own intentDigest
/// and Action ABI (oracle-boundary forbids that for the oracle; independent vectors pending).
/// Rebuilds a publication's Action tuples from Admission rows
/// firstAdmission..+leafCount using public getters only, recomputes actionsHash and the
/// PublicationIntent digest, and (for signed ingress) ecrecovers the author from the
/// retained (r, s, v). No calldata, logs or original client involved.
contract Reconstructor {
    error E_FORMAT_UNSUPPORTED();
    /// The publication's Action tuples, rebuilt from its Admission rows in order.
    function actionsOf(Ledger ledger, uint64 publication) public view returns (Ledger.Action[] memory actions) {
        (,,, uint16 leafCount, uint64 first,,,,,,,,) = ledger.evidence(publication);
        actions = new Ledger.Action[](leafCount);
        for (uint256 i; i < leafCount; ++i) {
            actions[i] = rebuild(ledger, first + uint64(i));
        }
    }

    /// Source-domain check of an imported publication (pre-seal check 3): recompute the SOURCE
    /// digest from the retained SourceEvidence and the rebuilt actions, recover the source signer.
    function reconstructSource(Ledger ledger, uint64 publication)
        external
        view
        returns (bytes32 digest, address recovered, uint8 grade, bytes32 sourceRealm)
    {
        if (ledger.publicationContext(publication).intentFormat != 1) revert E_FORMAT_UNSUPPORTED();
        Ledger.SourceEvidence memory src = ledger.sourceEvidence(publication);
        Ledger.Intent memory si = Ledger.Intent(
            src.realmId, src.coreCodeCommitment, src.author, src.nonce, src.deadline, src.acceptanceProfile, src.indexObligations
        );
        digest = ledger.intentDigest(si, keccak256(abi.encode(actionsOf(ledger, publication))));
        if (src.v != 0) recovered = ecrecover(digest, src.v, src.r, src.s);
        grade = src.grade;
        sourceRealm = src.realmId;
    }

    function reconstruct(Ledger ledger, uint64 publication)
        external
        view
        returns (Ledger.Action[] memory actions, bytes32 actionsHash, bytes32 digest, address recovered, bool matches)
    {
        if (ledger.publicationContext(publication).intentFormat != 1) revert E_FORMAT_UNSUPPORTED();
        (
            address author,
            uint8 proofKind,
            uint8 v,
            ,
            ,
            bytes32 r,
            bytes32 s,
            uint64 nonce,
            uint64 deadline,
            ,
            bytes32 profile,
            bytes32 obligations,
            bytes32 storedHash
        ) = ledger.evidence(publication);
        actions = actionsOf(ledger, publication);
        actionsHash = keccak256(abi.encode(actions));
        Ledger.Intent memory intent =
            Ledger.Intent(ledger.realmId(), ledger.coreCodeCommitment(), author, nonce, deadline, profile, obligations);
        digest = ledger.intentDigest(intent, actionsHash);
        if (proofKind == 2) {
            recovered = ecrecover(digest, v, r, s);
            matches = actionsHash == storedHash && recovered == author && recovered != address(0);
        } else {
            // native ingress: no signature to recover; the closure is the chain-state witness
            matches = actionsHash == storedHash;
        }
    }

    function rebuild(Ledger ledger, uint64 ordinal) public view returns (Ledger.Action memory x) {
        (uint8 kind,,, uint64 bindingOrdinal, uint32 expectedRevision,, bytes32 a, bytes32 b) = ledger.admission(ordinal);
        x.kind = kind;
        if (kind == 1) {
            x.typeId = b;
            x.bodyHashOrRecordId = a;
        } else if (kind == 2) {
            x.bodyHashOrRecordId = a;
            (x.typeId,,,) = ledger.record(a);
        } else if (kind == 3 || kind == 4 || kind == 7) {
            (x.purpose, x.subject, x.role) = ledger.positionCell(ledger.bindingPosition(bindingOrdinal));
            x.expectedRevision = expectedRevision;
            if (kind == 3) x.target = a;
        } else if (kind == 5) {
            x.salt = a;
        } else if (kind == 6) {
            x.target = a;
        }
    }
}
