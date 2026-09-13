// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

/*
 * Unrelated Solidity consumer for the paid-read rows. It is not the producer, not an
 * admin, holds no privileged path and imports no candidate implementation library:
 * it uses LensReader's public read ABI (struct types only) and the vendored IStoreRead
 * interface, with the Records table coordinate pinned as a literal (see README).
 * Its decoder is written here, not borrowed from the Ledger.
 */

import { IStoreRead } from "@latticexyz/store/src/IStoreRead.sol";
import { ResourceId } from "@latticexyz/store/src/ResourceId.sol";
import { LensReader } from "./LensReader.sol";

contract QuoteConsumer {
  // Pinned public coordinates (README "Fixture coordinates"), not imported from the candidate.
  ResourceId internal constant RECORDS_TABLE =
    ResourceId.wrap(0x746265667300000000000000000000005265636f726473000000000000000000);
  bytes32 internal constant PURPOSE_HEAD = keccak256("efs2/lab-c/purpose/head");

  event Consumed(bytes32 indexed subject, bytes32 recordId, uint256 mantissa, bytes32 selectedBy, uint8 status);

  error NotSelected(uint8 status);
  error BadShape(uint256 payloadLength);

  /// Paid transaction: Lens-selected head of `subject`, then a bounded MUD field read of the body.
  function consume(
    LensReader reader,
    IStoreRead ledger,
    LensReader.Lens calldata lens,
    bytes32 subject
  ) external returns (bytes32 recordId, uint256 mantissa) {
    LensReader.Resolution memory r = reader.resolve(lens, PURPOSE_HEAD, subject, bytes32(0));
    if (r.status != 1) revert NotSelected(r.status); // 1 == P_FOUND; CONFLICT/ABSENT expose no fabricated quote
    recordId = r.target;
    bytes32[] memory key = new bytes32[](1);
    key[0] = recordId;
    bytes memory body = ledger.getDynamicField(RECORDS_TABLE, key, 0);
    (, bytes memory payload) = abi.decode(body, (bytes32[], bytes));
    if (payload.length != 128) revert BadShape(payload.length);
    (mantissa, , , ) = abi.decode(payload, (uint256, uint8, uint64, bytes32));
    emit Consumed(subject, recordId, mantissa, r.selectedBy, r.status);
  }
}
