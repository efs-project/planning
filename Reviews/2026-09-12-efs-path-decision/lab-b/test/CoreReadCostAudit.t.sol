// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import {FilesPageReaderTest} from "./FilesPageReader.t.sol";
import {FilesPageReader} from "./FilesPageReader.sol";
import {Ledger} from "../src/Ledger.sol";

/// A2/A3 regression requirements; A4 remains an open audit reproduction.
/// Setup is an unconstrained Foundry fixture; every measured read is separately
/// gas-fenced. Setup has warmed state, so these are not cold transaction receipts.
contract CoreReadCostAuditTest is FilesPageReaderTest {
    event log_named_uint(string key, uint256 value);
    event log_named_string(string key, string value);

    function test_audit_long_valid_names_filter_cost() public {
        FilesPageReader r = reader();
        bytes32 folder = _directory(700);
        bytes memory alphabet = bytes("acdefghijklmnopqrstuvwxyz0123456789");
        for (uint256 k; k < 32; ++k) {
            bytes memory label = new bytes(255);
            for (uint256 i; i < 255; ++i) label[i] = "a";
            label[254] = alphabet[k];
            // A legitimate two-action name+placement publication gets the
            // existing 500k callback bound. The single-action 350k requirement
            // is checked separately below; no protocol cap is changed.
            bytes32 f = ledger.create(bytes32(800 + k));
            bytes32 revision = ledger.publish(rt, bytes.concat(abi.encode(f), bytes("hello")));
            ledger.bind(HEAD, f, 0, revision, 0);
            Ledger.Action[] memory actions = new Ledger.Action[](2);
            bytes[] memory bodies = new bytes[](2);
            bodies[0] = label;
            actions[0] = aPublish(nt, label);
            actions[1] = aBind(FOLDER, folder, keccak256(label), f, 0);
            ledger.execute(actions, bodies, ledger.nonces(address(this)));
        }
        bytes memory needle = new bytes(128);
        for (uint256 i; i < 127; ++i) needle[i] = "a";
        needle[127] = "b";
        FilesPageReader.Query memory q;
        FilesPageReader.Basis memory pinned = basis();
        bytes32[] memory authors = selectors();
        uint256[4] memory budgets = [uint256(1), 4, 8, 32];
        for (uint256 k; k < budgets.length; ++k) {
            emit log_named_uint("candidate budget", budgets[k]);
            q.search = "zz";
            bytes memory input = abi.encodeCall(r.readPage, (folder, authors, q, pinned, bytes(""), budgets[k]));
            uint256 beforeGas = gasleft();
            (bool ok, bytes memory result) = address(r).staticcall{gas: 15_000_000}(input);
            emit log_named_uint("short-negative warm call gas", beforeGas - gasleft());
            require(ok, "control read failed");
            FilesPageReader.Page memory page = abi.decode(result, (FilesPageReader.Page));
            require(page.scanned == budgets[k] && page.rows.length == 0, "control did not scan selected workload");
            q.search = string(needle);
            input = abi.encodeCall(r.readPage, (folder, authors, q, pinned, bytes(""), budgets[k]));
            beforeGas = gasleft();
            (ok, result) = address(r).staticcall{gas: 15_000_000}(input);
            emit log_named_uint("long-negative warm call gas", beforeGas - gasleft());
            emit log_named_uint("long-negative success", ok ? 1 : 0);
            require(ok, "valid difficult search exhausted warm diagnostic allowance");
            page = abi.decode(result, (FilesPageReader.Page));
            require(page.scanned == budgets[k] && page.rows.length == 0, "long query scanned different workload or unexpectedly matched");
        }
    }

    function test_audit_valid_long_name_single_bind_within_index_bound() public {
        bytes32 folder = _directory(950);
        bytes32 f = ledger.create(bytes32(uint256(951)));
        bytes32 revision = ledger.publish(rt, bytes.concat(abi.encode(f), bytes("hello")));
        ledger.bind(HEAD, f, 0, revision, 0);
        bytes memory label = new bytes(255);
        for (uint256 i; i < label.length; ++i) label[i] = "a";
        bytes32 name = ledger.publish(nt, label); // Native single-action retention.
        (bytes32 retainedType, uint64 first,, bytes memory retained) = ledger.record(name);
        require(retainedType == nt && first != 0 && keccak256(retained) == keccak256(label), "Name255 retention changed bytes");
        uint64 beforeCount = admissions();
        uint256 beforeGas = gasleft();
        (bool ok,) = address(ledger).call{gas: 15_000_000}(
            abi.encodeCall(ledger.bind, (FOLDER, folder, keccak256(label), f, uint32(0)))
        );
        emit log_named_uint("Name255 native single bind warm gas", beforeGas - gasleft());
        require(ok, "valid Name255 single bind failed existing index bound");
        require(admissions() == beforeCount + 1, "single bind admission missing");
        FilesPageReader.Query memory q;
        q.search = string(label); // Exact match also prepares the maximum 255-byte prefix table.
        FilesPageReader.Page memory page = reader().readPage(folder, selectors(), q, basis(), "", 1);
        require(page.rows.length == 1 && page.rows[0].placement.target == f
            && page.rows[0].name.qualification == 1 && keccak256(page.rows[0].name.value) == keccak256(label), "native Name255 placement not independently readable");
    }

    function test_audit_unrelated_admission_invalidates_contract_page() public {
        FilesPageReader r = reader();
        bytes32 folder = _directory(900);
        file(folder, "a", 901);
        file(folder, "b", 902);
        FilesPageReader.Query memory q;
        FilesPageReader.Basis memory pinned = basis();
        bytes32[] memory authors = selectors();
        FilesPageReader.Page memory first = r.readPage(folder, authors, q, pinned, "", 1);
        require(first.scanStatus == 1 && first.rows.length == 1, "missing first page");
        // Unrelated data: no mutation of the folder, its names, or either file.
        ledger.publish(BINARY, bytes("unrelated global activity"));
        (bool ok, bytes memory reason) = address(r).staticcall(
            abi.encodeCall(r.readPage, (folder, authors, q, pinned, first.continuation, 1))
        );
        require(!ok && bytes4(reason) == FilesPageReader.E_BASIS.selector, "hypothesis disproved: old basis resumed");
        (ok, reason) = address(r).staticcall(
            abi.encodeCall(r.readPage, (folder, authors, q, basis(), first.continuation, 1))
        );
        require(!ok && bytes4(reason) == FilesPageReader.E_CONTINUATION.selector, "hypothesis disproved: cursor accepted rebased snapshot");
        emit log_named_string("classification", "unrelated admission forces paid-current-state page restart; archived RPC snapshots are a separate browser capability");
    }
}
