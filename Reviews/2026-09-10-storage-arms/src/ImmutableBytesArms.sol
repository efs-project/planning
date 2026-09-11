// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

error Missing();
error TooLarge();
error InvalidPayload();
error Unauthorized();
error ReferenceConflict();

interface IBytesArm {
    function put(bytes calldata body) external returns (bytes32 id);
    function read(bytes32 id) external view returns (bytes memory);
}

contract StateBytes is IBytesArm {
    struct Entry {
        bytes body;
        uint256 length;
        bytes32 contentHash;
        bool exists;
    }
    uint256 private sequence;
    mapping(bytes32 => Entry) private entries;

    function put(bytes calldata body) external returns (bytes32 id) {
        if (body.length > 24575) revert TooLarge();
        id = bytes32(++sequence);
        entries[id] = Entry(body, body.length, keccak256(body), true);
    }

    function read(bytes32 id) external view returns (bytes memory body) {
        Entry storage e = entries[id];
        if (!e.exists) revert Missing();
        body = e.body;
        if (body.length != e.length || keccak256(body) != e.contentHash) revert InvalidPayload();
    }
}

struct Descriptor {
    address pointer;
    uint32 length;
    bytes32 contentHash;
    bytes32 codeHash;
}

contract CodeBytes is IBytesArm {
    uint256 private sequence;
    mapping(bytes32 => Descriptor) internal descriptors;

    function put(bytes calldata body) external virtual returns (bytes32 id) {
        id = bytes32(++sequence);
        descriptors[id] = _deploy(body);
    }

    function descriptor(bytes32 id) public view returns (Descriptor memory d) {
        d = descriptors[id];
        if (d.pointer == address(0)) revert Missing();
    }

    function read(bytes32 id) external view returns (bytes memory) {
        return _checked(descriptor(id));
    }

    // The id supplies the trusted descriptor; callers cannot replace its address,
    // even with identical runtime code at another address.
    function readAt(bytes32 id, address pointer) external view returns (bytes memory) {
        Descriptor memory d = descriptor(id);
        if (pointer != d.pointer) revert InvalidPayload();
        return _checked(d);
    }

    function _deploy(bytes calldata body) internal returns (Descriptor memory d) {
        // EIP-170: STOP prefix consumes one of the 24,576 runtime bytes.
        if (body.length > 24575) revert TooLarge();
        bytes memory runtime = bytes.concat(hex"00", body);
        // 12-byte init program: PUSH2 size DUP1 PUSH1 12 PUSH1 0 CODECOPY PUSH1 0 RETURN.
        bytes memory initcode = bytes.concat(hex"61", bytes2(uint16(runtime.length)), hex"80600c6000396000f3", runtime);
        // EIP-3860 limit; at this runtime cap the largest initcode is only 24,588 bytes.
        if (initcode.length > 49152) revert TooLarge();
        address pointer;
        assembly ("memory-safe") { pointer := create(0, add(initcode, 32), mload(initcode)) }
        if (pointer == address(0)) revert InvalidPayload();
        d = Descriptor(pointer, uint32(body.length), keccak256(body), keccak256(runtime));
        _checked(d);
    }

    function _checked(Descriptor memory d) internal view returns (bytes memory body) {
        address pointer = d.pointer;
        if (
            pointer == address(0) || d.length > 24575 || pointer.code.length != uint256(d.length) + 1
                || pointer.codehash != d.codeHash
        ) revert InvalidPayload();
        // Check size before EXTCODECOPY: it pads missing code with zeros.
        bytes memory prefix = new bytes(1);
        body = new bytes(d.length);
        assembly ("memory-safe") {
            extcodecopy(pointer, add(prefix, 32), 0, 1)
            extcodecopy(pointer, add(body, 32), 1, mload(body))
        }
        if (prefix[0] != 0 || keccak256(body) != d.contentHash) revert InvalidPayload();
    }
}

contract DedupBytes is CodeBytes {
    struct Reference {
        bytes32 id;
        bool exists;
    }
    mapping(bytes32 => Reference) private references;

    function put(bytes calldata body) external override returns (bytes32 id) {
        if (body.length > 24575) revert TooLarge();
        id = keccak256(body);
        Descriptor memory d = descriptors[id];
        if (d.pointer == address(0)) {
            descriptors[id] = _deploy(body);
        } else {
            if (d.length != body.length || d.contentHash != id) revert InvalidPayload();
            _checked(d);
        }
    }

    // Content is permissionless. Reference authority is separate and publisher-only.
    // revision is an immutable exact revision/tree commitment, never a mutable file name.
    function putReference(address publisher, bytes32 revision, uint256 position, bytes32 id)
        external
        returns (bytes32 key)
    {
        if (msg.sender != publisher) revert Unauthorized();
        _checked(descriptor(id));
        key = keccak256(abi.encode(publisher, revision, position));
        Reference storage ref = references[key];
        if (ref.exists) {
            if (ref.id != id) revert ReferenceConflict();
        } else {
            ref.id = id;
            ref.exists = true;
        }
    }

    function referenceId(address publisher, bytes32 revision, uint256 position) public view returns (bytes32) {
        Reference storage ref = references[keccak256(abi.encode(publisher, revision, position))];
        if (!ref.exists) revert Missing();
        return ref.id;
    }

    function readReference(address publisher, bytes32 revision, uint256 position) external view returns (bytes memory) {
        return _checked(descriptor(referenceId(publisher, revision, position)));
    }
}
