# Checked FileRevision and required parent-index evidence

Source `9fdee5e8976815a07d28097087d4ac2105a969ec`. Root observed real behavioral
REDs before implementing Child acceptance and parent append, then 110/110 full
tests and normal candidate sizes at one frozen input. Independent review
approved the task. The kernel is unchanged.

The 15 gzip files retain full final compiler input/output, all five gate
reports/logs, task brief/report and independent review/diff. `manifest.json`
records SHA256 and byte lengths of both compressed and original contents;
generation verified every decompressed file byte-for-byte. This is retained
local test evidence, not an authenticated chain-state proof.

Eight Files tests cover actual Root/Child/grandchild records, competing genuine
EOA/contract authors, same-File validation, cold maximum-size parents, exact
profile pins, retained backlinks without reuse duplicates, and rollback after
both required index halves mutate. Test gas is orchestration cost, not paid
transaction pricing. The oversized test harness is not a deployment candidate.

The reader/tag composition is Task 2. Cold filename reconstruction, path
reuse/whiteout integration, scale, browser and native historical proof are not
earned by this packet.
