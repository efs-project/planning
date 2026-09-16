// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;
import {FilesCarrierIndex} from "./FilesCarrierProfile.sol";
import {IndexFieldProfile} from "../src/IndexFieldProfile.sol";

/// Same mandatory Carrier/Directory/Names path, plus the one reviewed descriptor
/// digest and scalar profile. Word5 is stored/ciphertext SHA256; plaintext word10
/// is deliberately not declared, including for encrypted descriptors.
contract ProfiledFilesIndex is FilesCarrierIndex {
    IndexFieldProfile private immutable _profile;
    bytes32 public immutable fieldProfileCodehash;

    constructor(address c, bytes32[8] memory legacy, bytes32[5] memory ts, bytes32[5] memory hs)
        FilesCarrierIndex(c, legacy, ts, hs)
    {
        IndexFieldProfile.Spec[] memory specs = new IndexFieldProfile.Spec[](1);
        specs[0].typeId = ts[1];
        specs[0].scalars = new IndexFieldProfile.Scalar[](1);
        specs[0].scalars[0] = IndexFieldProfile.Scalar(2, 4);
        specs[0].digest = IndexFieldProfile.Digest(true, 5, 3, bytes32(uint256(1)));
        _profile = new IndexFieldProfile(specs);
        fieldProfileCodehash = address(_profile).codehash;
    }

    function fieldProfile() public view override returns (IndexFieldProfile) {
        if (address(_profile).codehash != fieldProfileCodehash) revert E_FIELD();
        return _profile;
    }
}
