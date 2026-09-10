// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

library AT {
    struct Rule {
        bytes32 codeHash;
        bytes32 semanticConfig;
        uint8 mode;
        uint32 gasLimit;
    }

    struct Item {
        bytes32 typeId;
        bytes32 activationId;
        bytes body;
        uint256 value;
    }

    struct Plan {
        address author;
        address executor;
        uint256 nonce;
        uint256 deadline;
        Item[] items;
    }

    struct TypeInfo {
        bool exists;
        bytes32 descriptor;
        bytes kinds;
        bytes32 ruleId;
        Rule rule;
    }

    struct Activation {
        bool exists;
        bytes32 typeId;
        address hook;
        bytes32 localConfig;
    }

    struct Receipt {
        bool accepted;
        address author;
        bytes32 typeId;
        bytes32 bodyHash;
        bytes32 ruleId;
        bytes32 activationId;
        bytes32 basis;
        bytes32 planId;
        uint256 index;
        uint256 blockNumber;
        uint256 chainId;
        address core;
        address submitter;
    }

    struct Context {
        address author;
        address submitter;
        bytes32 typeId;
        bytes32 bodyHash;
        bytes32 activationId;
        bytes32 planId;
        uint256 index;
    }
}

interface IAcceptanceHook {
    function binding() external view returns (address core, bytes32 semanticConfig, bytes32 localConfig);
    function accept(AT.Context calldata context, bytes calldata body)
        external
        payable
        returns (bytes32 magic, bytes32 basis);
}

interface IAcceptanceRead {
    function getReceipt(bytes32 id) external view returns (AT.Receipt memory);
    function getBody(bytes32 id) external view returns (bytes memory);
    function getActivation(bytes32 id) external view returns (AT.Activation memory);
}
