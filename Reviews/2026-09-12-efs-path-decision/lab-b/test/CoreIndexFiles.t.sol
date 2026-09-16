// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;
import {FilesCarrierIndexTest} from "./FilesCarrierProfile.t.sol";
import {ProfiledFilesIndex} from "./ProfiledFilesIndex.sol";
import {FilesDirectoryIndex} from "./FilesDirectoryProfile.sol";
import {Keys} from "../src/Keys.sol";
import {LensReader} from "../src/LensReader.sol";
import {Ledger} from "../src/Ledger.sol";

contract CoreIndexFilesTest is FilesCarrierIndexTest {
    function setUp() public override {
        super.setUp();
        bytes32[8] memory old = [
            rt,
            ct,
            live.expectedRootRuleHash(),
            live.expectedChildRuleHash(),
            nt,
            live.expectedNameRuleHash(),
            dt,
            FilesDirectoryIndex(address(live)).expectedDirectoryRuleHash()
        ];
        live = new ProfiledFilesIndex(address(ledger), old, ts, hs);
        index = live;
        ledger.setIndexModule(address(index));
        lens = new LensReader(ledger, index);
    }

    function test_ciphertext_digest_descriptor_revision_selected_file_and_final_names() public {
        bytes32 file = ledger.create(bytes32(uint256(701)));
        bytes32 folder = _directory(702);
        bytes32 empty = ledger.publish(ts[0], abi.encode(sha256("")));
        bytes32 digest = sha256("ciphertext bytes not fetched");
        bytes memory body = abi.encode(
            empty,
            uint256(1),
            uint256(1),
            uint256(1),
            uint256(17),
            digest,
            uint256(0),
            uint256(1),
            bytes32(0),
            uint256(1),
            bytes32(0)
        );
        bytes32 descriptor = ledger.publish(ts[1], body);
        (, uint64 descriptorFirst,,) = ledger.record(descriptor);
        bytes32 revision = ledger.publish(ts[2], abi.encode(descriptor, file));
        (, uint64 revisionFirst,,) = ledger.record(revision);
        Ledger.Action[] memory a = new Ledger.Action[](3);
        bytes[] memory b = new bytes[](3);
        a[0] = aBind(HEAD, file, 0, revision, 0);
        a[1] = aBind(FOLDER, folder, name("cipher"), file, 0);
        a[2] = aPublish(nt, bytes("cipher"));
        b[2] = bytes("cipher");
        ledger.execute(a, b, ledger.nonces(address(this)));
        bytes32 key = Keys.digestList(bytes32(uint256(1)), digest);
        require(index.postingAt(key, 0) == descriptorFirst, "digest to descriptor");
        require(index.postingAt(Keys.referenceList(ts[2], 0, descriptor), 0) == revisionFirst, "descriptor to revision");
        (uint8 status, bytes32 selected,,,) = lens.resolve(lensOf(address(this)), HEAD, file, 0);
        require(status == 1 && selected == revision, "Lens selected exact revision");
        (status, selected,,,) = lens.resolve(lensOf(address(this)), FOLDER, folder, name("cipher"));
        require(status == 1 && selected == file, "selected File membership");
        require(
            index.postingAt(Keys.digestList(bytes32(uint256(1)), 0), 0) == 0, "plaintext fingerprint was indexed"
        );
        ledger.execute(one(aWithdraw(descriptorFirst)), new bytes[](1), ledger.nonces(address(this)));
        (uint64 count, uint64 liveCount,,) = index.postingHead(key);
        require(count == 1 && liveCount == 1, "retained descriptor erased by occurrence withdrawal");
    }
}
