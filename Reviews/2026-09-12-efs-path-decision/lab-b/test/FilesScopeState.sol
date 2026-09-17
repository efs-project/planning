// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;
import {Ledger} from "../src/Ledger.sol";
import {Keys} from "../src/Keys.sol";

/// Physical companion of one mandatory index, never an independently qualified
/// index. Its fixed writer forwards the canonical shared live/replay effect.
contract FilesScopeState {
    bytes32 private constant FOLDER = keccak256("efs2/purpose/folder/1");
    Ledger public immutable ledger;
    address public immutable writer;
    mapping(bytes32 => uint64[]) private _live;
    mapping(uint64 => uint256) private _offsetPlusOne;
    mapping(bytes32 => uint64) public lastMutation;
    error E_WRITER();

    constructor(address source) { ledger = Ledger(source); writer = msg.sender; }

    function fold(uint8 kind, uint64 ordinal, bytes32 scopeKey, uint64 admission) external {
        if (msg.sender != writer) revert E_WRITER();
        (bytes32 purpose,,) = ledger.positionCell(ledger.bindingPosition(ordinal));
        if (purpose != FOLDER) return;
        bytes32 key = Keys.scopeList(scopeKey);
        // Every BIND/MASK/RELEASE is a change, including mask-to-release and
        // empty/terminal scopes. Never delete this stamp on removal.
        lastMutation[key] = admission;
        uint64[] storage active = _live[key];
        uint256 oneBased = _offsetPlusOne[ordinal];
        if (kind == 3) {
            if (oneBased == 0) { active.push(ordinal); _offsetPlusOne[ordinal] = active.length; }
        } else if (oneBased != 0) {
            uint256 removed = oneBased - 1;
            uint256 last = active.length - 1;
            if (removed != last) {
                uint64 moved = active[last]; active[removed] = moved; _offsetPlusOne[moved] = oneBased;
            }
            active.pop(); delete _offsetPlusOne[ordinal];
        }
    }
    function liveCount(bytes32 key) external view returns(uint64) { return uint64(_live[key].length); }
    function liveAt(bytes32 key, uint64 i) external view returns(uint64) { return _live[key][i]; }
}
