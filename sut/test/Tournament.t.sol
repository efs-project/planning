// SPDX-License-Identifier: UNLICENSED
// DISPOSABLE protocolConformance=false notAdopted=true goCodeAuthorized=false
pragma solidity 0.8.30;

import {Test} from "forge-std/Test.sol";
import {Consumers} from "../src/Consumers.sol";

contract TournamentTest is Test {
    Consumers c;

    function _setup() internal returns (string[] memory ids, string[] memory arms, bytes[] memory envs) {
        string memory j = vm.readFile("sut_cases.json");
        bytes32 pinNote = vm.parseJsonBytes32(j, ".PIN_NOTE");
        bytes32 pinAct = vm.parseJsonBytes32(j, ".PIN_ACT");
        bytes32[] memory finN = vm.parseJsonBytes32Array(j, ".FIN_NOTE");
        bytes32[] memory finA = vm.parseJsonBytes32Array(j, ".FIN_ACT");
        bytes32[] memory pins = vm.parseJsonBytes32Array(j, ".PINNED_BINDINGS");
        bytes32[] memory issuers = vm.parseJsonBytes32Array(j, ".ISSUER_BINDINGS");
        bytes32 recip = vm.parseJsonBytes32(j, ".RECIP");
        uint256 cap = vm.parseJsonUint(j, ".CAP");
        c = new Consumers(pinNote, pinAct, [finN[0], finN[1]], [finA[0], finA[1]], recip, cap, pins, issuers);
        ids = vm.parseJsonStringArray(j, ".ids");
        arms = vm.parseJsonStringArray(j, ".arms");
        envs = vm.parseJsonBytesArray(j, ".envs");
    }

    function test_runTournamentAndWriteResults() public {
        string memory j = vm.readFile("sut_cases.json");
        (string[] memory ids, string[] memory arms, bytes[] memory envs) = _setup();
        bytes32[] memory tids = vm.parseJsonBytes32Array(j, ".tids");
        string[] memory recTypes = vm.parseJsonStringArray(j, ".recTypes");
        bytes32[] memory bindIds = vm.parseJsonBytes32Array(j, ".bindIds");
        string[] memory bindSems = vm.parseJsonStringArray(j, ".bindSems");
        string[] memory bindTypes = vm.parseJsonStringArray(j, ".bindTypes");

        string memory outArr = "[";
        for (uint256 i = 0; i < ids.length; i++) {
            string memory outcome = _dispatch(arms[i], envs[i], tids[i], recTypes[i], bindIds[i], bindSems[i], bindTypes[i]);
            string memory row = string.concat(
                '{"id":"', ids[i], '","consumer":"', arms[i], '","outcome":"', outcome, '"}'
            );
            outArr = string.concat(outArr, i == 0 ? "" : ",", row);
        }
        outArr = string.concat(outArr, "]");
        vm.writeFile("sut_results.json", outArr);
        assertGt(ids.length, 0);
    }

    function _dispatch(
        string memory arm,
        bytes memory env,
        bytes32 tid,
        string memory recType,
        bytes32 bindId,
        string memory bindSem,
        string memory bindType
    ) internal view returns (string memory) {
        bytes1 p = bytes(arm)[0];
        // 'A' -> action arm (A_*), but ARCH also starts with 'A'
        if (keccak256(bytes(arm)) == keccak256("ARCH") || bytes(arm)[0] == "N") {
            return c.noteArm(arm, env, tid, recType, bindId, bindSem, bindType);
        }
        if (p == "A") {
            return c.actionArm(arm, env, tid, recType, bindId, bindSem, bindType);
        }
        return c.noteArm(arm, env, tid, recType, bindId, bindSem, bindType);
    }
}
