# Wikifreedia dated live observations

**Purpose:** preserve enough of the mutable live evidence behind the 2026-07-29 review to distinguish it from pinned-source findings
**Status:** research snapshot, not a complete archival capture

## Homepage HTTP observation

Request: `GET https://wikifreedia.xyz/`

Observed: `2026-07-29T23:20:32Z`

Response status and complete header-name inventory:

```text
HTTP/2 200
age
cache-control
content-type
date
etag
link
server
strict-transport-security
x-sveltekit-page
x-vercel-cache
x-vercel-id
content-length
```

Security-relevant and hosting values:

```text
cache-control: public, max-age=0, must-revalidate
content-type: text/html
date: Wed, 29 Jul 2026 23:20:32 GMT
server: Vercel
strict-transport-security: max-age=63072000
x-sveltekit-page: true
x-vercel-cache: MISS
content-length: 30137
```

The response supplied no `Content-Security-Policy` or `Content-Security-Policy-Report-Only` header. Inspection of the returned HTML found no meta `Content-Security-Policy`.

Capture hashes:

```text
headers SHA-256: b7781e5d9b8f1db42b48d96664a02ce8960bea9630fbba41fd569c7b32cf8574
body SHA-256:    027cb9b50b7de25b523f2d7a899db99a0b24c061a675620e4830f888b5e60b62
```

The long `Link` preload value and full HTML are not reproduced here. The hashes prevent this note from being mistaken for a byte-complete archive.

## Relay NIP-11 observation

Request: `GET https://relay.wikifreedia.xyz/` with `Accept: application/nostr+json`

Observed: `2026-07-30T00:04:53Z`

```json
{
  "name": "Wikifreedia relay",
  "description": "This is a relay for wiki events. It supports search.",
  "pubkey": "fa984bd7dbb282f07e16e7ae87b26a2a7b9b90b7246a44771f0cf5ae58018f52",
  "contact": "",
  "supported_nips": [1, 11, 40, 42, 70, 86, 9, 45, 77],
  "software": "https://github.com/fiatjaf/khatru",
  "version": "n/a",
  "icon": "https://cdn.satellite.earth/064536fe832f87eb16e113ff227b61eb34ae4cd8e4ece3ef2b67d71257e52c71.png",
  "banner": ""
}
```

The description claims search, while `supported_nips` does not list NIP-50. The pinned relay README also claims search. This is a metadata inconsistency, not evidence that search failed.

## Relay event-corpus observation

Endpoint: `wss://relay.wikifreedia.xyz`

Initial summary observed: `2026-07-29T23:45:19Z`

Reproducibility rerun observed: `2026-07-30T00:06:14.695Z`

Content-free manifest collection completed: `2026-07-30T00:19:40Z` with the same 411-event ID-set hash

Range:

```text
since: 2023-01-01T00:00:00Z (1672531200)
until: 2026-07-31T23:59:59Z (1785542399)
filter: kinds=[30818]
```

NIP-45 counts:

```json
{
  "30818": 411,
  "818": 30,
  "819": 7,
  "30819": 0
}
```

The range was recursively bisected until every leaf had `COUNT <= 100`. Empty leaves were omitted. These nine nonempty leaves were then fetched with `REQ`:

| Since UTC | Until UTC | COUNT | Returned |
|---|---|---:|---:|
| 2023-01-01 00:00:00 | 2023-11-23 23:59:59 | 52 | 52 |
| 2024-02-13 18:00:00 | 2024-02-23 23:14:59 | 26 | 26 |
| 2024-02-23 23:15:00 | 2024-02-26 12:33:44 | 63 | 63 |
| 2024-02-26 12:33:45 | 2024-02-29 01:52:29 | 52 | 52 |
| 2024-02-29 01:52:30 | 2024-03-05 04:29:59 | 45 | 45 |
| 2024-03-05 04:30:00 | 2024-03-25 14:59:59 | 1 | 1 |
| 2024-03-25 15:00:00 | 2024-05-05 11:59:59 | 56 | 56 |
| 2024-05-05 12:00:00 | 2024-10-15 23:59:59 | 32 | 32 |
| 2024-10-16 00:00:00 | 2026-07-31 23:59:59 | 84 | 84 |

Checks:

```text
leaf COUNT sum: 411
returned events: 411
unique event IDs: 411
records with expected ID, pubkey, and signature hex shapes: 411
SHA-256 of sorted event IDs joined by LF:
36a24d3299ce033853186414fa5dbdea6ebd5aa9c0a2d35acc87305e8d593cb3
```

The content-free [`relay-event-manifest.jsonl`](./relay-event-manifest.jsonl) preserves `id`, `pubkey`, `created_at`, the raw observed `d`, and the full `fork`/`defer` marker tags for all 411 queryable events. Its SHA-256 is:

```text
5ce553e9fda7f41fa423feea9a3c119a71df7ee99518431ca980f61ed096452b
```

That manifest independently reproduces the reported pubkey/topic/marker/time/concentration aggregates and the sorted-ID hash. Expected fields and ID/signature hex shapes were checked during collection and IDs were deduplicated. Because the manifest deliberately omits content and other event fields, event IDs cannot be recomputed from it; signatures were not independently cryptographically verified, and marker targets were not resolved or validated. It is reproducible aggregate evidence, not a byte-complete raw-event archive.
