// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;
import {StateStore} from "C0Core/StateStore.sol";
import {StateAuditPages} from "C0Core/StateAuditPages.sol";
import {IndexKeys} from "C0Core/IndexKeys.sol";
import {FixtureInputs} from "./FixtureInputs.sol";
import {FixtureDeployment} from "./FixtureDeployment.sol";
import {UpgradeableReadFixtureCore} from "../src/UpgradeableReadFixtureCore.sol";
import {PointReadLibrary} from "C0Core/PointReadLibrary.sol";
import {UpgradeQueryReadLibrary} from "../src/UpgradeQueryReadLibrary.sol";

interface ReadVm {
    function record() external;
    function accesses(address) external returns (bytes32[] memory, bytes32[] memory);
    function roll(uint256) external;
    function etch(address, bytes calldata) external;
}

// Seeded algorithm fixture, never normal deployment/performance evidence.
contract AuditBasisFixture {
    StateStore.Store internal s;

    constructor() {
        s.init.realmId = bytes32(uint256(1));
        s.init.initialRevisionId = bytes32(uint256(2));
        s.init.metaTypeId = bytes32(uint256(4));
        s.typeIds[1] = s.init.metaTypeId;
        s.types[s.init.metaTypeId].typeOrdinal = 1;
        s.count.types = 1;
        s.count.admissions = 2;
        bytes32 key = IndexKeys.posting(0, 10, 0, 0);
        s.postings[key].head = uint256(2) | uint256(2) << 64 | uint256(2) << 128 | uint256(1) << 176;
        s.postingWords[key][0] = uint256(1) | uint256(2) << 48;
    }

    function oldPage(uint256 cursor) external view returns (StateAuditPages.PageResult memory) {
        return StateAuditPages.pagePostings(s, 0, 10, 0, 0, StateAuditPages.PageRequest(cursor, 1, 2));
    }

    function explicitPage(bytes32 basis, uint256 cursor) external view returns (StateAuditPages.PageResult memory) {
        return StateAuditPages.pagePostingsAtReadBasis(s, 0, 10, 0, 0, StateAuditPages.PageRequest(cursor, 1, 2), basis);
    }
}

contract UpgradeStaticConsumer {
    function read(address host, bytes calldata data) external view returns (bytes memory result, uint256 work) {
        uint256 beforeGas = gasleft();
        (bool ok, bytes memory out) = host.staticcall(data);
        work = beforeGas - gasleft();
        if (!ok) assembly ("memory-safe") { revert(add(out, 32), mload(out)) }
        return (out, work);
    }
}

contract UpgradeReadsTest {
    // Break: replacing the returned basis after creating/decoding a cursor.
    function testExplicitBasisBindsCursorBeforeEncodeAndDecode() public {
        AuditBasisFixture h = new AuditBasisFixture();
        StateAuditPages.PageResult memory old = h.oldPage(0);
        StateAuditPages.PageResult memory same = h.explicitPage(bytes32(uint256(2)), 0);
        require(keccak256(abi.encode(old)) == keccak256(abi.encode(same)), "old behavior retained");
        StateAuditPages.PageResult memory fresh = h.explicitPage(bytes32(uint256(3)), 0);
        require(fresh.cursor != old.cursor && fresh.items[0] == bytes32(uint256(1)), "new token");
        (bool ok,) = address(h).staticcall(abi.encodeCall(h.explicitPage, (bytes32(uint256(3)), old.cursor)));
        require(!ok, "cross-context refused");
        require(h.oldPage(old.cursor).items[0] == bytes32(uint256(2)), "old continuation");
        require(h.explicitPage(bytes32(uint256(3)), fresh.cursor).items[0] == bytes32(uint256(2)), "new continuation");
        (ok,) = address(h).staticcall(abi.encodeCall(h.explicitPage, (bytes32(0), 0)));
        require(!ok, "zero explicit basis refused");
    }
}

contract UpgradeReadGuardsTest is FixtureInputs {
    ReadVm constant rv = ReadVm(address(vm));
    UpgradeableReadFixtureCore host;

    function deploy(string memory name, bytes memory args) private returns (address out) {
        bytes memory code = bytes.concat(vm.getCode(name), args);
        require(code.length <= 49152, "initcode cap");
        assembly ("memory-safe") { out := create(0, add(code, 32), mload(code)) }
        require(out != address(0) && out.code.length <= 24576, "normal deployment");
    }

    function setUp() public {
        loadInputs();
        FixtureDeployment factory = new FixtureDeployment();
        address helper = deploy("PreparationHelper.sol:PreparationHelper", "");
        address implementation = deploy(
            "UpgradeableReadFixtureCore.sol:UpgradeableReadFixtureCore",
            abi.encode(
                address(factory), helper, address(PointReadLibrary).codehash, address(UpgradeQueryReadLibrary).codehash
            )
        );
        address carrier =
            deploy("UpgradeableFixtureCarrier.sol:UpgradeableFixtureCarrier", abi.encode(address(factory), helper));
        factory.deployPair(implementation, carrier, address(1), treeType, init);
        host = UpgradeableReadFixtureCore(factory.core());
    }

    function testGuardedReadsAndStaticConsumerHaveZeroStorageWrites() public {
        UpgradeStaticConsumer consumer = new UpgradeStaticConsumer();
        rv.record();
        host.fixtureReadContext();
        host.getRecord(bytes32(0));
        host.getBindingHead(bytes32(0));
        consumer.read(address(host), abi.encodeCall(host.fixtureReadContext, ()));
        (, bytes32[] memory writes) = rv.accesses(address(host));
        require(writes.length == 0, "read storage writes");
    }

    function testCurrentDependencyGuardsPrecedeMalformedRequests() public {
        rv.etch(address(PointReadLibrary), hex"60006000fd");
        (bool ok, bytes memory err) = address(host).staticcall(abi.encodeCall(host.validatePlan, (bytes32(0))));
        require(
            !ok
                && keccak256(err)
                    == keccak256(
                        abi.encodeWithSelector(UpgradeableReadFixtureCore.ReadCodeMismatch.selector, uint8(1))
                    ),
            "point before Plan error"
        );
        host.deriveBindingKey(bytes32(0), bytes32(0));
    }

    function testBlockNumberIsCheckedBeforeNarrowing() public {
        rv.roll(uint256(type(uint64).max) + 1);
        (bool ok,) = address(host).staticcall(abi.encodeCall(host.fixtureReadContext, ()));
        require(!ok, "block narrowing");
    }

    function testConstructorRejectsWrongIndependentReadHashes() public {
        bytes memory code = bytes.concat(
            vm.getCode("UpgradeableReadFixtureCore.sol:UpgradeableReadFixtureCore"),
            abi.encode(
                host.bootstrapAuthority(),
                host.preparationHelper(),
                bytes32(uint256(1)),
                address(UpgradeQueryReadLibrary).codehash
            )
        );
        address out;
        assembly ("memory-safe") { out := create(0, add(code, 32), mload(code)) }
        require(out == address(0), "wrong Point constructor hash");
        code = bytes.concat(
            vm.getCode("UpgradeableReadFixtureCore.sol:UpgradeableReadFixtureCore"),
            abi.encode(
                host.bootstrapAuthority(),
                host.preparationHelper(),
                address(PointReadLibrary).codehash,
                bytes32(uint256(1))
            )
        );
        assembly ("memory-safe") { out := create(0, add(code, 32), mload(code)) }
        require(out == address(0), "wrong Query constructor hash");
    }
}
