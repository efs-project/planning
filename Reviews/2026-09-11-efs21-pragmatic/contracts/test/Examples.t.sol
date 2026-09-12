// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;
import {TestBase} from "./TestBase.sol";
import {LegacyNativeKernel as NativeKernel} from "./fixtures/legacy4cb/LegacyNativeKernel.sol";
import {LegacyUint256Validator as Uint256Validator, LegacyExactTypeRegistry as ExactTypeRegistry} from "./fixtures/legacy4cb/LegacyExactTypeRegistry.sol";
import {LegacyNavigationIndex as NavigationIndex} from "./fixtures/legacy4cb/LegacyNavigationIndex.sol";
import {LegacyQuoteProducer as QuoteProducer, LegacyQuoteReader as QuoteReader, LegacyPlainQuoteMapping as PlainQuoteMapping} from "./fixtures/legacy4cb/LegacyExamples.sol";
import {RegistryHarness} from "./Types.t.sol";

contract CallbackValidator {
    NativeKernel immutable target;
    bytes32 immutable typeId;

    constructor(NativeKernel kernel, bytes32 exactType) {
        target = kernel;
        typeId = exactType;
    }

    function validate(bytes calldata) external returns (bool) {
        (bool ok,) = address(target).call(abi.encodeCall(NativeKernel.storeRecord, (typeId, abi.encode(uint256(123)))));
        return ok;
    }
}

contract ExamplesTest is TestBase {
    NativeKernel k;
    bytes32 quoteType;
    QuoteProducer producer;
    QuoteReader reader;

    function setUp() public {
        k = new NativeKernel();
        quoteType = k.types().register(bytes("EFS21 quote: ABI uint256"), address(new Uint256Validator()));
        producer = new QuoteProducer(k, quoteType);
        reader = new QuoteReader();
    }

    // Catches publishing under the calling EOA, allocating a new file for updates, or fake read state.
    function testProducerConsumerNativeInitialAndUpdate() public {
        producer.publish(3210, 0);
        (uint256 value, bytes32 f, uint64 revision) = reader.read(k, address(producer), quoteType);
        eq(value, 3210);
        eq(f, producer.quoteFile());
        eq(revision, 1);
        eq(k.fileInfo(f).owner, address(producer));
        bytes[] memory path = new bytes[](2);
        path[0] = "swaps";
        path[1] = "eth-usdc";
        eq(k.resolve(address(producer), path), f);
        eq(k.resolve(address(this), path), bytes32(0));
        producer.publish(3225, 1);
        (uint256 nextValue, bytes32 sameFile, uint64 nextRevision) = reader.read(k, address(producer), quoteType);
        eq(nextValue, 3225);
        eq(sameFile, f);
        eq(nextRevision, 2);
        eq(abi.decode(k.readRecord(k.revisionAt(f, 1).recordId).body, (uint256)), 3210);
        NavigationIndex.Cursor memory cursor;
        eq(k.navigation().fileInventory(address(producer), cursor, 64).ids.length, 3);
    }

    function testProducerAuthorityAndCAS() public {
        vm.prank(address(0xBAD));
        vm.expectRevert();
        producer.publish(1, 0);
        vm.expectRevert();
        producer.publish(1, 1);
        producer.publish(1, 0);
        vm.expectRevert();
        producer.publish(2, 0);
        bytes32 f = producer.quoteFile();
        vm.expectRevert();
        k.editFile(f, 1, quoteType, abi.encode(uint256(999)));
        eq(abi.decode(k.readRecord(k.fileInfo(f).recordId).body, (uint256)), 1);
    }

    function testReaderMissingAndWrongTypeRejects() public {
        vm.expectRevert();
        reader.read(k, address(producer), quoteType);
        producer.publish(1, 0);
        vm.expectRevert();
        reader.read(k, address(producer), bytes32(uint256(999)));
    }

    function testPlainMappingControlHasNativeOperator() public {
        PlainQuoteMapping direct = new PlainQuoteMapping();
        bytes32 key = keccak256("eth-usdc");
        direct.set(key, 123);
        eq(direct.values(key), 123);
        direct.set(key, 456);
        eq(direct.values(key), 456);
        vm.prank(address(0xBAD));
        vm.expectRevert();
        direct.set(key, 999);
    }

    // Removing the stateless-runtime restriction or replacing STATICCALL with CALL breaks isolation.
    function testCallbackValidatorCannotReenterKernel() public {
        CallbackValidator callback = new CallbackValidator(k, quoteType);
        ExactTypeRegistry registry = k.types();
        vm.expectRevert();
        registry.register(bytes("unreviewed callback"), address(callback));
        RegistryHarness probe = new RegistryHarness();
        yes(!probe.probe(address(callback), abi.encode(uint256(1))));
        bytes32 attempted = k.recordId(quoteType, abi.encode(uint256(123)));
        vm.expectRevert();
        k.readRecord(attempted);
    }
}
