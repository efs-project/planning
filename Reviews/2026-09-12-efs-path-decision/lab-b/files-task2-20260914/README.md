# Checked current Files reader and tag composition

Source `d54a1208b3e014f0eede9697992ce12e3620b638`. Actual root-run RED exposed
six missing consumer behaviors; the corrected implementation passed 118/118
full-suite tests, including 15 Files tests. Independent review approved it.
The normal reader runtime/initcode is 15,896/20,007 bytes. The oversized test
harness is not a deployment candidate; no Core or profile source changed.

The consumer joins the selected HEAD to exact checked FileRevision bytes,
keeps competing revisions visible, and distinguishes File tags from tags on
the selected revision. Folder filtering requires a complete exhausted window;
an incomplete window cannot silently return an empty list.

One requirement was explicitly corrected between RED and GREEN: a point read
does not require COMPLETE reverse-parent enumeration, because it uses an exact
parent ID, not that index. Its profile, basis and exact parent checks remain.
Folder reads still require COMPLETE scope coverage. The original wrong-tag-
subject assertion was not weakened. Retained RED source makes this visible.

The 13 gzip files include full final compiler input/output, reports/logs,
brief/report/review/diff, and RED consumer/test sources. `manifest.json` records
compressed and original SHA256 and byte lengths; generation verified exact
decompression. These are retained local tests, not authenticated state proofs.

This packet does not establish lifecycle Task 3, cold filename reconstruction,
historical pagination, a browser, paid gas, large directories or native-source
portable proofs. Tagged folders contain checked selected-file graphs, not an
unqualified search over every tagged Subject.
