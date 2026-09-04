// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

/// @notice Disposable run codec, not permanent EFS bytes or genesis validation.
library C0RunCodec {
    struct Commitment {
        string label;
        bytes32 digest;
    }

    struct SeedInputs {
        string namespace;
        bytes32 runId;
        Commitment[] sourceCommitments;
        Commitment[] toolchainCommitments;
        bytes32 chainConfigCommitment;
        address deploymentFactoryAddress;
        bytes32 coreCreate2Salt;
        bytes32 byteStoreCreate2Salt;
        bytes32 coreCreationCodeTemplateHash;
        bytes32 byteStoreCreationCodeTemplateHash;
        bytes32 codexConstantsHash;
        bytes32 indexCapabilityRoot;
        bytes32 orderedTypeGroupRoot;
        address schemaAuthorAddress;
        address bootstrapAuthorAddress;
        bytes32 byteMeasurementReportHash;
        uint64 maxStateFileBytes;
        uint64 maxReadRangeBytes;
        uint64 transactionGasMargin;
        uint64 stateGrowthMargin;
        bytes32 destructionPolicyHash;
    }

    struct Deployment {
        bytes32 experimentSeed;
        address coreAddress;
        bytes32 coreCreate2Salt;
        bytes32 coreInitCodeHash;
        bytes32 coreRuntimeCodeHash;
        address byteStoreAddress;
        bytes32 byteStoreCreate2Salt;
        bytes32 byteStoreInitCodeHash;
        bytes32 byteStoreRuntimeCodeHash;
    }
    error InvalidCodec();

    struct Cursor {
        bytes data;
        uint256 pos;
    }
    bytes32 internal constant DOM_EXPERIMENT_SEED = keccak256("efs2/mvp-c0/experiment-seed/1");
    bytes32 internal constant DOM_EXPERIMENT_DEPLOYMENT = keccak256("efs2/mvp-c0/experiment-deployment/1");
    bytes32 internal constant DOM_C0_PROFILE = keccak256("efs2/mvp-c0/profile/1");

    function _check(bool ok) private pure {
        if (!ok) revert InvalidCodec();
    }

    function _validateSeed(SeedInputs memory s) private pure {
        _check(keccak256(bytes(s.namespace)) == keccak256("efs2/mvp-c0/2026-09-03"));
        _check(s.runId != 0 && s.chainConfigCommitment != 0 && s.deploymentFactoryAddress != address(0));
        _check(s.coreCreationCodeTemplateHash != 0 && s.byteStoreCreationCodeTemplateHash != 0);
        _check(s.codexConstantsHash != 0 && s.indexCapabilityRoot != 0 && s.orderedTypeGroupRoot != 0);
        _check(
            s.schemaAuthorAddress != address(0) && s.bootstrapAuthorAddress != address(0)
                && s.schemaAuthorAddress != s.bootstrapAuthorAddress
        );
        _check(s.byteMeasurementReportHash != 0 && s.destructionPolicyHash != 0);
        _check(s.maxStateFileBytes != 0 && s.maxReadRangeBytes != 0 && s.maxReadRangeBytes <= s.maxStateFileBytes);
    }

    function _label(bytes memory label, bytes memory previous) private pure {
        _check(label.length >= 1 && label.length <= 64);
        for (uint256 i; i < label.length; ++i) {
            uint8 c = uint8(label[i]);
            _check(
                c >= 65 && c <= 90 || c >= 97 && c <= 122 || c >= 48 && c <= 57 || c == 46 || c == 95 || c == 47
                    || c == 45
            );
        }
        uint256 n = label.length < previous.length ? label.length : previous.length;
        for (uint256 i; i < n; ++i) {
            if (label[i] != previous[i]) {
                _check(uint8(label[i]) > uint8(previous[i]));
                return;
            }
        }
        _check(label.length > previous.length);
    }

    function _encodeCommitments(Commitment[] memory entries) private pure returns (bytes memory out) {
        _check(entries.length >= 1 && entries.length <= 64);
        out = abi.encodePacked(uint16(entries.length));
        bytes memory previous = "";
        for (uint256 i; i < entries.length; ++i) {
            bytes memory label = bytes(entries[i].label);
            _label(label, previous);
            previous = label;
            _check(entries[i].digest != 0);
            out = bytes.concat(
                out, abi.encodePacked(uint32(2 + label.length + 32), uint16(label.length), label, entries[i].digest)
            );
        }
    }

    function encodeSeed(SeedInputs memory s) internal pure returns (bytes memory) {
        _validateSeed(s);
        return bytes.concat(
            abi.encodePacked(uint16(bytes(s.namespace).length), bytes(s.namespace), s.runId),
            _encodeCommitments(s.sourceCommitments),
            _encodeCommitments(s.toolchainCommitments),
            abi.encodePacked(
                s.chainConfigCommitment, s.deploymentFactoryAddress, s.coreCreate2Salt, s.byteStoreCreate2Salt
            ),
            abi.encodePacked(
                s.coreCreationCodeTemplateHash,
                s.byteStoreCreationCodeTemplateHash,
                s.codexConstantsHash,
                s.indexCapabilityRoot,
                s.orderedTypeGroupRoot
            ),
            abi.encodePacked(s.schemaAuthorAddress, s.bootstrapAuthorAddress, s.byteMeasurementReportHash),
            abi.encodePacked(
                s.maxStateFileBytes,
                s.maxReadRangeBytes,
                s.transactionGasMargin,
                s.stateGrowthMargin,
                s.destructionPolicyHash
            )
        );
    }

    // Width and remaining-length checks precede every read/allocation.
    function _uint(Cursor memory c, uint256 width) private pure returns (uint256 n) {
        _check(width <= 32 && c.pos <= c.data.length && width <= c.data.length - c.pos);
        for (uint256 i; i < width; ++i) {
            n = (n << 8) | uint8(c.data[c.pos++]);
        }
    }

    function _string(Cursor memory c, uint256 max) private pure returns (string memory) {
        uint256 n = _uint(c, 2);
        _check(n <= max && n <= c.data.length - c.pos);
        bytes memory b = new bytes(n);
        for (uint256 i; i < n; ++i) {
            b[i] = c.data[c.pos++];
            _check(uint8(b[i]) < 128);
        }
        return string(b);
    }

    function _decodeCommitments(Cursor memory c) private pure returns (Commitment[] memory entries) {
        uint256 count = _uint(c, 2);
        _check(count >= 1 && count <= 64);
        // Smallest entry frame is 4-byte length + 2-byte label length + label + digest.
        _check(count * 39 <= c.data.length - c.pos);
        entries = new Commitment[](count);
        bytes memory previous = "";
        for (uint256 i; i < count; ++i) {
            uint256 n = _uint(c, 4);
            _check(n >= 35 && n <= 98 && n <= c.data.length - c.pos);
            uint256 end = c.pos + n;
            string memory label = _string(c, 64);
            _label(bytes(label), previous);
            previous = bytes(label);
            bytes32 digest = bytes32(_uint(c, 32));
            _check(digest != 0 && c.pos == end);
            entries[i] = Commitment(label, digest);
        }
    }

    function decodeSeed(bytes memory b) internal pure returns (SeedInputs memory s) {
        Cursor memory c = Cursor(b, 0);
        s.namespace = _string(c, 22);
        _check(keccak256(bytes(s.namespace)) == keccak256("efs2/mvp-c0/2026-09-03"));
        s.runId = bytes32(_uint(c, 32));
        s.sourceCommitments = _decodeCommitments(c);
        s.toolchainCommitments = _decodeCommitments(c);
        s.chainConfigCommitment = bytes32(_uint(c, 32));
        s.deploymentFactoryAddress = address(uint160(_uint(c, 20)));
        s.coreCreate2Salt = bytes32(_uint(c, 32));
        s.byteStoreCreate2Salt = bytes32(_uint(c, 32));
        s.coreCreationCodeTemplateHash = bytes32(_uint(c, 32));
        s.byteStoreCreationCodeTemplateHash = bytes32(_uint(c, 32));
        s.codexConstantsHash = bytes32(_uint(c, 32));
        s.indexCapabilityRoot = bytes32(_uint(c, 32));
        s.orderedTypeGroupRoot = bytes32(_uint(c, 32));
        s.schemaAuthorAddress = address(uint160(_uint(c, 20)));
        s.bootstrapAuthorAddress = address(uint160(_uint(c, 20)));
        s.byteMeasurementReportHash = bytes32(_uint(c, 32));
        s.maxStateFileBytes = uint64(_uint(c, 8));
        s.maxReadRangeBytes = uint64(_uint(c, 8));
        s.transactionGasMargin = uint64(_uint(c, 8));
        s.stateGrowthMargin = uint64(_uint(c, 8));
        s.destructionPolicyHash = bytes32(_uint(c, 32));
        _check(c.pos == b.length);
        _validateSeed(s);
    }

    function seedInputsHash(SeedInputs memory s) internal pure returns (bytes32) {
        return keccak256(encodeSeed(s));
    }

    function experimentSeed(SeedInputs memory s) internal pure returns (bytes32) {
        return keccak256(abi.encode(DOM_EXPERIMENT_SEED, seedInputsHash(s)));
    }

    function _validateDeployment(Deployment memory d) private pure {
        _check(
            d.experimentSeed != 0 && d.coreAddress != address(0) && d.byteStoreAddress != address(0)
                && d.coreAddress != d.byteStoreAddress
        );
        _check(
            d.coreInitCodeHash != 0 && d.coreRuntimeCodeHash != 0 && d.byteStoreInitCodeHash != 0
                && d.byteStoreRuntimeCodeHash != 0
        );
    }

    function encodeDeployment(Deployment memory d) internal pure returns (bytes memory) {
        _validateDeployment(d);
        return abi.encodePacked(
            d.experimentSeed,
            d.coreAddress,
            d.coreCreate2Salt,
            d.coreInitCodeHash,
            d.coreRuntimeCodeHash,
            d.byteStoreAddress,
            d.byteStoreCreate2Salt,
            d.byteStoreInitCodeHash,
            d.byteStoreRuntimeCodeHash
        );
    }

    function decodeDeployment(bytes memory b) internal pure returns (Deployment memory d) {
        _check(b.length == 264);
        Cursor memory c = Cursor(b, 0);
        d.experimentSeed = bytes32(_uint(c, 32));
        d.coreAddress = address(uint160(_uint(c, 20)));
        d.coreCreate2Salt = bytes32(_uint(c, 32));
        d.coreInitCodeHash = bytes32(_uint(c, 32));
        d.coreRuntimeCodeHash = bytes32(_uint(c, 32));
        d.byteStoreAddress = address(uint160(_uint(c, 20)));
        d.byteStoreCreate2Salt = bytes32(_uint(c, 32));
        d.byteStoreInitCodeHash = bytes32(_uint(c, 32));
        d.byteStoreRuntimeCodeHash = bytes32(_uint(c, 32));
        _validateDeployment(d);
    }

    function deploymentHash(Deployment memory d) internal pure returns (bytes32) {
        return keccak256(encodeDeployment(d));
    }

    function experimentCommitment(Deployment memory d) internal pure returns (bytes32) {
        return keccak256(abi.encode(DOM_EXPERIMENT_DEPLOYMENT, d.experimentSeed, deploymentHash(d)));
    }

    function c0ProfileId(bytes32 commitment) internal pure returns (bytes32) {
        _check(commitment != 0);
        return keccak256(abi.encode(DOM_C0_PROFILE, commitment));
    }
}
