// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {C0PlanCodec} from "./C0PlanCodec.sol";
import {StateKernel} from "./StateKernel.sol";

library C0BatchEvidence {
    error UnsupportedBranch(uint8 branch);
    error InvalidEvidenceFraming();

    struct Evidence {
        uint8 branch;
        bytes descriptor;
        C0PlanCodec.Plan plan;
        C0PlanCodec.Effects effects;
        StateKernel.ExpectedRevision[] expectedRevisions;
        bytes witness;
        address actualSigner;
        address submittingCaller;
        address transactionOrigin;
        bytes observedAccountCode;
        uint64 admittedAtTimestamp;
        uint64 previousSequence;
    }

    function encode(Evidence memory evidence) internal pure returns (bytes memory) {
        if (evidence.branch != 1 && evidence.branch != 2) revert UnsupportedBranch(evidence.branch);
        if (
            evidence.descriptor.length != 22 || evidence.descriptor[0] != bytes1(0x01)
                || evidence.descriptor[1] != bytes1(0x00)
        ) revert InvalidEvidenceFraming();
        if (
            (evidence.branch == 1 && evidence.witness.length != 65)
                || (evidence.branch == 2 && evidence.witness.length != 0)
        ) {
            revert InvalidEvidenceFraming();
        }
        uint256 codeLength = evidence.observedAccountCode.length;
        if (evidence.branch == 2 && codeLength != 0) revert InvalidEvidenceFraming();
        if (
            evidence.branch == 1 && codeLength != 0
                && (codeLength != 23
                    || evidence.observedAccountCode[0] != bytes1(0xef)
                    || evidence.observedAccountCode[1] != bytes1(0x01)
                    || evidence.observedAccountCode[2] != bytes1(0x00))
        ) revert InvalidEvidenceFraming();

        C0PlanCodec.expectedRevisionsHash(evidence.expectedRevisions);
        bytes memory revisions = abi.encodePacked(uint8(evidence.expectedRevisions.length));
        for (uint256 i; i < evidence.expectedRevisions.length; ++i) {
            revisions = bytes.concat(
                revisions,
                abi.encodePacked(evidence.expectedRevisions[i].leafIndex, evidence.expectedRevisions[i].revision)
            );
        }
        bytes memory tail = abi.encodePacked(
            evidence.actualSigner,
            evidence.submittingCaller,
            evidence.transactionOrigin,
            // Length is structurally restricted to zero or 23 above.
            // forge-lint: disable-next-line(unsafe-typecast)
            uint8(codeLength),
            evidence.observedAccountCode,
            evidence.admittedAtTimestamp,
            evidence.previousSequence
        );
        return bytes.concat(
            abi.encodePacked(uint16(1), evidence.branch),
            evidence.descriptor,
            C0PlanCodec.encodePlan(evidence.plan),
            C0PlanCodec.encodeEffects(evidence.effects),
            revisions,
            evidence.witness,
            tail
        );
    }
}
