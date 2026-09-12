// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {FixtureInputs} from "./FixtureInputs.sol";
import {FixtureDeployment} from "./FixtureDeployment.sol";
import {PreparationHelper} from "C0Core/PreparationHelper.sol";
import {PointReadLibrary} from "C0Core/PointReadLibrary.sol";
import {UpgradeQueryReadLibrary} from "../src/UpgradeQueryReadLibrary.sol";
import {UpgradeableFixtureCoreU3} from "Browser/AuthorityUpgrade.sol";
import {UpgradeableFixtureCore} from "../src/UpgradeableFixtureCore.sol";
import {UpgradeAdmissionLibrary} from "../src/UpgradeAdmissionLibrary.sol";
import {FixtureEndpoint, UpgradeStorage} from "../src/UpgradeStorage.sol";
import {StateKernel} from "C0Core/StateKernel.sol";
import {StateStore} from "C0Core/StateStore.sol";
import {Preparation} from "C0Core/Preparation.sol";
import {TransparentUpgradeableProxy} from "@openzeppelin/contracts/proxy/transparent/TransparentUpgradeableProxy.sol";

interface OutlineVm {
    function etch(address, bytes calldata) external;
    function getNonce(address) external view returns (uint64);
}

contract InitializationChild {}

contract InitializationFailingHelper {
    PreparationHelper immutable compiler = new PreparationHelper();

    function compileIntrinsic(bytes memory raw) external view returns (Preparation.CompiledType memory) {
        return compiler.compileIntrinsic(raw);
    }

    function deployCache(bytes memory) external returns (address) {
        new InitializationChild();
        revert("after helper CREATE");
    }
}

/// The reviewed control leaves only 40 runtime bytes for the actual browser Core.
/// This gate must fail if initialization is inlined again or outlining does not
/// recover real deployable headroom. No raised runtime/initcode limits.
contract InitializationOutlineTest is FixtureInputs {
    OutlineVm constant check = OutlineVm(address(vm));
    uint256 constant CONTROL_RUNTIME_LENGTH = 24536;
    event log_named_uint(string name, uint256 value);

    function setUp() public {
        loadInputs();
    }

    function deploy(string memory artifact, bytes memory args) private returns (address result) {
        bytes memory code = bytes.concat(vm.getCode(artifact), args);
        require(code.length <= 49152, "ordinary initcode cap");
        assembly ("memory-safe") { result := create(0, add(code, 32), mload(code)) }
        require(result != address(0) && result.code.length <= 24576, "ordinary deployed runtime cap");
    }

    function implementations(FixtureDeployment factory, address helper)
        private
        returns (address core, address carrier)
    {
        bytes memory args = abi.encode(address(factory), helper);
        core = deploy("UpgradeableFixtureCore.sol:UpgradeableFixtureCore", args);
        carrier = deploy("UpgradeableFixtureCarrier.sol:UpgradeableFixtureCarrier", args);
    }

    function child(address creator, uint8 nonce) private pure returns (address) {
        return address(uint160(uint256(keccak256(abi.encodePacked(hex"d694", creator, bytes1(nonce))))));
    }

    function assertFactoryRollback(FixtureDeployment factory, address helper, uint64 helperNonce) private view {
        require(factory.core() == address(0) && factory.carrier() == address(0), "factory proxy fields rollback");
        require(
            factory.coreAdmin() == address(0) && factory.carrierAdmin() == address(0), "factory admin fields rollback"
        );
        require(
            factory.currentRevision() == 0 && check.getNonce(address(factory)) == 1, "factory activation/nonce rollback"
        );
        require(check.getNonce(helper) == helperNonce, "helper nonce rollback");
        for (uint8 i = 1; i <= 2; ++i) {
            address proxy = child(address(factory), i);
            require(proxy.code.length == 0 && child(proxy, 1).code.length == 0, "proxy/admin code rollback");
            require(
                vm.load(proxy, UpgradeStorage.CONTROL_SLOT) == 0 && vm.load(proxy, UpgradeStorage.EFS_SLOT) == 0,
                "control/Store rollback"
            );
        }
        require(child(helper, uint8(helperNonce)).code.length == 0, "tentative helper child rollback");
    }

    function refusal(uint8 fault) private {
        FixtureDeployment factory = new FixtureDeployment();
        address helper = fault == 2 ? address(new PreparationHelper()) : address(new InitializationFailingHelper());
        (address core, address carrier) = implementations(factory, helper);
        uint64 nonce = check.getNonce(helper);
        // Changed code reverts with a distinct selector if entered; a STOP-only
        // body could defer failure to configuration and hide a missing guard.
        if (fault < 2) {
            check.etch(
                address(UpgradeAdmissionLibrary), fault == 0 ? bytes("") : bytes(hex"63deadbeef6000526004601cfd")
            );
        }
        if (fault == 2) init.realmId = 0;
        (bool ok, bytes memory reason) =
            address(factory).call(abi.encodeCall(factory.deployPair, (core, carrier, address(0x123), treeType, init)));
        bytes4 expected = fault < 2
            ? FixtureEndpoint.FixtureConfiguration.selector
            : fault == 2 ? StateKernel.InvalidInitialization.selector : Preparation.HelperDeploy.selector;
        require(
            !ok && keccak256(reason) == keccak256(abi.encodeWithSelector(expected)),
            "exact bootstrap failure precedence"
        );
        assertFactoryRollback(factory, helper, nonce);
    }

    function testMissingLibraryRefusesBeforeFailingHelper() public {
        refusal(0);
    }

    function testChangedLibraryRefusesBeforeFailingHelper() public {
        refusal(1);
    }

    function testMalformedInitRollsBackFactoryAndProxy() public {
        refusal(2);
    }

    function testHelperCreateFailureRollsBackBootstrapAndCode() public {
        refusal(3);
    }

    function testBootstrapCacheContextAndDirectLibraryRefusal() public {
        FixtureDeployment factory = new FixtureDeployment();
        PreparationHelper helper = new PreparationHelper();
        (address implementation, address carrier) = implementations(factory, address(helper));
        factory.deployPair(implementation, carrier, address(0x123), treeType, init);
        UpgradeableFixtureCore core = UpgradeableFixtureCore(factory.core());
        StateStore.Counts memory counts = core.counts();
        require(
            keccak256(abi.encode(counts)) == keccak256(abi.encode(StateStore.Counts(0, 0, 1, 0, 0, 0, 0, 0))),
            "only intrinsic Type visible"
        );
        StateStore.TypeRow memory row = core.typeRow(meta);
        Preparation.CompiledType memory compiled = helper.compileIntrinsic(init.intrinsicGroupBytes);
        require(
            compiled.typeId == meta && keccak256(row.cacheBytes) == keccak256(compiled.cacheBytes),
            "exact intrinsic cache"
        );
        require(
            row.typeOrdinal == 1 && row.admittedAtOrdinal == 0 && row.memberIndex == 0 && row.groupRecordId == 0,
            "intrinsic row identity"
        );
        require(
            check.getNonce(address(helper)) == 2 && check.getNonce(factory.core()) == 2,
            "helper creates cache; proxy creates only admin"
        );
        require(
            keccak256(child(address(helper), 1).code) == keccak256(bytes.concat(hex"00", compiled.cacheBytes)),
            "exact helper child code"
        );
        require(
            factory.core() == child(address(factory), 1) && factory.carrier() == child(address(factory), 2),
            "actual predicted proxies"
        );
        require(
            factory.coreAdmin() == child(factory.core(), 1) && factory.carrierAdmin() == child(factory.carrier(), 1),
            "actual predicted admins"
        );
        StateStore.Bootstrap memory boot = core.bootstrap();
        require(
            keccak256(abi.encode(boot))
                == keccak256(
                    abi.encode(
                        StateStore.Bootstrap(
                            init.realmId,
                            init.initialRevisionId,
                            init.intrinsicGroupBytes,
                            keccak256(init.objectGroup1Bytes),
                            keccak256(init.kernelGroup2Bytes),
                            meta,
                            0,
                            0,
                            0,
                            0
                        )
                    )
                ),
            "all bootstrap bytes"
        );
        UpgradeStorage.ExecutionSet memory e = factory.revisionAt(1);
        require(
            e.admissionLibrary == address(UpgradeAdmissionLibrary)
                && e.admissionCodehash == address(UpgradeAdmissionLibrary).codehash,
            "candidate library active from genesis"
        );
        require(
            e.id == UpgradeStorage.executionId(e) && core.configuration() == e.coreConfiguration,
            "exact execution configuration"
        );
        (bool ok,) = address(UpgradeAdmissionLibrary)
            .call(
                abi.encodeWithSelector(
                    UpgradeAdmissionLibrary.initialize.selector,
                    uint256(0),
                    init,
                    Preparation.Config(address(helper), address(helper).codehash)
                )
            );
        require(
            !ok && keccak256(abi.encode(core.bootstrap())) == keccak256(abi.encode(boot))
                && check.getNonce(address(helper)) == 2,
            "direct library call cannot mutate proxy"
        );
    }

    function testPostConstructionInitializerRefusesEvenFactoryCaller() public {
        FixtureDeployment factory = new FixtureDeployment();
        PreparationHelper helper = new PreparationHelper();
        (address implementation,) = implementations(factory, address(helper));
        // OZ requires nonempty constructor calldata. A harmless getter leaves
        // Core control uninitialized, so this is not the second-init case.
        TransparentUpgradeableProxy proxy =
            new TransparentUpgradeableProxy(implementation, address(factory), abi.encodeWithSignature("counts()"));
        vm.prank(address(factory));
        (bool ok, bytes memory reason) = address(proxy)
            .call(
                abi.encodeCall(
                    UpgradeableFixtureCore.initialize,
                    (address(factory), address(0x12), address(0x13), address(0x14), treeType, init)
                )
            );
        require(
            !ok
                && keccak256(reason)
                    == keccak256(abi.encodeWithSelector(FixtureEndpoint.FixtureInitialization.selector)),
            "constructor-only bootstrap"
        );
        require(check.getNonce(address(helper)) == 1, "no helper child on refused late initialization");
    }

    function unauthorizedProxyForTest(address implementation, address factory, bytes memory data) external {
        new TransparentUpgradeableProxy(implementation, factory, data);
    }

    function testUnauthorizedConstructorAndDirectImplementationRefuse() public {
        FixtureDeployment factory = new FixtureDeployment();
        PreparationHelper helper = new PreparationHelper();
        (address implementation,) = implementations(factory, address(helper));
        bytes memory data = abi.encodeCall(
            UpgradeableFixtureCore.initialize,
            (address(factory), address(0x12), address(0x13), address(0x14), treeType, init)
        );
        (bool ok, bytes memory reason) =
            address(this).call(abi.encodeCall(this.unauthorizedProxyForTest, (implementation, address(factory), data)));
        require(
            !ok
                && keccak256(reason)
                    == keccak256(abi.encodeWithSelector(FixtureEndpoint.FixtureInitialization.selector)),
            "unauthorized constructor caller"
        );
        vm.prank(address(factory));
        (ok, reason) = implementation.call(data);
        require(
            !ok
                && keccak256(reason)
                    == keccak256(abi.encodeWithSelector(FixtureEndpoint.FixtureInitialization.selector)),
            "direct implementation locked"
        );
        require(check.getNonce(address(helper)) == 1, "refused initialization never deploys cache");
    }

    function testActualU3DeploymentRecoversHeadroom() public {
        FixtureDeployment factory = new FixtureDeployment();
        PreparationHelper helper = new PreparationHelper();
        bytes memory code = bytes.concat(
            vm.getCode("AuthorityUpgrade.sol:UpgradeableFixtureCoreU3"),
            abi.encode(
                address(factory),
                address(helper),
                address(PointReadLibrary).codehash,
                address(UpgradeQueryReadLibrary).codehash
            )
        );
        require(code.length <= 49152, "ordinary initcode cap");
        address candidate;
        assembly ("memory-safe") {
            candidate := create(0, add(code, 32), mload(code))
        }
        require(candidate != address(0), "actual U3 deployment");
        require(candidate.code.length <= 24576, "ordinary runtime cap");
        emit log_named_uint("actual U3 runtime bytes", candidate.code.length);
        require(candidate.code.length < CONTROL_RUNTIME_LENGTH, "initialization outline must shrink actual U3");
    }
}
