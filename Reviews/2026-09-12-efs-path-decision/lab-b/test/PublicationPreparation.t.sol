// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;
import {LabBase} from "./LabBase.sol";
import {Ledger} from "../src/Ledger.sol";
import {ITypeRegistry} from "../src/Interfaces.sol";
import {IndexModule} from "../src/IndexModule.sol";
import {Keys} from "../src/Keys.sol";
import {UpgradeProxy} from "./UpgradeProxy.sol";

interface PreparationVm {
    function mockCall(address target, bytes calldata input, bytes calldata output) external;
    function mockCallRevert(address target, bytes calldata input, bytes calldata output) external;
    function clearMockedCalls() external;
    function etch(address target, bytes calldata code) external;
}

/// Test-only exposure of the real fixed dependency, with real Ledger canonical
/// getters. STATICCALLing this probe proves preparation cannot write any state.
contract PreparationProbe is Ledger {
    constructor(ITypeRegistry r, bytes32 realm) Ledger(r, realm) {}

    function probe(uint64 nonce, bytes memory actions) external returns (bytes memory output) {
        (address support,) = this.publicationSupportIdentity();
        bool ok;
        (ok, output) = support.delegatecall(abi.encodeWithSignature("prepareNative(uint64,bytes)", nonce, actions));
        require(ok, "native preparation missing or not static");
    }
}

contract PublicationPreparationTest is LabBase {
    PreparationVm private constant pvm = PreparationVm(address(uint160(uint256(keccak256("hevm cheat code")))));
    bytes4 private constant NATIVE = bytes4(keccak256("prepareNative(uint64,bytes)"));

    // Missing extraction fails this before any implementation. The output is
    // independently decoded as seventeen words, never a production Pub codec.
    function test_native_preparation_is_static_544_bytes_and_uses_actual_caller() public {
        PreparationProbe probe = new PreparationProbe(registry, REALM);
        IndexModule requiredIndex = new IndexModule(address(probe));
        probe.setIndexModule(address(requiredIndex));
        Ledger.Action[] memory actions = one(aCreate(bytes32("prepared-only")));
        (bool ok, bytes memory result) =
            address(probe).staticcall(abi.encodeCall(probe.probe, (uint64(42), abi.encode(actions))));
        require(ok, "preparation must be static with canonical Ledger reads");
        bytes memory output = abi.decode(result, (bytes));
        require(output.length == 544, "only seventeen static preparation fields");
        uint256[17] memory words = abi.decode(output, (uint256[17]));
        bytes32 principal = Keys.contractPrincipal(probe.realmOrigin(), address(this));
        require(
            words[0] == uint160(address(this)) && words[1] == uint256(principal) && words[2] == uint256(principal),
            "caller context lost"
        );
        require(
            words[3] == 0 && words[4] == 1 && words[5] == 0 && words[6] == 42 && words[7] == 0, "native flags and nonce"
        );
        require(
            words[8] == 0 && words[9] == 0 && words[10] == uint256(probe.acceptanceProfileOf(actions))
                && words[11] == uint256(probe.indexObligations())
                && words[12] == uint256(keccak256(abi.encode(actions))),
            "prepared commitments"
        );
        require(
            words[13] == 0 && words[14] == 0 && words[15] == 0 && words[16] == 0,
            "legacy final context remains Ledger-owned"
        );
        (uint64 a,,, uint64 publications) = probe.counts();
        require(a == 0 && publications == 0 && probe.nonces(address(this)) == 0, "preparation wrote canonical state");
    }

    // A missing fixed-output gate lets these mocked transport faults through.
    // Only the helper transport is replaced; all Ledger mutation/rollback is real.
    function test_native_preparation_rejects_wrong_return_sizes_before_any_write() public {
        (address support,) = ledger.publicationSupportIdentity();
        uint256[4] memory sizes = [uint256(0), 543, 545, 8192];
        for (uint256 i; i < sizes.length; ++i) {
            pvm.mockCall(support, abi.encodePacked(NATIVE), new bytes(sizes[i]));
            _nativeRefused(Ledger.E_INDEX.selector);
            pvm.clearMockedCalls();
        }
    }

    function test_changed_helper_code_is_refused_before_preparation() public {
        (address support,) = ledger.publicationSupportIdentity();
        pvm.etch(support, hex"00");
        _nativeRefused(Ledger.E_INDEX.selector);
    }

    function test_preparation_preserves_bounded_errors_and_refuses_oversized_error_copy() public {
        (address support,) = ledger.publicationSupportIdentity();
        pvm.mockCallRevert(support, abi.encodePacked(NATIVE), abi.encodeWithSelector(Ledger.E_SIGNATURE.selector));
        _nativeRefused(Ledger.E_SIGNATURE.selector);
        pvm.clearMockedCalls();
        pvm.mockCallRevert(support, abi.encodePacked(NATIVE), new bytes(4165));
        _nativeRefused(Ledger.E_INDEX.selector);
        pvm.clearMockedCalls();
    }

    function test_admission_action_bound_is_early_but_public_profile_getter_stays_available() public {
        Ledger.Action[] memory actions = new Ledger.Action[](65);
        for (uint256 n; n < 65; ++n) {
            actions[n] = aCreate(bytes32(n + 1));
        }
        Ledger.Intent memory intent = Ledger.Intent(
            REALM,
            address(ledger).codehash,
            eoaA,
            0,
            uint64(block.timestamp + 100),
            ledger.acceptanceProfileOf(actions),
            ledger.indexObligations()
        );
        require(intent.acceptanceProfile != 0, "oversized-candidate profile getter removed");
        (bool ok, bytes memory error) =
            address(ledger).call(abi.encodeCall(ledger.executeSigned, (intent, actions, new bytes[](65), bytes(""))));
        require(
            !ok && keccak256(error) == keccak256(abi.encodeWithSelector(Ledger.E_BOUNDS.selector, uint256(0))),
            "bad signature precedes resource bound"
        );
        intent.realmId = bytes32("wrong-realm");
        (ok, error) =
            address(ledger).call(abi.encodeCall(ledger.executeSigned, (intent, actions, new bytes[](65), bytes(""))));
        require(
            !ok && keccak256(error) == keccak256(abi.encodeWithSelector(Ledger.E_INTENT.selector, uint256(1))),
            "realm check reordered"
        );
        require(admissions() == 0 && ledger.nonces(eoaA) == 0, "early bound changed state");
    }

    function test_guard_hash_mismatch_precedes_stale_head_and_bad_signature() public {
        Ledger.ReadSetV2 memory rs;
        rs.principalIds = new bytes32[](1);
        rs.principalIds[0] = Keys.principal(eoaA);
        rs.positions = new bytes32[](1);
        rs.positions[0] = Keys.position(HEAD, bytes32("absent"), 0);
        rs.expectedHeads = new bytes32[](1);
        rs.expectedHeads[0] = ledger.headSnapshot(rs.principalIds[0], rs.positions[0]);
        Ledger.Action[] memory actions = one(aCreate(bytes32("never")));
        Ledger.IntentV2 memory intent = Ledger.IntentV2(
            REALM,
            ledger.realmOrigin(),
            ledger.executionSet(),
            eoaA,
            0,
            uint64(block.timestamp + 100),
            ledger.acceptanceProfileOf(actions),
            ledger.indexObligations(),
            ledger.readSetHash(rs)
        );
        rs.expectedHeads[0] = bytes32("stale-and-wrong-hash");
        (bool ok, bytes memory error) = address(ledger)
            .call(abi.encodeCall(ledger.executeGuardedSigned, (intent, actions, new bytes[](1), rs, bytes(""))));
        require(
            !ok && keccak256(error) == keccak256(abi.encodeWithSelector(Ledger.E_INTENT.selector, uint256(5))),
            "hash-before-head precedence changed"
        );
        intent.readSetHash = ledger.readSetHash(rs);
        (ok, error) = address(ledger)
            .call(abi.encodeCall(ledger.executeGuardedSigned, (intent, actions, new bytes[](1), rs, bytes(""))));
        require(
            !ok
                && keccak256(error)
                    == keccak256(abi.encodeWithSelector(Ledger.E_READSET_STALE.selector, uint256(0), uint256(0))),
            "stale coordinates changed"
        );
        require(
            admissions() == 0 && ledger.nonces(eoaA) == 0 && ledger.readSetBytes(intent.readSetHash).length == 0,
            "guard refusal leaked state"
        );
    }

    function test_unused_preparation_ceiling_is_not_an_outer_gas_reserve() public {
        (bool ok,) = address(ledger).call{gas: 2_000_000}(
            abi.encodeCall(ledger.execute, (one(aCreate(bytes32("bounded"))), new bytes[](1), uint64(0)))
        );
        require(ok && ledger.nonces(address(this)) == 1, "unused twelve-million allowance demanded");
    }

    function test_maximum_guard_preimage_survives_preparation_and_deduplicates() public {
        Ledger.ReadSetV2 memory rs;
        rs.principalIds = new bytes32[](64);
        rs.positions = new bytes32[](4);
        rs.expectedHeads = new bytes32[](256);
        for (uint256 i; i < 64; ++i) {
            rs.principalIds[i] = bytes32(i + 1);
        }
        for (uint256 i; i < 4; ++i) {
            rs.positions[i] = bytes32(i + 100);
        }
        bytes32 absentHead =
            keccak256(abi.encode(keccak256("efs.lab.head-snapshot/2"), uint8(0), uint32(0), uint64(0), bytes32(0)));
        for (uint256 i; i < 256; ++i) {
            rs.expectedHeads[i] = absentHead;
        }
        bytes memory preimage = abi.encode(rs);
        bytes32 expectedHash = keccak256(abi.encode(keccak256("efs.lab.read-set/2:ordered-first-binding"), rs));
        require(preimage.length == 10_592, "maximum preimage fixture");
        for (uint64 nonce; nonce < 2; ++nonce) {
            (bool ok,) = address(ledger).call{gas: 15_000_000}(
                abi.encodeCall(
                    ledger.executeGuarded,
                    (one(aCreate(bytes32(uint256(nonce + 1)))), new bytes[](1), nonce, ledger.executionSet(), rs)
                )
            );
            require(ok, "maximum guard with small mutation refused");
            require(
                ledger.publicationContext(nonce + 1).readSetHash == expectedHash
                    && keccak256(ledger.readSetBytes(expectedHash)) == keccak256(preimage),
                "full guard preimage changed"
            );
        }
        require(admissions() == 2 && ledger.nonces(address(this)) == 2, "repeat guard publication lost");
    }

    function test_guarded_proxy_uses_proxy_heads_not_relayer_and_preserves_exact_preimage() public {
        UpgradeProxy proxy = new UpgradeProxy(ledger);
        Ledger core = Ledger(address(proxy));
        core.setIndexModule(address(new IndexModule(address(core))));
        bytes32 file = core.create(bytes32("proxy-file"));
        core.bind(HEAD, file, 0, file, 0);
        Ledger.ReadSetV2 memory rs;
        rs.principalIds = new bytes32[](1);
        rs.principalIds[0] = core.principalOf(address(this));
        rs.positions = new bytes32[](1);
        rs.positions[0] = Keys.position(HEAD, file, 0);
        rs.expectedHeads = new bytes32[](1);
        rs.expectedHeads[0] = core.headSnapshot(rs.principalIds[0], rs.positions[0]);
        Ledger.Action[] memory actions = one(aCreate(bytes32("signed-proxy")));
        Ledger.IntentV2 memory intent = Ledger.IntentV2(
            REALM,
            core.realmOrigin(),
            core.executionSet(),
            eoaA,
            0,
            uint64(block.timestamp + 100),
            core.acceptanceProfileOf(actions),
            core.indexObligations(),
            core.readSetHash(rs)
        );
        (uint8 v, bytes32 r, bytes32 s) =
            vm.sign(PK_A, core.guardedIntentDigest(intent, keccak256(abi.encode(actions))));
        (uint64 publication,) =
            core.executeGuardedSigned(intent, actions, new bytes[](1), rs, abi.encodePacked(r, s, v));
        require(
            core.nonces(eoaA) == 1 && core.nonces(address(this)) == 2 && ledger.nonces(eoaA) == 0,
            "relayer or implementation acquired authority"
        );
        require(core.publicationContext(publication).principalId == Keys.principal(eoaA), "signed principal changed");
        require(keccak256(core.readSetBytes(intent.readSetHash)) == keccak256(abi.encode(rs)), "guard preimage changed");
        (bool ok, bytes memory error) = address(core)
            .call(
                abi.encodeCall(
                    core.executeGuardedSigned, (intent, actions, new bytes[](1), rs, abi.encodePacked(r, s, v))
                )
            );
        require(
            !ok && keccak256(error) == keccak256(abi.encodeWithSelector(Ledger.AlreadyAdmitted.selector, publication)),
            "exact retry changed"
        );
        require(core.nonces(eoaA) == 1 && core.nonces(address(this)) == 2, "retry changed nonce");
    }

    function _nativeRefused(bytes4 expected) private {
        (bool ok, bytes memory error) = address(ledger)
            .call(abi.encodeCall(ledger.execute, (one(aCreate(bytes32("no-write"))), new bytes[](1), uint64(0))));
        require(!ok && sel(error) == expected, "preparation transport fault admitted");
        require(
            admissions() == 0 && ledger.nonces(address(this)) == 0 && index.lastProcessed() == 0
                && ledger.publicationContext(1).principalId == 0,
            "preparation failure leaked state"
        );
    }
}
