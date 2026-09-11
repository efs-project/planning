// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;
import {TestBase} from "./TestBase.sol";
import {NativeKernel} from "../src/NativeKernel.sol";
import {NavigationIndex} from "../src/NavigationIndex.sol";
import {Uint256Validator} from "../src/ExactTypeRegistry.sol";
import {QuoteProducer, QuoteReader, PlainQuoteMapping} from "../src/Examples.sol";

/// @notice Named complete operation measurements. Forge test gas is NOT receipt gas.
/// Setup creates prior state; each test is one public call and its necessary input construction.
contract GasOperationsTest is TestBase {
    NativeKernel k;
    bytes32 t;
    bytes32 root;
    bytes32 f;
    bytes32 dir;
    QuoteProducer firstProducer;
    QuoteProducer liveProducer;
    QuoteReader reader;
    PlainQuoteMapping direct;
    bytes32 constant KEY = keccak256("eth-usdc");

    function setUp() public {
        k = new NativeKernel();
        t = k.types().register(bytes("EFS21 quote: ABI uint256"), address(new Uint256Validator()));
        root = k.ensureRoot();
        for (uint256 i; i < 32; ++i) {
            // 65 <= 65+i <= 96, hence the byte conversion cannot truncate.
            // forge-lint: disable-next-line(unsafe-typecast)
            bytes32 id = k.createFile(root, abi.encodePacked(bytes1(uint8(65 + i))), t, abi.encode(i));
            if (i == 0) f = id;
        }
        dir = k.createDirectory(root, "destination");
        firstProducer = new QuoteProducer(k, t);
        liveProducer = new QuoteProducer(k, t);
        liveProducer.publish(100, 0);
        reader = new QuoteReader();
        direct = new PlainQuoteMapping();
        direct.set(KEY, 100);
    }

    function testGasCreateRoot() public {
        vm.prank(address(0x1111));
        k.ensureRoot();
    }

    function testGasCreateDirectory() public {
        k.createDirectory(root, "new-dir");
    }

    function testGasCreateFileUniqueRecord() public {
        k.createFile(root, "new-file", t, abi.encode(uint256(9000)));
    }

    function testGasCreateFileDeduplicatedRecord() public {
        k.createFile(root, "new-file", t, abi.encode(uint256(1)));
    }

    function testGasEditFileUniqueRecord() public {
        k.editFile(f, 1, t, abi.encode(uint256(9000)));
    }

    function testGasRenameFile() public {
        k.moveFile(f, 1, root, "renamed");
    }

    function testGasMoveFile() public {
        k.moveFile(f, 1, dir, "moved");
    }

    function testGasUnlinkFile() public {
        k.unlink(f, 1);
    }

    function testGasUnlinkEmptyDirectory() public {
        k.unlink(dir, 1);
    }

    function testGasStoreRecordUnique() public {
        k.storeRecord(t, abi.encode(uint256(9000)));
    }

    function testGasStoreRecordDuplicate() public {
        k.storeRecord(t, abi.encode(uint256(1)));
    }

    function testGasHydratedPage16() public view {
        NavigationIndex.Cursor memory cursor;
        k.listDirectory(address(this), root, cursor, 16);
    }

    function testGasHydratedPage32() public view {
        NavigationIndex.Cursor memory cursor;
        k.listDirectory(address(this), root, cursor, 32);
    }

    function testGasProducerInitialPublish() public {
        firstProducer.publish(9000, 0);
    }

    function testGasProducerUpdate() public {
        liveProducer.publish(9000, 1);
    }

    function testGasConsumerRead() public view {
        reader.read(k, address(liveProducer), t);
    }

    function testGasPlainMappingInsert() public {
        direct.set(keccak256("new"), 9000);
    }

    function testGasPlainMappingUpdate() public {
        direct.set(KEY, 9000);
    }

    function testGasPlainMappingRead() public view {
        direct.values(KEY);
    }
}
