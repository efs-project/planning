// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

/*
 * The corrected Store-only boundary (road-c-review finding 1).
 *
 * Choice: StoreRead + StoreCore COMPOSITION, not `is Store`.
 *   - `Store` is `IStore` = IStoreKernel (IStoreRead + IStoreWrite + …) + IStoreRegistration.
 *     Inheriting it would force this contract to implement 10 raw write selectors and
 *     3 registration selectors (as reverts) and to advertise them in its ABI.
 *   - Composition inherits only `StoreRead` (12 IStoreRead view selectors) and calls the
 *     `StoreCore` library internally. The vendored Store therefore contributes NO external
 *     write or registration path; the only state-changing selectors are the ones the
 *     derived contract declares (Ledger: publishNative/publishSigned; IndexModule:
 *     onPublication/attach). See README "External selector inventory".
 *   - Initialization mirrors StoreKernel's constructor (StoreCore.initialize → StoreSwitch
 *     points at self) and World's InitModule (StoreCore.registerInternalTables registers the
 *     `store` namespace's Tables/ResourceIds/StoreHooks so log-driven indexers can decode
 *     our tables), then registers the derived contract's EFS tables.
 *   - No StoreHook is ever registered (there is no registerStoreHook path), so the per-write
 *     hook lookup in StoreCore.setRecord (StoreHooks._get) always finds an empty list.
 *
 * Denying raw writes is necessary, not sufficient: acceptance/index/authority semantics
 * live in the derived entrypoints (Ledger.sol), and their bypass tests are in test/.
 */

import { StoreRead } from "@latticexyz/store/src/StoreRead.sol";
import { StoreCore } from "@latticexyz/store/src/StoreCore.sol";
import { IStoreEvents } from "@latticexyz/store/src/IStoreEvents.sol";
import { STORE_VERSION } from "@latticexyz/store/src/version.sol";

abstract contract EfsStoreCore is StoreRead, IStoreEvents {
  constructor() {
    StoreCore.initialize();
    StoreCore.registerInternalTables();
    emit HelloStore(STORE_VERSION);
    _registerEfsTables();
  }

  /// Derived contracts register their EFS tables here (called once from the constructor).
  function _registerEfsTables() internal virtual;

  /// Kept for indexer compatibility (IStoreKernel.storeVersion); read-only.
  function storeVersion() external pure returns (bytes32) {
    return STORE_VERSION;
  }
}
