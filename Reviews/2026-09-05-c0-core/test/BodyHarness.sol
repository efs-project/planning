// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {TypeGroupParser} from "C0Admission/TypeGroupParser.sol";
import {RecordBody} from "../src/RecordBody.sol";

contract BodyHarness {
    function validate(TypeGroupParser.SchemaCache memory schema, bytes memory body)
        external
        pure
        returns (RecordBody.CheckedBody memory)
    {
        return RecordBody.validate(schema, body);
    }
}

// Pure, test-only descriptor fixtures; these are not admitted Types.
contract LiteralSchemaHarness {
    function parseLiteral(bytes memory groupBytes) external pure returns (TypeGroupParser.SchemaCache memory) {
        (, TypeGroupParser.SchemaCache[] memory schemas) = TypeGroupParser.parse(groupBytes, new bytes32[](0));
        return schemas[0];
    }
}
