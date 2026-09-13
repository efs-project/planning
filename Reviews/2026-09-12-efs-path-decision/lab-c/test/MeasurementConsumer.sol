// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

/*
 * Stateless, test-only paid consumer for the Road C measurement runner. It has no
 * constructor, owner, mutable fields or privileged call path. Its result events
 * are deliberately part of the paid transaction overhead.
 */

import { IStoreRead } from "@latticexyz/store/src/IStoreRead.sol";
import "../src/EfsTypes.sol";
import { LensReader } from "../src/LensReader.sol";
import { Records, Admissions, AdmissionData, Evidence, EvidenceData } from "../src/tables/LedgerTables.sol";

interface IMeasurementIndex {
  function FAMILY_SCOPES() external view returns (bytes32);

  function coverage(bytes32 family, bytes32 partition) external view returns (uint8 status, uint64 through);
}

contract MeasurementConsumer {
  struct Expected {
    bytes32 author;
    bytes32 typeId;
    bytes32 recordId;
    bytes32 expectedRef; // zero means the canonical frame must contain no references
    uint256 payloadLength;
    bytes32 payloadHash;
  }

  event PointCommitted(
    bytes32 indexed commitment,
    bytes32 indexed subject,
    bytes32 indexed recordId,
    bytes32 selectedBy,
    uint64 basis
  );
  event ListCommitted(
    bytes32 indexed commitment,
    bytes32 indexed folder,
    bytes32 indexed subject,
    bytes32 recordId,
    bytes32 selectedBy,
    uint64 basis,
    uint64 coverageThrough
  );

  error NotSelected(uint8 status);
  error WrongSelection();
  error WrongAuthorContext();
  error WrongRecordType();
  error WrongRecordId();
  error MalformedFrame();
  error WrongReference();
  error WrongPayloadLength(uint256 actual);
  error WrongPayloadHash();
  error IncompleteSelection(uint8 status);
  error IncompleteCoverage(uint8 status, uint64 through, uint64 basis);

  function paidPoint(
    LensReader reader,
    IStoreRead ledger,
    LensReader.Lens calldata lens,
    bytes32 purpose,
    bytes32 subject,
    bytes32 role,
    Expected calldata expected
  ) external returns (bytes32 commitment, bytes32 recordId) {
    LensReader.Resolution memory r = reader.resolve(lens, purpose, subject, role);
    bytes32 payloadHash = _validate(reader, ledger, r, purpose, subject, role, expected);
    recordId = r.target;
    commitment = keccak256(
      abi.encode("road-c/measurement/point/1", subject, role, recordId, r.selectedBy, r.admission, r.basis, payloadHash)
    );
    emit PointCommitted(commitment, subject, recordId, r.selectedBy, r.basis);
  }

  function paidList(
    LensReader reader,
    IStoreRead ledger,
    LensReader.Lens calldata lens,
    bytes32 folder,
    bytes32 name,
    bytes32 expectedSubject,
    uint32 budget,
    Expected calldata expected
  ) external returns (bytes32 commitment, bytes32 recordId, uint64 basis) {
    LensReader.Cursor memory cursor;
    LensReader.Page memory page = reader.list(lens, PURPOSE_FOLDER, folder, cursor, budget);
    if (page.status != 1) revert IncompleteSelection(page.status);
    basis = page.next.basisAdmission;
    IMeasurementIndex ix = IMeasurementIndex(address(reader.index()));
    (uint8 coverageStatus, uint64 coverageThrough) = ix.coverage(ix.FAMILY_SCOPES(), bytes32(0));
    if (coverageStatus != 1 || coverageThrough < basis) {
      revert IncompleteCoverage(coverageStatus, coverageThrough, basis);
    }

    bool found;
    for (uint256 i = 0; i < page.items.length; i++) {
      LensReader.Item memory item = page.items[i];
      if (item.name != name) continue;
      if (found || item.status != 1 || item.target != expectedSubject || item.selectedBy != expected.author) {
        revert WrongSelection();
      }
      found = true;
    }
    if (!found) revert WrongSelection();

    LensReader.Resolution memory r = reader.resolveAt(
      lens,
      PURPOSE_HEAD,
      expectedSubject,
      bytes32(0),
      basis
    );
    bytes32 payloadHash = _validate(reader, ledger, r, PURPOSE_HEAD, expectedSubject, bytes32(0), expected);
    recordId = r.target;
    commitment = keccak256(
      abi.encode(
        "road-c/measurement/list/1",
        folder,
        name,
        expectedSubject,
        recordId,
        r.selectedBy,
        basis,
        coverageThrough,
        page.rawTotal,
        page.scanned,
        page.hydrated,
        payloadHash
      )
    );
    emit ListCommitted(commitment, folder, expectedSubject, recordId, r.selectedBy, basis, coverageThrough);
  }

  function _validate(
    LensReader,
    IStoreRead ledger,
    LensReader.Resolution memory r,
    bytes32 purpose,
    bytes32 subject,
    bytes32 role,
    Expected calldata expected
  ) internal view returns (bytes32 payloadHash) {
    if (r.status != 1) revert NotSelected(r.status);
    if (r.target != expected.recordId) revert WrongRecordId();
    if (r.selectedBy != expected.author) revert WrongAuthorContext();

    AdmissionData memory admission = Admissions.get(ledger, r.admission);
    if (
      admission.kind != KIND_BIND || admission.purpose != purpose || admission.subject != subject ||
      admission.role != role || admission.target != r.target
    ) revert WrongSelection();
    EvidenceData memory evidence = Evidence.get(ledger, admission.publicationId);
    if (evidence.author != expected.author || evidence.firstAdmission == 0 || evidence.firstAdmission > r.admission) {
      revert WrongAuthorContext();
    }

    (bytes32 typeId, uint64 firstAdmission, bytes memory body) = Records.get(ledger, r.target);
    if (firstAdmission == 0) revert WrongRecordId();
    if (typeId != expected.typeId) revert WrongRecordType();
    if (EfsIds.recordId(typeId, keccak256(body)) != r.target) revert WrongRecordId();
    (bytes32[] memory refs, bytes memory payload) = abi.decode(body, (bytes32[], bytes));
    if (keccak256(body) != keccak256(abi.encode(refs, payload))) revert MalformedFrame();
    if (expected.expectedRef == bytes32(0)) {
      if (refs.length != 0) revert WrongReference();
    } else if (refs.length != 1 || refs[0] != expected.expectedRef) {
      revert WrongReference();
    }
    if (payload.length != expected.payloadLength) revert WrongPayloadLength(payload.length);
    payloadHash = keccak256(payload);
    if (payloadHash != expected.payloadHash) revert WrongPayloadHash();
  }
}
