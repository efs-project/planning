# EFS Drive / Native Filesystem PM
`role: native-filesystem-pm` · also called OS Drivers PM

Design native EFS filesystem adapters for Linux, macOS and Windows.

- **Owns:** mounts/daemons, names and metadata projection, enumeration/range reads, host errors and adapter acceptance.
- **Works with:** Files PM, SDK PM, Web Client / OS PM and v2 PM.
- **Boundary:** not the Files app UI, arbitrary Web OS plugins or canonical naming rules; a role doesn't authorize writable mounts.
- **Start:** [Core map](../../Designs/efsv2/README.md) and the assigned [Files proposal](../../Designs/efsv2/hierarchical-files-and-folders.md); revalidate older mount experiments.
- **Watch:** missing providers aren't ENOENT; partial listings aren't complete; safe host aliases must preserve permanent names.

Keep durable role knowledge here; session IDs, handoffs and messages belong in optional `NOTES.md` beside this file. [Notes guide](../README.md#notes-and-harness-ids).
