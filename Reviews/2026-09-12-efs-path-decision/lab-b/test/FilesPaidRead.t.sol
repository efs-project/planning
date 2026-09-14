// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import {FilesJoinedTest} from "./FilesJoined.t.sol";
import {FilesJoinedConsumer} from "./FilesJoinedConsumer.sol";
import {FilesPaidRead} from "./FilesPaidRead.sol";
import {LensReader} from "../src/LensReader.sol";
import {Keys} from "../src/Keys.sol";

interface FilesPaidVm {
    struct Log { bytes32[] topics; bytes data; address emitter; }
    function record() external;
    function accesses(address target) external returns (bytes32[] memory reads, bytes32[] memory writes);
    function recordLogs() external;
    function getRecordedLogs() external returns (Log[] memory);
}

/// Inherits existing real fixture/tests; a focused match-test avoids counting the
/// inherited tests again. The separate measurement runner does NOT deploy LabBase.
contract FilesPaidReadTest is FilesJoinedTest {
    FilesPaidVm private constant pvm = FilesPaidVm(address(uint160(uint256(keccak256("hevm cheat code")))));

    // Hand-derived expected point, not obtained from the consumer or wrapper.
    function _paidExpectedPoint(bool firstAlice, bool project) private view returns (FilesJoinedConsumer.FilePoint memory p) {
        bytes32 revision = firstAlice ? ra : rb;
        bytes memory document = firstAlice ? bytes("Meeting at 11:00.\n") : bytes("Meeting at 09:00.\n");
        p.status = 1;
        p.file = file;
        p.revision = FilesJoinedConsumer.Revision(revision, childType, r0, file, document, keccak256(document));
        p.fileTag = FilesJoinedConsumer.TagAssessment(file, project ? file : bytes32(0), project ? 1 : 0, true, project);
        bool approved = !project && firstAlice;
        p.revisionTag = FilesJoinedConsumer.TagAssessment(revision, approved ? file : bytes32(0), approved ? 1 : 0, true, approved);
    }

    function _paidExpectedFolder(bool firstAlice, bool project, address[] memory authors,
        FilesJoinedConsumer.Basis memory basis) private view returns (FilesJoinedConsumer.FolderResult memory result)
    {
        result.status = 2;
        result.next = LensReader.Cursor(basis.admission, basis.generation, basis.epoch, basis.core,
            keccak256(abi.encode(FOLDER, DRAFTS)), keccak256(abi.encodePacked(authors)),
            Keys.position(FOLDER, DRAFTS, name("note.txt")), 2, 0, 1);
        result.files = new FilesJoinedConsumer.FilePoint[](project || firstAlice ? 1 : 0);
        if (result.files.length != 0) result.files[0] = _paidExpectedPoint(firstAlice, project);
    }

    function _paidEvent(FilesPaidRead paid, FilesJoinedConsumer reader, bytes32 key, bytes32 expected) private {
        FilesPaidVm.Log[] memory logs = pvm.getRecordedLogs();
        require(logs.length == 1, "one actual paid Files result event");
        require(logs[0].emitter == address(paid) && logs[0].topics.length == 2
            && logs[0].topics[0] == keccak256("FilesRead(bytes32,bytes32)") && logs[0].topics[1] == key
            && logs[0].data.length == 32 && abi.decode(logs[0].data, (bytes32)) == expected,
            "paid event binds exact query and entire independently expected result");
        address[7] memory targets = [address(paid), address(reader), address(ledger), address(filesIndex),
            address(lens), address(registry), address(childRule)];
        for (uint256 j; j < targets.length; ++j) {
            (, bytes32[] memory writes) = pvm.accesses(targets[j]);
            require(writes.length == 0, "paid Files read writes no storage");
        }
    }

    // Catches omitted/partial/fabricated answers, wrong Lens/tag scope/query key,
    // incomplete-as-empty folder output, cached state, or swallowed basis errors.
    function test_paid_files_emits_six_exact_real_results_without_storage() public {
        _createRoot();
        _publishBranches();
        FilesJoinedConsumer reader = _filesReader();
        FilesPaidRead paid = new FilesPaidRead(reader);
        FilesJoinedConsumer.Basis memory basis = _basis();
        for (uint256 i; i < 2; ++i) {
            bool firstAlice = i == 0;
            address[] memory authors = firstAlice ? lensOf(eoaA, address(bob)) : lensOf(address(bob), eoaA);
            bytes32 key = keccak256(abi.encode(address(reader), FilesJoinedConsumer.readFilePoint.selector,
                file, authors, APPROVED, basis));
            bytes32 expected = keccak256(abi.encode(_paidExpectedPoint(firstAlice, false)));
            pvm.record(); pvm.recordLogs();
            paid.point(file, authors, APPROVED, basis);
            _paidEvent(paid, reader, key, expected);
            for (uint256 j; j < 2; ++j) {
                bool project = j == 0;
                bytes32 concept = project ? PROJECT_EFS : APPROVED;
                FilesJoinedConsumer.TagScope scope = project ? FilesJoinedConsumer.TagScope.File
                    : FilesJoinedConsumer.TagScope.SelectedRevision;
                key = keccak256(abi.encode(address(reader), FilesJoinedConsumer.readFolderTaggedOnce.selector,
                    DRAFTS, authors, concept, scope, uint256(1), basis));
                expected = keccak256(abi.encode(_paidExpectedFolder(firstAlice, project, authors, basis)));
                pvm.record(); pvm.recordLogs();
                paid.folder(DRAFTS, authors, concept, scope, 1, basis);
                _paidEvent(paid, reader, key, expected);
            }
        }
        --basis.admission;
        pvm.recordLogs();
        (bool ok, bytes memory err) = address(paid).call(abi.encodeCall(paid.point,
            (file, lensOf(eoaA, address(bob)), APPROVED, basis)));
        require(!ok && keccak256(err) == keccak256(abi.encodeWithSelector(FilesJoinedConsumer.E_BASIS.selector)),
            "paid point preserves exact stale basis rejection");
        require(pvm.getRecordedLogs().length == 0, "failed read emits no result");
    }
}
