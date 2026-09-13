// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

/*
 * Hand-written MUD-style table libraries for the Ledger (namespace "efs").
 * Shape follows @latticexyz/store codegen (2.2.23): `_x` variants call StoreCore
 * (internal, owning contract only); `x(IStoreRead store, ...)` variants read an
 * external Store through its public IStoreRead ABI (used by LensReader/tests).
 * Constants were computed offline with the FieldLayout/Schema encoders and
 * cross-checked against MUD's own Tables/StoreHooks constants (see README).
 * MUD keeps NO existence bit: every table below carries an explicit admission
 * ordinal (or revision) whose zero value means "absent".
 *
 * Physical layout note (pre-seal check 2): MUD packs all static fields of a row
 * contiguously (Admissions: 262 bytes over 9 slots; Evidence: 325 bytes over 11
 * slots) with no per-field slot alignment. The recovered field VALUES are what
 * the reconstruction test re-encodes with abi.encode; the packed layout never
 * enters the digest.
 */

import { IStoreRead } from "@latticexyz/store/src/IStoreRead.sol";
import { StoreCore } from "@latticexyz/store/src/StoreCore.sol";
import { Bytes } from "@latticexyz/store/src/Bytes.sol";
import { SliceLib } from "@latticexyz/store/src/Slice.sol";
import { EncodeArray } from "@latticexyz/store/src/tightcoder/EncodeArray.sol";
import { FieldLayout } from "@latticexyz/store/src/FieldLayout.sol";
import { Schema } from "@latticexyz/store/src/Schema.sol";
import { EncodedLengths, EncodedLengthsLib } from "@latticexyz/store/src/EncodedLengths.sol";
import { ResourceId } from "@latticexyz/store/src/ResourceId.sol";

Schema constant KEY_BYTES32 = Schema.wrap(0x002001005f000000000000000000000000000000000000000000000000000000);
Schema constant KEY_UINT64 = Schema.wrap(0x0008010007000000000000000000000000000000000000000000000000000000);
EncodedLengths constant NO_LENGTHS = EncodedLengths.wrap(bytes32(0));

function key1(bytes32 k) pure returns (bytes32[] memory t) {
  t = new bytes32[](1);
  t[0] = k;
}

// ---------------------------------------------------------------------------
// Records: recordId -> (typeId, firstAdmission, body)
// ---------------------------------------------------------------------------
library Records {
  ResourceId constant _tableId = ResourceId.wrap(0x746265667300000000000000000000005265636f726473000000000000000000);
  FieldLayout constant _fieldLayout =
    FieldLayout.wrap(0x0028020120080000000000000000000000000000000000000000000000000000);
  Schema constant _keySchema = KEY_BYTES32;
  Schema constant _valueSchema = Schema.wrap(0x002802015f07c400000000000000000000000000000000000000000000000000);

  function getKeyNames() internal pure returns (string[] memory n) {
    n = new string[](1);
    n[0] = "recordId";
  }

  function getFieldNames() internal pure returns (string[] memory n) {
    n = new string[](3);
    n[0] = "typeId";
    n[1] = "firstAdmission";
    n[2] = "body";
  }

  function _register() internal {
    StoreCore.registerTable(_tableId, _fieldLayout, _keySchema, _valueSchema, getKeyNames(), getFieldNames());
  }

  function _set(bytes32 recordId, bytes32 typeId, uint64 firstAdmission, bytes memory body) internal {
    StoreCore.setRecord(
      _tableId,
      key1(recordId),
      abi.encodePacked(typeId, firstAdmission),
      EncodedLengthsLib.pack(body.length),
      body,
      _fieldLayout
    );
  }

  function _getFirstAdmission(bytes32 recordId) internal view returns (uint64) {
    return uint64(bytes8(StoreCore.getStaticField(_tableId, key1(recordId), 1, _fieldLayout)));
  }

  function _getTypeId(bytes32 recordId) internal view returns (bytes32) {
    return StoreCore.getStaticField(_tableId, key1(recordId), 0, _fieldLayout);
  }

  function _getBody(bytes32 recordId) internal view returns (bytes memory) {
    return StoreCore.getDynamicField(_tableId, key1(recordId), 0);
  }

  function get(
    IStoreRead store,
    bytes32 recordId
  ) internal view returns (bytes32 typeId, uint64 firstAdmission, bytes memory body) {
    (bytes memory s, , bytes memory d) = store.getRecord(_tableId, key1(recordId), _fieldLayout);
    typeId = Bytes.getBytes32(s, 0);
    firstAdmission = uint64(bytes8(Bytes.getBytes32(s, 32)));
    body = d;
  }
}

// ---------------------------------------------------------------------------
// Admissions: ordinal -> the admitted action tuple + publicationId (11 static fields, 262 bytes)
// ---------------------------------------------------------------------------
struct AdmissionData {
  bytes32 publicationId;
  uint8 kind;
  bytes32 typeId;
  uint8 digestKind;
  bytes32 digest;
  bytes32 purpose;
  bytes32 subject;
  bytes32 role;
  bytes32 target;
  uint32 expectedRevision;
  bytes32 salt;
}

library Admissions {
  ResourceId constant _tableId = ResourceId.wrap(0x7462656673000000000000000000000041646d697373696f6e73000000000000);
  FieldLayout constant _fieldLayout =
    FieldLayout.wrap(0x01060b0020012001202020202004200000000000000000000000000000000000);
  Schema constant _keySchema = KEY_UINT64;
  Schema constant _valueSchema = Schema.wrap(0x01060b005f005f005f5f5f5f5f035f0000000000000000000000000000000000);

  function getKeyNames() internal pure returns (string[] memory n) {
    n = new string[](1);
    n[0] = "ordinal";
  }

  function getFieldNames() internal pure returns (string[] memory n) {
    n = new string[](11);
    n[0] = "publicationId";
    n[1] = "kind";
    n[2] = "typeId";
    n[3] = "digestKind";
    n[4] = "digest";
    n[5] = "purpose";
    n[6] = "subject";
    n[7] = "role";
    n[8] = "target";
    n[9] = "expectedRevision";
    n[10] = "salt";
  }

  function _register() internal {
    StoreCore.registerTable(_tableId, _fieldLayout, _keySchema, _valueSchema, getKeyNames(), getFieldNames());
  }

  function _key(uint64 ordinal) internal pure returns (bytes32[] memory) {
    return key1(bytes32(uint256(ordinal)));
  }

  function encodeStatic(AdmissionData memory a) internal pure returns (bytes memory) {
    return
      abi.encodePacked(
        abi.encodePacked(a.publicationId, a.kind, a.typeId, a.digestKind, a.digest),
        abi.encodePacked(a.purpose, a.subject, a.role, a.target, a.expectedRevision, a.salt)
      );
  }

  function decodeStatic(bytes memory s) internal pure returns (AdmissionData memory a) {
    a.publicationId = Bytes.getBytes32(s, 0);
    a.kind = uint8(bytes1(Bytes.getBytes32(s, 32)));
    a.typeId = Bytes.getBytes32(s, 33);
    a.digestKind = uint8(bytes1(Bytes.getBytes32(s, 65)));
    a.digest = Bytes.getBytes32(s, 66);
    a.purpose = Bytes.getBytes32(s, 98);
    a.subject = Bytes.getBytes32(s, 130);
    a.role = Bytes.getBytes32(s, 162);
    a.target = Bytes.getBytes32(s, 194);
    a.expectedRevision = uint32(bytes4(Bytes.getBytes32(s, 226)));
    a.salt = Bytes.getBytes32(s, 230);
  }

  function _set(uint64 ordinal, AdmissionData memory a) internal {
    StoreCore.setRecord(_tableId, _key(ordinal), encodeStatic(a), NO_LENGTHS, new bytes(0), _fieldLayout);
  }

  function _get(uint64 ordinal) internal view returns (AdmissionData memory) {
    (bytes memory s, , ) = StoreCore.getRecord(_tableId, _key(ordinal), _fieldLayout);
    return decodeStatic(s);
  }

  function get(IStoreRead store, uint64 ordinal) internal view returns (AdmissionData memory) {
    (bytes memory s, , ) = store.getRecord(_tableId, _key(ordinal), _fieldLayout);
    return decodeStatic(s);
  }
}

// ---------------------------------------------------------------------------
// Evidence: publicationId -> the shared Evidence cell (17 static fields, 325 bytes)
// ---------------------------------------------------------------------------
struct EvidenceData {
  bytes32 author;
  uint8 proofKind;
  bytes32 r;
  bytes32 s;
  uint8 v;
  uint64 nonce;
  uint64 deadline;
  bytes32 acceptanceProfile;
  bytes32 indexObligations;
  bytes32 actionsHash;
  uint64 firstAdmission;
  uint16 leafCount;
  uint64 basis;
  bytes32 realmId; // Realm the signature was bound to (source Realm for imported cells)
  bytes32 coreCodeCommitment; // code commitment the signature was bound to
  bytes32 importOf; // destination authorization cells: the source publicationId they admitted; else 0
  uint8 sourceGrade; // GRADE_* for imported cells; 0 for native admissions
}

library Evidence {
  ResourceId constant _tableId = ResourceId.wrap(0x7462656673000000000000000000000045766964656e63650000000000000000);
  FieldLayout constant _fieldLayout =
    FieldLayout.wrap(0x0145110020012020010808202020080208202020010000000000000000000000);
  Schema constant _keySchema = KEY_BYTES32;
  Schema constant _valueSchema = Schema.wrap(0x014511005f005f5f0007075f5f5f0701075f5f5f000000000000000000000000);

  function getKeyNames() internal pure returns (string[] memory n) {
    n = new string[](1);
    n[0] = "publicationId";
  }

  function getFieldNames() internal pure returns (string[] memory n) {
    n = new string[](17);
    n[0] = "author";
    n[1] = "proofKind";
    n[2] = "r";
    n[3] = "s";
    n[4] = "v";
    n[5] = "nonce";
    n[6] = "deadline";
    n[7] = "acceptanceProfile";
    n[8] = "indexObligations";
    n[9] = "actionsHash";
    n[10] = "firstAdmission";
    n[11] = "leafCount";
    n[12] = "basis";
    n[13] = "realmId";
    n[14] = "coreCodeCommitment";
    n[15] = "importOf";
    n[16] = "sourceGrade";
  }

  function _register() internal {
    StoreCore.registerTable(_tableId, _fieldLayout, _keySchema, _valueSchema, getKeyNames(), getFieldNames());
  }

  function encodeStatic(EvidenceData memory e) internal pure returns (bytes memory) {
    return
      abi.encodePacked(
        abi.encodePacked(e.author, e.proofKind, e.r, e.s, e.v, e.nonce, e.deadline),
        abi.encodePacked(e.acceptanceProfile, e.indexObligations, e.actionsHash, e.firstAdmission, e.leafCount, e.basis),
        abi.encodePacked(e.realmId, e.coreCodeCommitment, e.importOf, e.sourceGrade)
      );
  }

  function decodeStatic(bytes memory s) internal pure returns (EvidenceData memory e) {
    e.author = Bytes.getBytes32(s, 0);
    e.proofKind = uint8(bytes1(Bytes.getBytes32(s, 32)));
    e.r = Bytes.getBytes32(s, 33);
    e.s = Bytes.getBytes32(s, 65);
    e.v = uint8(bytes1(Bytes.getBytes32(s, 97)));
    e.nonce = uint64(bytes8(Bytes.getBytes32(s, 98)));
    e.deadline = uint64(bytes8(Bytes.getBytes32(s, 106)));
    e.acceptanceProfile = Bytes.getBytes32(s, 114);
    e.indexObligations = Bytes.getBytes32(s, 146);
    e.actionsHash = Bytes.getBytes32(s, 178);
    e.firstAdmission = uint64(bytes8(Bytes.getBytes32(s, 210)));
    e.leafCount = uint16(bytes2(Bytes.getBytes32(s, 218)));
    e.basis = uint64(bytes8(Bytes.getBytes32(s, 220)));
    e.realmId = Bytes.getBytes32(s, 228);
    e.coreCodeCommitment = Bytes.getBytes32(s, 260);
    e.importOf = Bytes.getBytes32(s, 292);
    e.sourceGrade = uint8(bytes1(Bytes.getBytes32(s, 324)));
  }

  function _set(bytes32 publicationId, EvidenceData memory e) internal {
    StoreCore.setRecord(_tableId, key1(publicationId), encodeStatic(e), NO_LENGTHS, new bytes(0), _fieldLayout);
  }

  function _getFirstAdmission(bytes32 publicationId) internal view returns (uint64) {
    return uint64(bytes8(StoreCore.getStaticField(_tableId, key1(publicationId), 10, _fieldLayout)));
  }

  /// Existence = a non-zero author (a retained grade-zero import has firstAdmission == 0 but an author).
  function _exists(bytes32 publicationId) internal view returns (bool) {
    return StoreCore.getStaticField(_tableId, key1(publicationId), 0, _fieldLayout) != bytes32(0);
  }

  function get(IStoreRead store, bytes32 publicationId) internal view returns (EvidenceData memory) {
    (bytes memory s, , ) = store.getRecord(_tableId, key1(publicationId), _fieldLayout);
    return decodeStatic(s);
  }
}

// ---------------------------------------------------------------------------
// Bindings: bindingKey -> (target, revision, admission). revision==0 means never bound.
// ---------------------------------------------------------------------------
library Bindings {
  ResourceId constant _tableId = ResourceId.wrap(0x7462656673000000000000000000000042696e64696e67730000000000000000);
  FieldLayout constant _fieldLayout =
    FieldLayout.wrap(0x002c030020040800000000000000000000000000000000000000000000000000);
  Schema constant _keySchema = KEY_BYTES32;
  Schema constant _valueSchema = Schema.wrap(0x002c03005f030700000000000000000000000000000000000000000000000000);

  function getKeyNames() internal pure returns (string[] memory n) {
    n = new string[](1);
    n[0] = "bindingKey";
  }

  function getFieldNames() internal pure returns (string[] memory n) {
    n = new string[](3);
    n[0] = "target";
    n[1] = "revision";
    n[2] = "admission";
  }

  function _register() internal {
    StoreCore.registerTable(_tableId, _fieldLayout, _keySchema, _valueSchema, getKeyNames(), getFieldNames());
  }

  function decodeStatic(bytes memory s) internal pure returns (bytes32 target, uint32 revision, uint64 admission) {
    target = Bytes.getBytes32(s, 0);
    revision = uint32(bytes4(Bytes.getBytes32(s, 32)));
    admission = uint64(bytes8(Bytes.getBytes32(s, 36)));
  }

  function _set(bytes32 bindingKey, bytes32 target, uint32 revision, uint64 admission) internal {
    StoreCore.setRecord(
      _tableId,
      key1(bindingKey),
      abi.encodePacked(target, revision, admission),
      NO_LENGTHS,
      new bytes(0),
      _fieldLayout
    );
  }

  function _get(bytes32 bindingKey) internal view returns (bytes32 target, uint32 revision, uint64 admission) {
    (bytes memory s, , ) = StoreCore.getRecord(_tableId, key1(bindingKey), _fieldLayout);
    return decodeStatic(s);
  }

  function get(
    IStoreRead store,
    bytes32 bindingKey
  ) internal view returns (bytes32 target, uint32 revision, uint64 admission) {
    (bytes memory s, , ) = store.getRecord(_tableId, key1(bindingKey), _fieldLayout);
    return decodeStatic(s);
  }
}

// ---------------------------------------------------------------------------
// Subjects: subjectId -> (creator, creatorSalt, admission)
// ---------------------------------------------------------------------------
library Subjects {
  ResourceId constant _tableId = ResourceId.wrap(0x746265667300000000000000000000005375626a656374730000000000000000);
  FieldLayout constant _fieldLayout =
    FieldLayout.wrap(0x0048030020200800000000000000000000000000000000000000000000000000);
  Schema constant _keySchema = KEY_BYTES32;
  Schema constant _valueSchema = Schema.wrap(0x004803005f5f0700000000000000000000000000000000000000000000000000);

  function getKeyNames() internal pure returns (string[] memory n) {
    n = new string[](1);
    n[0] = "subjectId";
  }

  function getFieldNames() internal pure returns (string[] memory n) {
    n = new string[](3);
    n[0] = "creator";
    n[1] = "creatorSalt";
    n[2] = "admission";
  }

  function _register() internal {
    StoreCore.registerTable(_tableId, _fieldLayout, _keySchema, _valueSchema, getKeyNames(), getFieldNames());
  }

  function _set(bytes32 subjectId, bytes32 creator, bytes32 creatorSalt, uint64 admission) internal {
    StoreCore.setRecord(
      _tableId,
      key1(subjectId),
      abi.encodePacked(creator, creatorSalt, admission),
      NO_LENGTHS,
      new bytes(0),
      _fieldLayout
    );
  }

  function _getAdmission(bytes32 subjectId) internal view returns (uint64) {
    return uint64(bytes8(StoreCore.getStaticField(_tableId, key1(subjectId), 2, _fieldLayout)));
  }

  function get(
    IStoreRead store,
    bytes32 subjectId
  ) internal view returns (bytes32 creator, bytes32 creatorSalt, uint64 admission) {
    (bytes memory s, , ) = store.getRecord(_tableId, key1(subjectId), _fieldLayout);
    creator = Bytes.getBytes32(s, 0);
    creatorSalt = Bytes.getBytes32(s, 32);
    admission = uint64(bytes8(Bytes.getBytes32(s, 64)));
  }
}

// ---------------------------------------------------------------------------
// Types: typeId -> (acceptor, acceptorCodehash, admission, refTypes[])   (EFS Types are rows;
// the acceptor address is Realm-local; its codehash must match the rule committed in the Type body)
// ---------------------------------------------------------------------------
library Types {
  ResourceId constant _tableId = ResourceId.wrap(0x7462656673000000000000000000000054797065730000000000000000000000);
  FieldLayout constant _fieldLayout =
    FieldLayout.wrap(0x003c030114200800000000000000000000000000000000000000000000000000);
  Schema constant _keySchema = KEY_BYTES32;
  Schema constant _valueSchema = Schema.wrap(0x003c0301615f07c1000000000000000000000000000000000000000000000000);

  function getKeyNames() internal pure returns (string[] memory n) {
    n = new string[](1);
    n[0] = "typeId";
  }

  function getFieldNames() internal pure returns (string[] memory n) {
    n = new string[](4);
    n[0] = "acceptor";
    n[1] = "acceptorCodehash";
    n[2] = "admission";
    n[3] = "refTypes";
  }

  function _register() internal {
    StoreCore.registerTable(_tableId, _fieldLayout, _keySchema, _valueSchema, getKeyNames(), getFieldNames());
  }

  function _set(
    bytes32 typeId,
    address acceptor,
    bytes32 acceptorCodehash,
    uint64 admission,
    bytes32[] memory refTypes
  ) internal {
    StoreCore.setRecord(
      _tableId,
      key1(typeId),
      abi.encodePacked(acceptor, acceptorCodehash, admission),
      EncodedLengthsLib.pack(refTypes.length * 32),
      EncodeArray.encode(refTypes),
      _fieldLayout
    );
  }

  function decode(
    bytes memory s,
    bytes memory d
  ) internal pure returns (address acceptor, bytes32 acceptorCodehash, uint64 admission, bytes32[] memory refTypes) {
    acceptor = address(bytes20(Bytes.getBytes32(s, 0)));
    acceptorCodehash = Bytes.getBytes32(s, 20);
    admission = uint64(bytes8(Bytes.getBytes32(s, 52)));
    refTypes = SliceLib.getSubslice(d, 0, d.length).decodeArray_bytes32();
  }

  function _get(
    bytes32 typeId
  ) internal view returns (address acceptor, bytes32 acceptorCodehash, uint64 admission, bytes32[] memory refTypes) {
    (bytes memory s, , bytes memory d) = StoreCore.getRecord(_tableId, key1(typeId), _fieldLayout);
    return decode(s, d);
  }

  function _getAdmission(bytes32 typeId) internal view returns (uint64) {
    return uint64(bytes8(StoreCore.getStaticField(_tableId, key1(typeId), 2, _fieldLayout)));
  }

  function get(
    IStoreRead store,
    bytes32 typeId
  ) internal view returns (address acceptor, bytes32 acceptorCodehash, uint64 admission, bytes32[] memory refTypes) {
    (bytes memory s, , bytes memory d) = store.getRecord(_tableId, key1(typeId), _fieldLayout);
    return decode(s, d);
  }
}

// ---------------------------------------------------------------------------
// Nonces: author -> last accepted nonce
// ---------------------------------------------------------------------------
library Nonces {
  ResourceId constant _tableId = ResourceId.wrap(0x746265667300000000000000000000004e6f6e63657300000000000000000000);
  FieldLayout constant _fieldLayout =
    FieldLayout.wrap(0x0008010008000000000000000000000000000000000000000000000000000000);
  Schema constant _keySchema = KEY_BYTES32;
  Schema constant _valueSchema = KEY_UINT64;

  function getKeyNames() internal pure returns (string[] memory n) {
    n = new string[](1);
    n[0] = "author";
  }

  function getFieldNames() internal pure returns (string[] memory n) {
    n = new string[](1);
    n[0] = "last";
  }

  function _register() internal {
    StoreCore.registerTable(_tableId, _fieldLayout, _keySchema, _valueSchema, getKeyNames(), getFieldNames());
  }

  function _set(bytes32 author, uint64 last) internal {
    StoreCore.setStaticField(_tableId, key1(author), 0, abi.encodePacked(last), _fieldLayout);
  }

  function _get(bytes32 author) internal view returns (uint64) {
    return uint64(bytes8(StoreCore.getStaticField(_tableId, key1(author), 0, _fieldLayout)));
  }

  function get(IStoreRead store, bytes32 author) internal view returns (uint64) {
    return uint64(bytes8(store.getStaticField(_tableId, key1(author), 0, _fieldLayout)));
  }
}

// ---------------------------------------------------------------------------
// Counters: name -> value (the admission high-water mark lives here, not in a raw slot)
// ---------------------------------------------------------------------------
library Counters {
  ResourceId constant _tableId = ResourceId.wrap(0x74626566730000000000000000000000436f756e746572730000000000000000);
  FieldLayout constant _fieldLayout =
    FieldLayout.wrap(0x0008010008000000000000000000000000000000000000000000000000000000);
  Schema constant _keySchema = KEY_BYTES32;
  Schema constant _valueSchema = KEY_UINT64;

  function getKeyNames() internal pure returns (string[] memory n) {
    n = new string[](1);
    n[0] = "name";
  }

  function getFieldNames() internal pure returns (string[] memory n) {
    n = new string[](1);
    n[0] = "value";
  }

  function _register() internal {
    StoreCore.registerTable(_tableId, _fieldLayout, _keySchema, _valueSchema, getKeyNames(), getFieldNames());
  }

  function _set(bytes32 name, uint64 value) internal {
    StoreCore.setStaticField(_tableId, key1(name), 0, abi.encodePacked(value), _fieldLayout);
  }

  function _get(bytes32 name) internal view returns (uint64) {
    return uint64(bytes8(StoreCore.getStaticField(_tableId, key1(name), 0, _fieldLayout)));
  }

  function get(IStoreRead store, bytes32 name) internal view returns (uint64) {
    return uint64(bytes8(store.getStaticField(_tableId, key1(name), 0, _fieldLayout)));
  }
}
