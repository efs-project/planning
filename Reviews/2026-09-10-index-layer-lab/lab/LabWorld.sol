// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;
// Index-layer lab, round 2: the FRESH-WORLD arm. A U1 read-profile core whose
// `initialize` selects the Store's scope layout (Codex's K10 patch:
// `StateKernel.selectScopeLayout(s, mode)` is legal only BEFORE
// `StateKernel.initialize` on an all-zero Store) and then initializes — the
// same call sequence as Codex's `K10ScopeHarness` constructor. The mode is an
// immutable of the implementation, chosen at deployment; it is never inferred.
// Everything else (factory, carrier, helper, libraries) is the foundation
// compiled against the lab's PATCHED `src/`, imported here so forge emits the
// artifacts the JS deployer (`scripts/lab-world.mjs`) needs.
// Disposable local prototype code; no protocol freeze or production claim.

import {StateKernel} from "C0Core/StateKernel.sol";
import {Preparation} from "C0Core/Preparation.sol";
import {PreparationHelper} from "C0Core/PreparationHelper.sol";
import {UpgradeStorage} from "Foundation/UpgradeStorage.sol";
import {UpgradeableReadFixtureCore, UpgradeableReadFixtureCoreU2} from "Foundation/UpgradeableReadFixtureCore.sol";
import {UpgradeableFixtureCarrier, UpgradeableFixtureCarrierU2} from "Foundation/UpgradeableFixtureCarrier.sol";
import {FixtureDeployment} from "./FixtureDeployment.sol";

contract UpgradeableReadFixtureCoreK10 is UpgradeableReadFixtureCore {
    uint256 public immutable selectedScopeLayout;

    constructor(address factory, address helper, bytes32 pointReadHash, bytes32 queryReadHash, uint256 mode)
        UpgradeableReadFixtureCore(factory, helper, pointReadHash, queryReadHash)
    {
        if (mode > 1) revert StateKernel.InvalidScopeLayout(mode);
        selectedScopeLayout = mode;
    }

    /// The seam: select the layout, THEN initialize (fresh Store only).
    function initialize(
        address controller,
        address peer,
        address admin,
        address operator,
        bytes32 treeType,
        StateKernel.Init calldata init
    ) external override {
        _initialize(controller, peer, admin, operator, treeType);
        StateKernel.selectScopeLayout(UpgradeStorage.efs(), selectedScopeLayout);
        StateKernel.initialize(UpgradeStorage.efs(), init, Preparation.Config(preparationHelper, preparationCodehash));
    }

    /// Full-word getter (Codex: "a comparison host must expose and pin the mode").
    function scopeLayout() external view returns (uint256) {
        return UpgradeStorage.efs().scopeLayout;
    }
}

// The imports above (PreparationHelper, UpgradeableReadFixtureCoreU2,
// UpgradeableFixtureCarrier/U2, FixtureDeployment and, through it, the OZ
// TransparentUpgradeableProxy / ProxyAdmin) are what makes forge emit those
// artifacts into the lab's out/; the deployer reads them from there.
