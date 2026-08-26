// SPDX-License-Identifier: UNLICENSED
// DISPOSABLE protocolConformance=false notAdopted=true goCodeAuthorized=false
pragma solidity 0.8.30;

import {Consumers} from "./Consumers.sol";

// Effectful immutable consumer: equip/treasury state machine with atomic
// multi-leaf writes, compare-and-swap revisions, idempotent receipts, a Realm
// admission policy, and both a naive and a guarded external-validator path
// (the EAS_LIKE negative control).

interface IValidator {
    function validate(bytes32 typeId, bytes calldata body) external returns (bool);
}

contract EquipTreasury {
    Consumers public immutable consumer;

    struct Slot {
        uint64 rev;
        bytes32 item;
        bool set;
    }

    // character => slot => state
    mapping(bytes32 => mapping(uint256 => Slot)) public slots;
    // idempotency: keccak(char,slot,expectedRev) => receipt id (0 = none)
    mapping(bytes32 => bytes32) public receipts;
    bool private _entered;

    event Equipped(bytes32 indexed character, uint256 slot, bytes32 item, uint64 newRev, bytes32 receiptId);

    error CasConflict();
    error PolicyDenied();
    error LeafFailed();
    error Reentrancy();

    constructor(Consumers c) {
        consumer = c;
    }

    modifier nonReentrant() {
        if (_entered) revert Reentrancy();
        _entered = true;
        _;
        _entered = false;
    }

    // atomic: writes the slot AND an inventory leaf; if failLeaf, revert whole action.
    function equip(
        bytes32 character,
        uint256 slot,
        bytes32 item,
        uint64 expectedRev,
        bool policyForbids,
        bool failLeaf
    ) external nonReentrant returns (bytes32 receiptId) {
        bytes32 key = keccak256(abi.encode(character, slot, expectedRev));
        // idempotent replay: if this exact (char,slot,expectedRev) already produced
        // a receipt, return it without a second effect.
        if (receipts[key] != bytes32(0)) {
            return receipts[key];
        }
        Slot storage s = slots[character][slot];
        if (s.rev != expectedRev) revert CasConflict();
        if (policyForbids) revert PolicyDenied();
        // leaf 1: slot write (staged), leaf 2: inventory. Atomic: revert undoes leaf 1.
        s.rev = expectedRev + 1;
        s.item = item;
        s.set = true;
        if (failLeaf) revert LeafFailed(); // reverts the whole tx: slot write rolled back
        receiptId = keccak256(abi.encode("RECEIPT", key, item));
        receipts[key] = receiptId;
        emit Equipped(character, slot, item, s.rev, receiptId);
    }

    // naive EAS_LIKE path: trusts an external validator's boolean, no guards.
    function equipViaValidatorNaive(address validator, bytes32 typeId, bytes calldata body, bytes32 character, uint256 slot, bytes32 item)
        external
        returns (bool ok)
    {
        ok = IValidator(validator).validate(typeId, body); // unbounded gas, trusts returndata, reentrant
        if (ok) {
            Slot storage s = slots[character][slot];
            s.rev += 1;
            s.item = item;
            s.set = true;
        }
    }

    // guarded path: bounded gas, capped returndata, no reentrancy, no state trust.
    function equipViaValidatorGuarded(address validator, bytes32 typeId, bytes calldata body)
        external
        nonReentrant
        returns (bool ok, bytes32 diag)
    {
        bytes memory cd = abi.encodeWithSelector(IValidator.validate.selector, typeId, body);
        uint256 gasCap = 100_000;
        bool success;
        uint256 outLen;
        bytes32 first;
        assembly {
            success := staticcall(gasCap, validator, add(cd, 32), mload(cd), 0, 0)
            outLen := returndatasize()
            if gt(outLen, 32) { outLen := 32 } // cap returndata copy: bomb cannot blow memory
            returndatacopy(0, 0, outLen)
            first := mload(0)
        }
        if (!success) return (false, "CALLBACK_REVERTED");
        if (outLen < 32) return (false, "CALLBACK_MALFORMED");
        // NOTE: even a truthful bool from an external validator is not accepted as
        // EFS authority here; the guarded consumer still requires an exact-Type or
        // pinned-binding decision. The boolean is advisory only.
        return (first != bytes32(0), bytes32(0));
    }
}

// ---- malicious validators (attack fixtures) --------------------------------
contract HonestValidator is IValidator {
    function validate(bytes32, bytes calldata) external pure returns (bool) {
        return true;
    }
}

contract Reverter is IValidator {
    function validate(bytes32, bytes calldata) external pure returns (bool) {
        revert("no");
    }
}

contract GasGriefer is IValidator {
    function validate(bytes32, bytes calldata) external pure returns (bool) {
        uint256 x;
        for (uint256 i = 0; i < type(uint256).max; i++) {
            x += i; // burn all gas
        }
        return x == 0;
    }
}

contract ReturndataBomb is IValidator {
    function validate(bytes32, bytes calldata) external pure returns (bool) {
        assembly {
            return(0, 0x100000) // 1MB returndata bomb
        }
    }
}

contract Reenterer is IValidator {
    EquipTreasury public target;
    bytes public body;

    function set(EquipTreasury t) external {
        target = t;
    }

    function validate(bytes32, bytes calldata) external returns (bool) {
        // try to reenter the guarded path
        target.equipViaValidatorGuarded(address(this), bytes32(0), body);
        return true;
    }
}

contract MutableValidator is IValidator {
    bool public answer = true;

    function flip() external {
        answer = !answer;
    }

    function validate(bytes32, bytes calldata) external view returns (bool) {
        return answer; // answer changes across time: historical reinterpretation
    }
}
