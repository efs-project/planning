// Independent B0 expected-executing-state model over reverified retained evidence.
// No resolve/getBindingHead calls, no caller-trusted VERIFIED label or supplied fold.
import { AbiCoder, ZeroHash, keccak256 } from "../../2026-09-04-mvp-rehearsal/node_modules/ethers/lib.esm/index.js";
import { verifyState } from "./state-reader.mjs";

export const PLAN_TYPE = "0x05cc2a7f4eec5faff7e64f2f8374aca5f980d390fd4eee3b46c2f5c53853e61e";
export const PROFILE = keccak256(Buffer.from("efs2/lens-semantics/b0/1"));
const abi = AbiCoder.defaultAbiCoder();
const bindingDomain = keccak256(Buffer.from("efs2/binding/1"));
const nonzero = (value) => value.some((byte) => byte !== 0);
const hex = (value) => "0x" + value.toString("hex");

export function parsePlan(type, body) {
  if (type?.toLowerCase() !== PLAN_TYPE) return { code: 1 };
  if (typeof body !== "string" || !/^0x(?:[0-9a-f]{2})*$/i.test(body)) return { code: 2 };
  const b = Buffer.from(body.slice(2), "hex");
  if (b.length < 98 || b.readUInt16BE(0) !== b.length - 2) return { code: 2 };
  const frame = b.subarray(2);
  const n = frame.readUInt16BE(6);
  if (frame.length !== 96 + 64 * n) return { code: 2 };
  if (frame[0] !== 1) return { code: 3 };
  const combiner = frame[1];
  if (combiner > 2) return { code: 4 };
  const entries = Array.from({ length: n }, (_, index) => {
    const row = frame.subarray(96 + 64 * index, 160 + 64 * index);
    return { principal: hex(row.subarray(0, 32)), tier: row.readUInt16BE(32), flags: row.readUInt16BE(34),
      floor: row.readBigUInt64BE(36), reserved: row.subarray(44), index };
  });
  if ((frame[2] & 254) !== 0 || entries.some((e) => e.flags !== 0)) return { code: 5 };
  const k = frame.readUInt16BE(4);
  if (combiner === 2 ? k === 0 || k > n : k !== 0) return { code: 6 };
  if (n === 0 || n > 64) return { code: 7 };
  const adjacent = entries.slice(1).map((entry, i) => [entries[i], entry]);
  if (adjacent.some(([a, z]) => a.tier > z.tier || (a.tier === z.tier && BigInt(a.principal) >= BigInt(z.principal)))) return { code: 8 };
  if (new Set(entries.map((e) => e.principal)).size !== n) return { code: 9 };
  if (frame[3] !== 0 || nonzero(frame.subarray(8, 32)) || entries.some((e) => nonzero(e.reserved))) return { code: 10 };
  if (combiner !== 1 && entries.some((e) => e.tier !== 0)) return { code: 11 };
  if ((frame[2] & 1) !== 0 && adjacent.some(([a, z]) => a.tier === z.tier)) return { code: 12 };
  if (entries.some((e) => e.floor !== 0n)) return { code: 13 };
  return { code: 0, combiner, k, entries, purposeAndScope: hex(frame.subarray(32, 64)), profile: hex(frame.subarray(64, 96)) };
}

function emptyResult(basis = null) {
  return { presence: 0, reasonCode: 0, target: { targetKind: 0, targetA: ZeroHash, targetLeaf: 0 },
    winnerIndex: 65535, winnerTier: 0, winnerAdmissionOrdinal: 0n, presentCount: 0, agreeCount: 0,
    basis: basis ?? { realmRevisionId: ZeroHash, blockNumber: 0n, admissionHigh: 0n, basisKind: 0 } };
}

function unknown(result, reasonCode) {
  return { ...result, presence: 0, reasonCode };
}

function keyFor(principal, position) {
  return keccak256(abi.encode(["bytes32", "bytes32", "bytes32"], [bindingDomain, principal, position]));
}

function valueGroups(present) {
  const groups = new Map();
  for (const item of present) {
    const h = item.head;
    const key = [h.targetKind, h.target, h.targetLeaf].join(":");
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(item);
  }
  return [...groups.values()];
}

function decision(plan, consulted, result) {
  const present = consulted.filter((e) => e.head?.state === 1);
  const groups = valueGroups(present);
  result.presentCount += present.length;
  const qualifying = plan.combiner === 2 ? groups.filter((g) => g.length >= plan.k) : groups;
  if (qualifying.length > 1) return { ...result, presence: 3 };
  const enough = plan.combiner !== 0 || present.length === plan.entries.length;
  if (qualifying.length === 1 && enough) {
    const group = qualifying[0];
    const winner = group[0];
    return { ...result, presence: 1, target: { targetKind: winner.head.targetKind, targetA: winner.head.target,
      targetLeaf: winner.head.targetLeaf }, winnerIndex: winner.index, winnerTier: winner.tier,
      winnerAdmissionOrdinal: winner.head.ordinal, agreeCount: group.length };
  }
  return { ...result, presence: 2 };
}

/**
 * Predict the B0 ABI at a verified local block. basisKind=0 models the executing
 * contract's report; this oracle remains replica evidence, not consensus proof.
 * unavailableKeys inject explicit head-coverage gaps without inventing absence.
 */
export function resolveLens(state, expected, planId, position, { unavailableKeys = new Set() } = {}) {
  if (!state?.snapshot || state.outcome !== "VERIFIED") return unknown(emptyResult(), 4);
  const verified = verifyState(state.snapshot, expected);
  if (verified.outcome !== "VERIFIED") return unknown(emptyResult(), 6);
  let result = emptyResult({ realmRevisionId: expected.init.initialRevisionId,
    blockNumber: BigInt(verified.basis.number), admissionHigh: BigInt(verified.counts[4]), basisKind: 0 });
  const record = verified.snapshot.records.find((r) => r.id === planId);
  if (!record) return unknown(result, 5);
  const plan = parsePlan(record.row[0], record.row[1]);
  if (plan.code !== 0) return { ...unknown(result, 7), rejectCode: plan.code };
  if (plan.profile !== PROFILE) return { ...result, presence: 4, reasonCode: 1 };
  const tiers = plan.combiner === 1 ? [...new Set(plan.entries.map((e) => e.tier))] : [null];
  for (const tier of tiers) {
    const entries = tier === null ? plan.entries : plan.entries.filter((e) => e.tier === tier);
    const keys = entries.map((e) => keyFor(e.principal, position));
    if (keys.some((key) => unavailableKeys.has(key))) return unknown(result, 6);
    const consulted = entries.map((e, i) => ({ ...e, head: verified.fold.bindings.get(keys[i]) }));
    result = decision(plan, consulted, result);
    if (result.presence !== 2) return result;
  }
  return result;
}
