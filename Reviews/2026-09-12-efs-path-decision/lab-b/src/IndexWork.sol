// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

/// Immutable, conservative work envelope, not module-requested gas. Bounded total
/// maximum of 250k+150k*64. Storage work may still exceed this
/// allowance or the independent 15M transaction venue; no universal64-leaf claim.
library IndexWork {
    uint256 internal constant BASE = 250_000;
    uint256 internal constant ACTION = 150_000;
    uint256 internal constant REFERENCE = 30_000;
    uint256 internal constant DECLARATION = 35_000;
    uint256 internal constant BODY_WORD = 100;
    uint256 internal constant MAXIMUM = 9_850_000;
    bytes32 internal constant PROFILE = keccak256(
        "efs.lab.index-work/1:base250000:action150000:ref30000:decl35000:bodyword100:bodywords256:max9850000:shared-prefix-final"
    );
}
