// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import {LabBase} from "./LabBase.sol";
import {Keys} from "../src/Keys.sol";

/// Disposable data-model trace. A placement coordinate, a File Subject, and a
/// revision Record are distinct tag subjects. This uses the generic binding
/// primitive; it does not claim the current exact-Stance index validates or
/// exposes placement tags in FilesPageReader.
contract LocationTagSemanticsTest is LabBase {
    function test_location_file_and_revision_tags_survive_different_changes() public {
        bytes32 folder = alice.create(bytes32("docs"));
        bytes32 fileA = alice.create(bytes32("file-a"));
        bytes32 fileB = bob.create(bytes32("file-b"));
        bytes32 revisionA = ledger.publish(BINARY, bytes("old bytes"));
        bytes32 revisionB = ledger.publish(BINARY, bytes("new bytes"));
        bytes32 concept = alice.create(bytes32("ethereum"));
        bytes32 stance = ledger.publish(BINARY, bytes("assert"));
        bytes32 oldName = name("efs.doc");
        bytes32 newName = name("renamed.doc");
        bytes32 oldSlot = Keys.position(FOLDER, folder, oldName);

        alice.bind(FOLDER, folder, oldName, fileA, 0);
        alice.bind(HEAD, fileA, NO_ROLE, revisionA, 0);
        alice.bind(TAG, oldSlot, concept, stance, 0); // location/slot testimony
        alice.bind(TAG, fileA, concept, stance, 0);   // stable File testimony
        alice.bind(TAG, revisionA, concept, stance, 0); // exact bytes testimony

        (uint8 status, bytes32 selected,,,) = lens.resolve(lensOf(address(alice)), TAG, oldSlot, concept);
        require(status == 1 && selected == stance, "slot tag missing");

        // A different author overlays the same placement. The location tag is
        // still about this coordinate, not evidence about either File's bytes.
        bob.bind(FOLDER, folder, oldName, fileB, 0);
        (status, selected,,,) = lens.resolve(lensOf(address(bob), address(alice)), FOLDER, folder, oldName);
        require(status == 1 && selected == fileB, "Bob placement did not win");
        (status, selected,,,) = lens.resolve(lensOf(address(bob), address(alice)), TAG, oldSlot, concept);
        require(status == 1 && selected == stance, "Alice slot testimony did not fall back");
        (status,,,,) = lens.resolve(lensOf(address(bob), address(alice)), TAG, fileB, concept);
        require(status == 0, "slot testimony leaked onto Bob's File identity");

        // New content and a new placement do not silently move exact-revision
        // or location testimony. Stable File testimony follows fileA instead.
        alice.bind(HEAD, fileA, NO_ROLE, revisionB, 1);
        alice.unbind(FOLDER, folder, oldName, 1);
        alice.bind(FOLDER, folder, newName, fileA, 0);
        (status, selected,,,) = lens.resolve(lensOf(address(alice)), TAG, fileA, concept);
        require(status == 1 && selected == stance, "File tag lost on rename or edit");
        (status, selected,,,) = lens.resolve(lensOf(address(alice)), TAG, revisionA, concept);
        require(status == 1 && selected == stance, "old revision testimony lost");
        (status,,,,) = lens.resolve(lensOf(address(alice)), TAG, revisionB, concept);
        require(status == 0, "old revision testimony leaked onto new bytes");
        (status,,,,) = lens.resolve(lensOf(address(alice)), TAG, Keys.position(FOLDER, folder, newName), concept);
        require(status == 0, "old location testimony moved with File");
        (status, selected,,,) = lens.resolve(lensOf(address(alice)), TAG, oldSlot, concept);
        require(status == 1 && selected == stance, "old location testimony changed on rename");
    }
}
