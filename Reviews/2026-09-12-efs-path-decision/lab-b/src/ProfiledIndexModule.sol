// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;
import {IndexModule} from "./IndexModule.sol";
import {IndexFieldProfile} from "./IndexFieldProfile.sol";

/// Direct, constructor-only profile. Helpers are deployed from exact reviewed
/// bytecode, not trusted solely because they implement the same ABI.
contract ProfiledIndexModule is IndexModule {
    IndexFieldProfile private immutable _profile;
    bytes32 public immutable fieldProfileCodehash;

    constructor(address core, IndexFieldProfile.Spec[] memory specs) IndexModule(core) {
        _profile = new IndexFieldProfile(specs);
        fieldProfileCodehash = address(_profile).codehash;
    }

    function fieldProfile() public view override returns (IndexFieldProfile) {
        if (address(_profile).codehash != fieldProfileCodehash) revert E_FIELD();
        return _profile;
    }
}
