# 2026-07-07 client v2 corpus

Working corpus for the official EFS client v2 (web OS) design round. Run by Fable 5 from the kickoff prompt [[fable-client-v2-kickoff-prompt]], on top of the handoff packet [[fable-client-v2-handoff]], [[os-research-compass-for-fable]], and [[agent-native-os-compass-for-fable]].

The deliverable design set lives in `Designs/clientv2/`. This corpus holds the raw material:

| Path | What it is |
|---|---|
| `research/<lane>.md` | 14 web-research lane digests with dated primary sources (see table below) |
| `worklog.md` | Session worklog: phases, decisions in flight, continuation notes |
| `decision-framework.md` | The explicit architectural forks the design set must resolve, with the evidence each fork is waiting on |

## Research lanes

| Lane | Covers |
|---|---|
| `closures-generations` | Nix/Guix/OSTree/A-B: closures, lock graphs, generations, rollback, GC roots |
| `fuchsia-components` | Component manifests, capability routing, resolvers/runners, sessions; Android intents |
| `capability-os` | seL4/Genode/Capsicum; ocap discipline, powerbox, membranes; Spritely/Agoric |
| `web-isolation` | SES/LavaMoat/Compartments, iframe/CSP/COOP/COEP, IWA, WASI — what the browser can actually enforce |
| `local-first` | Ink & Switch canon, CRDT/sync engines, op logs, outbox, honest pending-state UX |
| `wallet-standards` | 4337/7702/5792/7677/7715/7730, passkeys, P-256, clear signing — status 2026 |
| `package-trust` | TUF/Sigstore/SLSA, extension supply-chain incidents, update semantics, capability diffs |
| `network-privacy` | OHTTP/Privacy Pass, Tor lessons, fingerprinting, IPFS gateway + RPC privacy, Helios |
| `i18n-a11y` | Intl/Temporal/MF2/ICU4X, fonts, IME/EditContext, WCAG 2.2/3.0, ARIA-in-components |
| `agent-native` | MCP/A2A/WebMCP, computer-use safety, prompt-injection defenses, agent delegation |
| `webos-precedents` | Firefox OS/Chrome Apps/PWA/Urbit/Solid/ATProto/Snaps/web3:// — autopsies |
| `boot-deeplinks` | Fragment secrets, unfurl leakage, protocol handlers, SW cold-start engineering |
| `secure-ui` | Line of death, prompt-fatigue research, blind-signing incidents, trusted chrome in-page |
| `storage-durability` | persist()/quota/eviction reality, OPFS/IDB/Cache API, multi-tab coordination |

Workflow run id: `wf_ecf32e78-aec` (session 05439450, 2026-07-07).
