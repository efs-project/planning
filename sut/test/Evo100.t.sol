// SPDX-License-Identifier: UNLICENSED
// DISPOSABLE protocolConformance=false notAdopted=true goCodeAuthorized=false
pragma solidity 0.8.30;

import {Test} from "forge-std/Test.sol";

// Independent Solidity cold reconstructor: recomputes every EVO-100 TypeId from
// descriptor bytes alone (no network, no shared code with the Python side beyond
// the sealed closure JSON and the domain-separation prose).
contract Evo100Test is Test {
    bytes32 DOM_TYPE;
    bytes32 DOM_SCHEMA;

    function _schemaBytes(uint16[] memory keys, uint8[] memory kinds, uint8[] memory opts, uint32[] memory maxes)
        internal
        pure
        returns (bytes memory out)
    {
        for (uint256 i = 0; i < keys.length; i++) {
            out = abi.encodePacked(out, keys[i], kinds[i], opts[i], maxes[i]);
        }
    }

    function test_coldReconstruct() public {
        string memory j = vm.readFile("../fixtures/evo100_closure.json");
        DOM_TYPE = vm.parseJsonBytes32(vm.readFile("../fixtures/corpus.json"), ".domains.DOM_TYPE");
        DOM_SCHEMA = vm.parseJsonBytes32(vm.readFile("../fixtures/corpus.json"), ".domains.DOM_SCHEMA");
        uint256 n = vm.parseJsonUint(j, ".count");

        bytes32 rollup;
        uint256 match_;
        // three cold runs; each recomputes from scratch, no memoization
        for (uint256 run = 0; run < 3; run++) {
            bytes32 acc;
            match_ = 0;
            for (uint256 i = 0; i < n; i++) {
                string memory base = string.concat(".types[", vm.toString(i), "]");
                string memory meaning = vm.parseJsonString(j, string.concat(base, ".meaning"));
                bytes32 expected = vm.parseJsonBytes32(j, string.concat(base, ".typeId"));
                // fields are arrays-of-arrays [key,"kind",opt(bool as 0/1?),max]; the JSON stores
                // them as [int,string,bool,int]; re-read component arrays we emit below instead.
                (uint16[] memory keys, uint8[] memory kinds, uint8[] memory opts, uint32[] memory maxes) =
                    _readFields(j, base);
                bytes32 sh = keccak256(abi.encodePacked(DOM_SCHEMA, _schemaBytes(keys, kinds, opts, maxes)));
                bytes32 mh = keccak256(bytes(meaning));
                bytes32 tid = keccak256(abi.encodePacked(DOM_TYPE, mh, sh));
                if (tid == expected) match_++;
                acc = keccak256(abi.encodePacked(acc, tid));
            }
            if (run == 0) rollup = acc;
            else require(acc == rollup, "cold run nondeterministic");
        }
        emit log_named_uint("evo100.match", match_);
        emit log_named_uint("evo100.count", n);
        vm.writeFile(
            "evo100_receipt_sol.json",
            string.concat(
                '{"reconstructor":"solidity","count":',
                vm.toString(n),
                ',"match":',
                vm.toString(match_),
                ',"rollup":"',
                vm.toString(rollup),
                '","coldRuns":3,"networkReads":0}'
            )
        );
        assertEq(match_, n);
    }

    // fields stored as parallel arrays we add to the JSON via evo100_fields.json
    function _readFields(string memory, string memory base)
        internal
        view
        returns (uint16[] memory keys, uint8[] memory kinds, uint8[] memory opts, uint32[] memory maxes)
    {
        string memory f = vm.readFile("../fixtures/evo100_fields.json");
        // index from base ".types[i]"
        bytes memory bb = bytes(base);
        // extract i between '[' and ']'
        uint256 s;
        uint256 e;
        for (uint256 k = 0; k < bb.length; k++) {
            if (bb[k] == "[") s = k + 1;
            if (bb[k] == "]") e = k;
        }
        string memory idx = _slice(bb, s, e);
        string memory p = string.concat(".t", idx);
        uint256[] memory ks = vm.parseJsonUintArray(f, string.concat(p, ".keys"));
        uint256[] memory kd = vm.parseJsonUintArray(f, string.concat(p, ".kinds"));
        uint256[] memory op = vm.parseJsonUintArray(f, string.concat(p, ".opts"));
        uint256[] memory mx = vm.parseJsonUintArray(f, string.concat(p, ".maxes"));
        keys = new uint16[](ks.length);
        kinds = new uint8[](ks.length);
        opts = new uint8[](ks.length);
        maxes = new uint32[](ks.length);
        for (uint256 i = 0; i < ks.length; i++) {
            keys[i] = uint16(ks[i]);
            kinds[i] = uint8(kd[i]);
            opts[i] = uint8(op[i]);
            maxes[i] = uint32(mx[i]);
        }
    }

    function _slice(bytes memory b, uint256 s, uint256 e) internal pure returns (string memory) {
        bytes memory o = new bytes(e - s);
        for (uint256 i = 0; i < e - s; i++) o[i] = b[s + i];
        return string(o);
    }
}
