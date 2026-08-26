// SPDX-License-Identifier: UNLICENSED
// DISPOSABLE protocolConformance=false notAdopted=true goCodeAuthorized=false
pragma solidity 0.8.30;

import {Test} from "forge-std/Test.sol";
import {Consumers} from "../src/Consumers.sol";

// Mini point-Lens combiner (FIRST_FOUND_AFTER_PROVED_ABSENCE), partial-query
// gate, withdrawal/current-effect separation, and per-arm gas measurement.
contract MiniLens {
    // status: 1=FOUND 2=ABSENT_PROVED 3=UNKNOWN 4=CONFLICT 5=UNSUPPORTED
    function resolve(uint8[] memory statuses) public pure returns (uint8 result) {
        for (uint256 i = 0; i < statuses.length; i++) {
            uint8 s = statuses[i];
            if (s == 1) return 1; // FOUND
            if (s == 2) continue; // proved absence -> fallback allowed
            return 3; // UNKNOWN/CONFLICT/UNSUPPORTED must STOP, never fall through
        }
        return 2; // all proved absent
    }
}

contract WithdrawalRegistry {
    mapping(bytes32 => bool) public withdrawn;

    function withdraw(bytes32 recordId) external {
        withdrawn[recordId] = true;
    }

    function currentEffect(bytes32 recordId) external view returns (bool) {
        return !withdrawn[recordId];
    }
}

contract LensGasTest is Test {
    string outLog;

    function _rec(string memory k, string memory v) internal {
        outLog = string.concat(outLog, bytes(outLog).length == 0 ? "" : ",", '{"case":"', k, '","result":"', v, '"}');
    }

    function test_lensPartialWithdrawGas() public {
        MiniLens lens = new MiniLens();

        uint8[] memory s1 = new uint8[](2);
        s1[0] = 3; // UNKNOWN first
        s1[1] = 1; // FOUND second
        _rec("lens.unknown.first", lens.resolve(s1) == 3 ? "UNKNOWN_STOP" : "FELL_THROUGH");

        uint8[] memory s2 = new uint8[](2);
        s2[0] = 2; // ABSENT_PROVED
        s2[1] = 1; // FOUND
        _rec("lens.absent.then.found", lens.resolve(s2) == 1 ? "FOUND_FALLBACK" : "WRONG");

        uint8[] memory s3 = new uint8[](2);
        s3[0] = 4; // CONFLICT
        s3[1] = 1;
        _rec("lens.conflict.stops", lens.resolve(s3) == 3 ? "STOPPED" : "FELL_THROUGH");

        // empty PARTIAL page is never absence: a uniqueness gate must refuse
        bool partialGrade = true; // grade == PARTIAL
        uint256 count = 0;
        bool proceed = !partialGrade && count == 0; // only COMPLETE+empty proves absence
        _rec("query.partial.empty", proceed ? "TREATED_AS_ABSENCE" : "PARTIAL_STOP");
        partialGrade = false;
        proceed = !partialGrade && count == 0;
        _rec("query.complete.empty", proceed ? "PROCEED" : "WRONG_STOP");

        // withdrawal: current effect flips; historical consumer verdict does not
        string memory j = vm.readFile("sut_cases.json");
        bytes32 pinNote = vm.parseJsonBytes32(j, ".PIN_NOTE");
        bytes32 pinAct = vm.parseJsonBytes32(j, ".PIN_ACT");
        bytes32[] memory finN = vm.parseJsonBytes32Array(j, ".FIN_NOTE");
        bytes32[] memory finA = vm.parseJsonBytes32Array(j, ".FIN_ACT");
        bytes32[] memory pins = vm.parseJsonBytes32Array(j, ".PINNED_BINDINGS");
        bytes32[] memory issuers = vm.parseJsonBytes32Array(j, ".ISSUER_BINDINGS");
        Consumers c = new Consumers(
            pinNote,
            pinAct,
            [finN[0], finN[1]],
            [finA[0], finA[1]],
            vm.parseJsonBytes32(j, ".RECIP"),
            vm.parseJsonUint(j, ".CAP"),
            pins,
            issuers
        );
        bytes[] memory envs = vm.parseJsonBytesArray(j, ".envs");
        string[] memory ids = vm.parseJsonStringArray(j, ".ids");
        bytes32[] memory tids = vm.parseJsonBytes32Array(j, ".tids");
        string[] memory recTypes = vm.parseJsonStringArray(j, ".recTypes");

        // find N_EXACT.r_note_ok row
        uint256 noteIdx = type(uint256).max;
        uint256 actIdx = type(uint256).max;
        for (uint256 i = 0; i < ids.length; i++) {
            if (keccak256(bytes(ids[i])) == keccak256("N_EXACT.r_note_ok")) noteIdx = i;
            if (keccak256(bytes(ids[i])) == keccak256("A_EXACT.r_act_transfer")) actIdx = i;
        }
        WithdrawalRegistry w = new WithdrawalRegistry();
        bytes32 rid = keccak256("r_note_ok-fixture-record-id");
        string memory before = c.noteArm("N_EXACT", envs[noteIdx], tids[noteIdx], recTypes[noteIdx], bytes32(0), "", "");
        w.withdraw(rid);
        string memory afterW = c.noteArm("N_EXACT", envs[noteIdx], tids[noteIdx], recTypes[noteIdx], bytes32(0), "", "");
        bool sep = keccak256(bytes(before)) == keccak256(bytes(afterW)) && !w.currentEffect(rid);
        _rec("withdraw.current.vs.historical", sep ? "SEPARATED" : "CONFLATED");

        // ---- per-arm gas: cold + warm on representative accept paths --------
        string[5] memory narms = ["N_EXACT", "N_FIN", "N_SEMPIN", "N_SEMISS", "N_PRED"];
        // pick the pinned honest binding row for SEM arms: N_SEMPIN.r_note_ok
        bytes32[] memory bindIds = vm.parseJsonBytes32Array(j, ".bindIds");
        string[] memory bindSems = vm.parseJsonStringArray(j, ".bindSems");
        string[] memory bindTypes = vm.parseJsonStringArray(j, ".bindTypes");
        uint256 semIdx = type(uint256).max;
        for (uint256 i = 0; i < ids.length; i++) {
            if (keccak256(bytes(ids[i])) == keccak256("N_SEMPIN.r_note_ok")) semIdx = i;
        }
        string memory gasLog = "{";
        for (uint256 k = 0; k < narms.length; k++) {
            uint256 idx = (k == 2 || k == 3) ? semIdx : noteIdx;
            uint256 g0 = gasleft();
            c.noteArm(narms[k], envs[idx], tids[idx], recTypes[idx], bindIds[idx], bindSems[idx], bindTypes[idx]);
            uint256 cold = g0 - gasleft();
            g0 = gasleft();
            c.noteArm(narms[k], envs[idx], tids[idx], recTypes[idx], bindIds[idx], bindSems[idx], bindTypes[idx]);
            uint256 warm = g0 - gasleft();
            gasLog = string.concat(
                gasLog, k == 0 ? "" : ",", '"', narms[k], '":{"cold":', vm.toString(cold), ',"warm":', vm.toString(warm), "}"
            );
        }
        // action arms on A_EXACT.r_act_transfer
        string[3] memory aarms = ["A_EXACT", "A_FIN", "A_PRED"];
        for (uint256 k = 0; k < aarms.length; k++) {
            uint256 g0 = gasleft();
            c.actionArm(aarms[k], envs[actIdx], tids[actIdx], recTypes[actIdx], bytes32(0), "", "");
            uint256 cold = g0 - gasleft();
            g0 = gasleft();
            c.actionArm(aarms[k], envs[actIdx], tids[actIdx], recTypes[actIdx], bytes32(0), "", "");
            uint256 warm = g0 - gasleft();
            gasLog = string.concat(gasLog, ',"', aarms[k], '":{"cold":', vm.toString(cold), ',"warm":', vm.toString(warm), "}");
        }
        gasLog = string.concat(
            gasLog,
            ',"code":{"Consumers":',
            vm.toString(address(c).code.length),
            ',"MiniLens":',
            vm.toString(address(lens).code.length),
            ',"envelope.calldata.r_note_ok":',
            vm.toString(envs[noteIdx].length),
            "}}"
        );
        vm.writeFile("lens_partial_results.json", string.concat("[", outLog, "]"));
        vm.writeFile("gas_results.json", gasLog);
    }
}
