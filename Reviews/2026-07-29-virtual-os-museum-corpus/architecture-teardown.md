# Virtual OS Museum — Actual Architecture Teardown

**Status:** research-lane report for the 2026-07-29 Virtual OS Museum deep dive; evidence record, not canon
**Agent:** architecture-teardown (claude-fable-5 workflow), 2026-07-29

#kind/review #status/done #repo/planning #pass/vom-deep-dive #topic/content #topic/clientv2

This lane traces the complete path from a catalog entry to a running OS in the Virtual OS Museum (virtualosmuseum.org), curated by Andrew Warkentin (andreww591). Method: read the public site, shallow-cloned the GitLab repos (`virtualosmuseum` at commit `8d4763c173dfb8a8c8191551d98f6b689cd0eaea`, 2026-07-18; `virtualosmuseum-host-scripts` at `e876676d2e94d2f5ccb099ca49c3ec43e0f51583`, 2026-05-25), queried the Internet Archive metadata API, listed the contents of the museum's APT-repository ZIP via IA's view_archive facility, and downloaded two small (<2 MB) .deb packages from the live update server for inspection. No VM distribution or file over 200 MB was downloaded.

---

## 1. The one-sentence architecture

The museum is a Debian 12 x86-64 guest VM whose entire collection — launcher, boot scripts, metadata, emulators, and ~1,700 pre-installed guest OS images — is packaged as ~3,300 ordinary Debian packages served from a GPG-signed aptly repository; "download on demand" and "check for updates" are literally `apt-get install` (VERIFIED, from launcher scripts `update_packages` and `download_installation` and the live repo at `downloads.virtualosmuseum.org/apt`).

## 2. Distribution: what you download

Two editions plus an updater, all ZIPs, all hosted on the Internet Archive with torrents served from the website (VERIFIED, downloads page source in `virtualosmuseum-site` repo + IA metadata API):

| Artifact | Version | Exact size (bytes) | Stated size | IA item |
|---|---|---|---|---|
| Full edition | 2026.06.12 | 139,092,755,744 (~129.5 GiB) | "130G zipped, 184G unzipped" | `virtual_os_museum_full_edition` |
| Lite edition | 2026.06.15 | 14,963,773,647 (~13.9 GiB) | "14G zipped, 22G unzipped" | `virtual_os_museum_lite_edition` |
| External update only | 2026.06.12 | 1,017,985,456 | n/a (unzip over previous install) | `virtual_os_museum_external_update` |
| APT repo mirror snapshot | 2026.05.30 | ~119 GB per snapshot zip; item total 238,462,778,830 | "for setting up a mirror" | `virtual_os_museum_apt` |

- SHA256 sums for each ZIP are published on the downloads page; IA additionally records MD5/SHA1 per file, and IA auto-generates torrents (VERIFIED).
- The full-edition IA item retains four dated versions (2026.05.19 through 2026.06.12), totaling ~539.6 GB (VERIFIED from IA metadata; the item keeps history rather than replacing files).
- The lite edition contains no guest disk/tape images; images are fetched per-installation on first run (VERIFIED, README). Lite 2026.06.15 exists solely to fix a bug where the lite VM used the leftover release-preparation local repository if update-on-start was never enabled (VERIFIED — downloads page note matches launcher commit `1ec7c725`, 2026-06-17, which factored out `set_mirror_from_config`).
- "Full vs lite" maps to two APT meta-packages: `os-museum` (everything incl. all images) vs `os-museum-no-images` (info + scripts only); the launcher writes the choice into `launcher.conf` on first init by checking which is installed (VERIFIED, `config.py` + `is_lite_edition`).

### Host-side wrapper (hypervisor layer)

The ZIP contains the guest VM disk plus host launchers from the `virtualosmuseum-host-scripts` repo (VERIFIED, repo inspection + `mkdist` script):

- `Run_Linux_x86.AppImage` / `Run_Linux_ARM.AppImage` — dialog UI via a bundled `zenity-rs` binary; uses system VirtualBox (x86) or QEMU (ARM) if present, else bundled AppImages (VERIFIED, README + repo).
- `Run_Windows.cmd` — on AMD64 silently installs bundled `VirtualBox-Win.exe` (plus `VC_redist.x64.exe`) if absent and registers the VM from a `.vbox-template-x86`; on ARM64 runs a bundled QEMU Windows build (VERIFIED). Bundled QEMU Windows builds for x86_64 and aarch64 are full binary trees committed via git-LFS (VERIFIED; e.g. `UTM.dmg` is an LFS pointer, sha256 `a8435c93cfb5f8bbfeea4b134cfad1ac66b67632b75e438c63b1a8ae043bef0e`, 250,021,057 bytes).
- macOS: bundled `UTM.dmg` + a `VirtualOSMuseum.utm` bundle (VERIFIED).
- Guest VM spec from the vbox template: `Debian12_64`, 4 vCPU, 8192 MB RAM, VMSVGA w/ 3D, NAT networking; guest properties show Debian kernel `6.1.0-40-amd64` and VirtualBox Guest Additions 7.1.12 (VERIFIED). The `run_qemu` script uses virtio-vga-gl and 9P shared folders (`hostfs` tag) and KVM when on Linux/x86-64; on Windows/ARM file transfer falls back to SFTP forwarded to 127.0.0.1:8022 (VERIFIED).
- Host VM is x86-only today; ARM-native host VM is planned, with the caveat that "certain emulators… will still be run within user-mode x86 emulation since the source for them isn't available" (VERIFIED quote, README) — i.e., the collection knowingly depends on closed-source emulator binaries.
- VM login: auto-login as `osmuseum` (password `osmuseum`, passwordless sudo) (VERIFIED, README).

## 3. The launcher

- Lives in the main repo `gitlab.com/virtualosmuseum/virtualosmuseum` (created 2025-07-06) as `launcher` + `scripts/lib/os_museum_launcher/` (VERIFIED).
- Language: Python 3 (Depends: `python3 (>= 3.11)`), GUI in PySide6/Qt 6, launched via `fades` (a virtualenv-on-demand runner; shebang `#!/usr/bin/fades --system-site-packages`, with `PySide6 # fades == 6.4.2` pinned) (VERIFIED).
- Persistence: Pony ORM over SQLite. The DB file name embeds an MD5 of the model schema (`info-<schema_hash>.db` in `state/`), so schema changes silently start a fresh DB; the DB is a pure cache regenerated from on-disk info files, with ctime-based incremental reload and a `force_db_update` flag file (VERIFIED, `models.py`).
- Data model entities: Country (via `pycountry`, incl. historic countries), CPU, WordSize, IntegrationLevel, Developer, Family, Variant ("OS/distribution", hierarchical, `non_os` subtree), BasicArchitecture, UIType, PlatformType, Platform, MachineConfig, Installation, BootScenario, Emulator (VERIFIED). Many-to-many relations are auto-derived up parent chains (e.g. an installation inherits countries from its variant's developers).
- Size: ~3,600 lines of Python for the launcher package + ~760 for the maintainer packaging utilities (VERIFIED, line counts).
- Single-instance enforcement via a QtSingleApplication UUID; per-VM guest locks prevent two instances of one VM while allowing different VMs concurrently (VERIFIED, README + `check_guest_lock`).
- A test mode (`--test-mode`) runs images one after another recording `confirmed_working` — the site's statement that "a little under half have been tested so far" refers to this flag (VERIFIED mechanism; the fraction is the curator's claim).

### Per-installation metadata (the actual format)

Metadata is *not* JSON/YAML/SQL — it is RFC-822-style `Key: value` plain-text files named `info`, parsed by regex (VERIFIED, `parse_info.py`; real example fetched from the live repo, package `os-museum-machine-multics-12.8-info`):

```
Long-Name: Multics
Version: MR12.8
Release-Date: 2023
Original-Developers: ge, honeywell, bull
Remote-Access: Terminals:telnet://127.0.0.1:6180
Orig-Source-URL: https://multics-wiki.swenson.org/index.php/Main_Page
Installation-Revision: 0
```

Recognized fields (from the `Installation` model) include: `Long-Name`, `Version`, `Installation-Variant-Name`, `Release-Date`/`Build-Date`/`Sys-Release-Date`/`Orig-Release-Date` (with `<`/`>`/`?` suffix conventions for date precision), `Countries`, `Developers`, `Original-Developers`, `Provided-By`, `Base-Variant`, `Boot-Script`, `Emulator-Version`, `Launch-Mode`, `Launch-Instructions`, `Long-Description`, `Network-Addresses`, `Remote-Access`, `Output-Files`, `Orig-Source-URL`, `Installation-Revision`, `Installation-Info-Revision`, `Confirmed-Working` (VERIFIED).

The **filesystem is the schema** (VERIFIED, `std_boot` header comment + `parse_info.py`):

- `images/<platform>[/<subplatform>]/<family…>/<short_name>_config/` — one "machine config" directory per VM (btrfs subvolume). Family nesting is arbitrary depth (e.g. `pdp11/unixlike/unix/conventional/genetic/research/att_unix_v7_config`).
- Alongside it, `<short_name>_boot` — a symlink to `scripts/std_boot` (or to another installation's boot link, or `_boot2` for secondary/hosted installations). The launcher and packager *discover installations by walking for `*_boot` symlinks*.
- Inside the config dir: `INFO/info` (+ `INFO/screenshots/NN_Title.png`), `INFO2.<name>/` for secondary installs sharing the machine, `scenarios/<name>/info` for alternate boot scenarios, `PASSWD` (credentials shown in the launcher's "Logins" tab), `README*`, `doc/`, plus the media and emulator config files themselves.
- Platform/family identity is derived from which ancestor directories contain an `INFO` file; a `non_os` path component marks non-OS software (VERIFIED).
- Installations can be symlinked into multiple platform/family directories (multi-categorization via symlinks, not tags) (VERIFIED).

## 4. Boot path: catalog entry → running OS

1. Launcher "Run" → checks guest lock → if lite and image absent, `download_installation <config>` → `apt-get install os-museum-machine-<name>-image` (VERIFIED).
2. Executes the `<short_name>_boot` symlink → `scripts/std_boot` resolves the actual boot script: per-install `BOOT.<short_name>` script, else `Boot-Script:` info field, else the platform's `Default-Boot-Script:` (VERIFIED).
3. Boot scripts live in `scripts/lib/std_boot.d/` — **~280 emulator/machine-specific scripts** (VERIFIED count of directory). They source `bootscriptfunctions.sh` + per-emulator function libraries (`qemu.sh`, `simh.sh`, `mame.sh`, `vice.sh`, `minivmac.sh`, `trs80gp.sh`, `arnold.sh`, `gxemul.sh`, `klh10.sh`, `p8000emu.sh`, `_snapshot.sh`…), embed self-describing `### BEGIN BOOT SCRIPT INFO` header blocks in the same Key:Value format, and honor `$OSM_EMULATOR_VERSION` to select among side-by-side emulator versions (VERIFIED).
4. `Launch-Mode` controls terminal spawning (`gui-and-terminal`, `…,faketree`); `faketree` is used to fake `$HOME`-hardcoded emulator config paths (VERIFIED usage; provenance of the faketree binary UNKNOWN).

### Emulator set

- 164 emulator variants have info entries under `info/emulators`; the big multi-machine families are QEMU, SIMH (~40 variants incl. cpanel builds), MAME (~75 machine variants), VICE, MiniVMac, PCE, trs80gp, DtCyber, Hercules (VERIFIED).
- Beyond those, std_boot.d reveals the long tail: 86Box, PCem, Bochs, DOSBox-X, Previous, BasiliskII/SheepShaver, ARAnyM, Hatari, fs-uae/Amiberry, LisaEm, KLH10, dps8m, Emulith, PERQemu, ContrAlto, Darkstar, tsugaru, uARM, Virtual AGC, charon_hpa, cray_sim, and dozens of one-off emulators (VERIFIED, file list).
- Emulator *binaries* ship in `os-museum-local-bin` (arch amd64; "everything installed in /opt, /usr/local, /var/lib/os_museum/emulators, /var/lib/os_museum/utils"), with side-by-side-versioned sub-packages: `-86box`, `-hercules`, `-mame` (1.48 GB deb), `-plan9port`, `-qemu`, `-simh`, `-vice`, `-wine` (VERIFIED, packaging code + live Packages index).
- Windows-only emulators run under bundled Wine (multiple versions; e.g. commit `ae17dcb2`: "use Wine 3.0.1 for DCALICE"); DOS-based emulators run under DOSBox-X; Java emulators (e.g. virtualh89) also present (VERIFIED).
- **Patched emulators:** CREDITS.md states some emulators are patched "usually either to compile on newer versions of Linux or to support a configuration directory other than a hardcoded path in $HOME", and that sources for the specific versions used "are provided in the source archive available from the Virtual OS Museum site" — but the downloads page lists "Emulator sources: (coming soon)" (VERIFIED both statements; i.e., **the patched sources are not yet published anywhere** as of 2026-07-29). Two exceptions exist as public forks by the curator: `github.com/andreww591/mame-c900` (MAME patched for the Commodore 900 driver, pushed 2026-05-29) and `tme-phabrics` (The Machine Emulator variant) on both GitHub and GitLab (VERIFIED).

## 5. Media: disks, tapes, ROMs, firmware

- Media are **loose files in each emulator's native format inside the machine config dir** — e.g. `12.8MULTICS.tap`, `root.dsk`, `dps8.ini`, `.dps8m.state` for Multics; `wollongong_unix_v7_msm80.dsk` + `id32.ini` for Interdata Unix (VERIFIED, Contents index of the repo snapshot).
- Shared media live in per-platform `SUPPORT/` dirs: MAME ROMs are stored *unzipped* per-machine (`<platform>/SUPPORT/mame_roms/<machine>/*.bin`), common disk images (`fathd.img`), and dummy floppy/CD images (`dummy1440.img`, `dummy.iso`) shared across PC guests (VERIFIED).
- No content-addressing, no chunking, no dedup beyond "shared file → common package": a disk image is delivered whole inside its package's gzip data tarball; the largest single package is 3.69 GB (`os-museum-machine-mac-os-x-10.5.9-image`) (VERIFIED).
- Hash coverage: each .deb carries per-file `md5sums` in its control member; the repo's `Packages` index carries MD5/SHA1/SHA256/SHA512 per .deb; `Release`/`InRelease` hash the indexes (VERIFIED). The arch-all Contents index lists 490,209 files (VERIFIED).
- Naming: short names constrained to `^[0-9a-z][0-9a-z.+_-]+$`, translated `_`→`-` for package names (VERIFIED, `parse_info.py` + `download_installation`).

## 6. Download-on-demand and the update repository

This is the load-bearing discovery of the lane: **the "update repository" is a plain aptly-published Debian APT repository** (VERIFIED end-to-end):

- Live endpoint: `https://downloads.virtualosmuseum.org/apt`, suite `bookworm`, component `main`, architectures `all` + `amd64`, "Description: Generated by aptly". Found by extracting `conf/mirrors` from the shipped `os-museum-scripts-launcher_20260530.0542_all.deb` (the git repo's `conf/mirrors` contains only placeholder/dev entries incl. `http://10.0.2.2/…`) (VERIFIED).
- The launcher writes `deb <mirror> bookworm main` to `/etc/apt/sources.list.d/os-museum.list` and runs `apt-get update` / `apt-get install <meta>` under sudo; update check = dry-run install of the meta-package (VERIFIED, `update_packages`, `set_mirror_from_config`).
- **Signing: yes.** `InRelease` + `Release.gpg` exist and are PGP-signed; signer fingerprint `C9D07D8075FC382BC0AA2DEFD3543C222C937426` (key ID `D3543C222C937426`), decoded from the signature packet (VERIFIED). The public key is **not** published on the website, repo root (`/apt/key.gpg` → 404), or the Ubuntu keyserver (VERIFIED checks); it is presumably pre-trusted inside the VM image (INFERRED). Trust is therefore anchored entirely in the initial ZIP download + its published SHA256.
- Package taxonomy (VERIFIED from `scripts/maintainer/os_museum_pkgutils/`):
  - `os-museum-machine-<name>-info` (info files, boot symlinks, PASSWD, READMEs, screenshots) and `os-museum-machine-<name>-image` (media + configs). Version = the integer `Installation-Revision` from the info file. The image package **Pre-Depends on the exact-version info package** (`= revision`).
  - `os-museum-common-info`, `os-museum-common-images` (+ per-platform `os-museum-common-images-<platform>` for shared ROMs/disks), `os-museum-local-bin` (+ emulator sub-packages), `os-museum-scripts-base` / `-std-boot` / `-launcher` / `-external` (files outside `/var/lib/os_museum`: systemd units, X11 config).
  - Meta: `os-museum-machine-all-info` / `-all-images` pin **exact versions** of every machine package; `os-museum-no-images` and `os-museum` sit on top. Auto-versioned packages use UTC timestamps (`YYYYMMDD.HHMM`); rebuild detection is a cached mtime+MD5 file status list.
  - Live repo state 2026-07-09: 3,275 distinct package names; 1,550 machine-image packages; top meta version `20260709.0952` (VERIFIED, live Packages index). The site's installation-list table has 1,703 rows (VERIFIED) — consistent with "over 1700 installations" (secondary installs/scenarios share machine packages).
- The `.deb`s themselves are built by a **custom ~260-line shell `mkdeb`** (bsdcpio/bsdtar + `ar`), not dpkg-deb, feeding `aptly repo add` + `aptly publish update` (VERIFIED, `mkalldebs`).
- Release preparation runs inside the VM against a local repo mounted over 9P at `/media/host_apt` (`file:///media/host_apt` mirror, `run_qemu -a`), with `release_prep_*` systemd hooks that scrub `launcher.conf` on shutdown (VERIFIED).
- Repo hosting: `downloads.virtualosmuseum.org` resolves to Cloudflare (104.21.95.112 / 172.67.144.166); origin serves a default "Welcome to nginx!" page; `cf-cache-status: DYNAMIC` (VERIFIED) — i.e., a single self-hosted nginx origin behind Cloudflare, plausibly a home server (INFERRED).

## 7. Snapshots, reset, save, upgrade

- Every machine config dir is a **btrfs subvolume**; snapshots are `btrfs subvolume snapshot -r` into a hidden `.image_snapshots/<name>/` tree with an `_orig_path` symlink back (VERIFIED, `snapshot_*` scripts + `_snapshot.sh`).
- Snapshot types: `initial` (auto-created by the image package's postinst on every install/revision), `final_pre_upgrade` (created on upgrade *only if the VM was modified* — detected by running `md5sum -c` against the stored dpkg `.md5sums` of the previous package), `pre_restore` (auto-created before any restore) (VERIFIED). Deleting the newest `initial` snapshot requires a `-f` CLI override (VERIFIED).
- This is on-disk state only; there is no support for saving/restoring running-VM memory (VERIFIED, README).
- "Revisions" are image re-releases (better emulator/config/apps), not guest OS versions; a June 2026 fix (`c0c46b0f`) added `info_postinst` snapshots so info-only updates don't desync from image snapshots; `Machine-Info-Revision` field added `bd634817` (VERIFIED, git log).
- A May 2026 fix (`44929210`) converts config dirs that shipped as plain directories into subvolumes at package-install time — the original lite image had some non-subvolume configs (VERIFIED).

## 8. Launcher functions (user-facing)

All VERIFIED from README + `views.py`/`controllers.py`:

- **Search/browse:** name search box over the installation list; "Group by" menu; category tab strip with combined tree/search views for Families, Platforms, Developers, CPUs, Countries; "Add to search" composes category filters.
- **Documentation:** per-installation window renders README (md/txt), long description, screenshots (`NN_Title.png` convention), launch instructions; button to open the `doc/` folder.
- **Credentials:** `PASSWD` / `PASSWD.<install>` files render as "Logins" tabs.
- **Terminal/file transfer/remote access:** `Remote-Access:` info entries (e.g. `telnet://127.0.0.1:6180`) map to protocol handler scripts in `scripts/lib/access.d/`: telnet (incl. MAME/xterm/Blit/HP-terminal variants), tn3270, vnc, ftp, http, plato, e4term, x11/XDMCP — mostly spawning `x-terminal-emulator` or viewers against emulator-exposed localhost ports; `_IP_ADDR_` substitution from `Network-Addresses:`.
- **Printer/card output:** `Output-Files:` entries (`<name>:<type>:<path>`, types `printer`, `printer_dir`, `card_punch`) become "Data" buttons opening emulator output files in an editor/viewer.
- **Scenarios:** alternate boot scenarios per installation via a Scenario menu.
- **Settings:** switch full/lite download policy, select repository mirror, toggle update-on-start, toggle nested virtualization (x86 QEMU guests get KVM-nested if host supports it), show/hide short names.

## 9. Hidden central dependencies and single points of failure

- **Website** (`virtualosmuseum.org`): Jekyll/Minimal Mistakes on GitLab Pages (CI `pages` job; A record 35.185.44.232) with DNS on Cloudflare (VERIFIED CI + DNS; GitLab-Pages attribution INFERRED from IP + CI). Loss ⇒ loses discovery, torrents, SHA256 publication — but Wayback has snapshots (front page 2026-07-18, downloads 2026-07-23) and the site source is in the GitLab group (VERIFIED).
- **GitLab group** (`gitlab.com/virtualosmuseum`): 5 repos (launcher/scripts/metadata-tools, host-scripts, site, 2 test repos). Loss ⇒ code history gone, but the *shipped* launcher, scripts, and all metadata are inside `os-museum-scripts-*`/`-info` packages in every full ZIP and the apt mirror ZIP on IA — the working system is reconstructable without GitLab (VERIFIED via Contents index showing `/var/lib/os_museum/scripts/...`, `CREDITS.md`, `conf/` all packaged).
- **Update server** (`downloads.virtualosmuseum.org`): single nginx origin behind Cloudflare; the only live distribution channel for incremental updates (VERIFIED). Loss ⇒ existing installs keep working (apt failure is non-fatal to launching); the IA `virtual_os_museum_apt` ZIP is an explicit mirror-seed, but it lags the live repo (snapshot 2026.05.30 vs live 2026-07-09) (VERIFIED). A third party could re-host the snapshot unmodified and existing signatures would still verify; publishing *new* packages requires the curator's private GPG key, or users must trust a new key (INFERRED from apt mechanics).
- **The curator**: sole maintainer, sole uploader, sole GPG-key holder, sole holder of the unpublished patched emulator sources and of the un-released image backlog ("enough images … to reach 2000–3000 installations") (VERIFIED statements). The launcher requires "non-commercial" licensing decisions to flow through him.
- **Biggest preservation gap:** patched emulator *sources* are promised but "(coming soon)" — if the curator disappears today, the patched builds survive only as amd64 binaries in `os-museum-local-bin*` debs (VERIFIED). Some emulators are closed-source binaries with no source anywhere (VERIFIED, ARM-port README note).
- Mirrored where: Internet Archive holds full/lite/update ZIPs (multi-version), the apt-repo ZIP, and auto-torrents; Wayback holds the site. Nothing found on other mirrors (UNKNOWN whether third-party mirrors exist).

## 10. Offline reconstruction and manifests

- The full edition is explicitly fully offline-capable; nothing in the boot path requires the network (media, emulators, metadata, docs are all local; `download_installation` exits early when the package is already installed) (VERIFIED, README + scripts).
- **Signed manifest of the whole collection:** transitively yes, via APT — `InRelease` (GPG-signed) → `Packages` (SHA256 per .deb) → per-file `md5sums` inside each .deb. That chain covers every file of every installation. The distribution ZIPs themselves have only unsigned SHA256 sums on the website plus IA's item metadata (MD5/SHA1); there is no PGP signature over the ZIPs and no published public key to verify the repo signature out-of-band (VERIFIED). So a from-zero rebuild can *integrity-check* everything but must *bootstrap trust* from the website/IA hashes.
- A third party holding only the IA items could: unzip the apt mirror ZIP, serve it with any web server, point the launcher's mirror setting (a plain-text `conf/mirrors` list + settings dropdown) at it, and have a fully working, updatable museum frozen at the snapshot date (INFERRED from verified mechanics; untested).

## 11. Licensing (as stated; not legal advice)

- Launcher, scripts, and metadata: "Copyright 2004-2026 Andrew Warkentin… licensed for non-commercial redistribution only"; `LICENSE.md` is the MAME non-commercial license text and `LICENSE-cc.md` is CC BY-NC-SA 4.0 (VERIFIED). This is **source-available / non-commercial**, not OSI open source.
- Guest OS images: mixed provenance — many credited third-party pre-installed images (CREDITS lists ~100+ sources), plus curator-installed commercial abandonware included under an explicit criteria set (nothing <10 years old, still sold, or recently taken down) with a takedown-on-request policy (VERIFIED statements). These are **not freely redistributable** in any licensed sense; unavailability for sale is the curator's inclusion criterion, not a grant of rights.
- Bundled hypervisors/emulators: QEMU Windows builds ship with GPL COPYING files; VirtualBox, UTM, and the many emulators carry their own licenses; some emulators are closed-source freeware binaries (VERIFIED presence; per-emulator license inventory not attempted).

## 12. Notable design judgments (for our purposes)

- Reusing APT/dpkg/aptly/btrfs bought the museum atomic installs, exact-version dependency pinning, signed indexes, per-file hashing, delta-free but resumable distribution, and rollback — for near-zero custom infrastructure code (PROPOSED takeaway: the "boring substrate" pattern worked; the custom surface is confined to metadata parsing, boot-script dispatch, and Qt UI).
- The flip side: single-arch (amd64) binary packages, 3.7 GB monolithic debs with no dedup/chunking, a cache-DB keyed on schema hash, and symlink-topology-as-database are all curator-scale choices that would not survive multi-maintainer or multi-arch growth without rework (PROPOSED assessment).

## Sources

| URL | What it evidences | Accessed | Grade |
|---|---|---|---|
| https://virtualosmuseum.org/ | Project overview, stats (1,700+ installs, 250+ platforms), navigation | 2026-07-29 | A |
| https://virtualosmuseum.org/downloads/ | Editions, stated sizes, SHA256 sums, IA links, "emulator sources coming soon" | 2026-07-29 | A |
| https://virtualosmuseum.org/readme/ | Launcher usage, snapshots, update flow, credentials/output UI | 2026-07-29 | A |
| https://gitlab.com/virtualosmuseum/virtualosmuseum | Launcher/scripts/metadata source (shallow clone, HEAD `8d4763c1` 2026-07-18); README, licenses, git log | 2026-07-29 | A |
| https://gitlab.com/virtualosmuseum/virtualosmuseum-host-scripts | Host wrapper, bundled hypervisors via git-LFS, vbox/UTM configs, `mkdist` (HEAD `e876676d` 2026-05-25) | 2026-07-29 | A |
| https://gitlab.com/virtualosmuseum/virtualosmuseum-site | Site source, downloads.markdown, torrents in-repo, GitLab Pages CI, `_redirects` | 2026-07-29 | A |
| https://gitlab.com/api/v4/groups/virtualosmuseum/projects | Full repo inventory (5 repos) with activity dates | 2026-07-29 | A |
| https://archive.org/metadata/virtual_os_museum_full_edition | Exact full-edition sizes/hashes, 4 retained versions, item total 539.6 GB | 2026-07-29 | A |
| https://archive.org/metadata/virtual_os_museum_lite_edition | Exact lite-edition sizes/hashes incl. 2026.06.15 | 2026-07-29 | A |
| https://archive.org/metadata/virtual_os_museum_external_update | External-update sizes/hashes | 2026-07-29 | A |
| https://archive.org/metadata/virtual_os_museum_apt | APT mirror ZIP item (238 GB), "setting up a mirror" description | 2026-07-29 | A |
| https://archive.org/download/virtual_os_museum_apt/virtual_os_museum-2026.05.30-apt.zip/ (view_archive listing) | Repo layout: dists/bookworm InRelease/Release.gpg/Packages/Contents, 3,484 debs, package naming, largest debs | 2026-07-29 | B |
| InRelease extracted from the above ZIP | aptly origin, GPG signature, signer fingerprint C9D07D8075FC382BC0AA2DEFD3543C222C937426 | 2026-07-29 | B |
| `os-museum-scripts-launcher_20260530.0542_all.deb` (extracted from apt ZIP) | Live mirror URL `https://downloads.virtualosmuseum.org/apt`, default launcher.conf, package Depends incl. fades/pony | 2026-07-29 | B |
| https://downloads.virtualosmuseum.org/apt/dists/bookworm/{Release,InRelease,main/binary-all/Packages.gz} | Live signed repo, updated 2026-07-09, 3,275 packages, 1,550 machine-image packages, per-deb SHA512 | 2026-07-29 | A |
| `os-museum-machine-multics-12.8-info_0_all.deb` (live repo) | Real info-file format, PASSWD file, screenshots layout | 2026-07-29 | B |
| Contents-all.gz (apt ZIP) | 490,209 files; media layout (Multics/Unix examples); unzipped MAME ROMs; conf/mirrors ownership; 255 platform dirs | 2026-07-29 | B |
| https://api.github.com/users/andreww591/repos | mame-c900 patched fork; tme-phabrics; curator's GitHub footprint | 2026-07-29 | A |
| https://gitlab.com/api/v4/users/andreww591/projects | tme-phabrics on GitLab; no other emulator-source repos | 2026-07-29 | A |
| https://keyserver.ubuntu.com/pks/lookup?…C9D07D8075FC382BC0AA2DEFD3543C222C937426 | Signing key not on keyserver (Not Found) | 2026-07-29 | B |
| http://archive.org/wayback/available?url=virtualosmuseum.org | Wayback snapshots exist (2026-07-18 front page, 2026-07-23 downloads) | 2026-07-29 | B |
| DNS lookups (virtualosmuseum.org, downloads.virtualosmuseum.org) + HTTP headers | GitLab Pages IP; Cloudflare fronting; nginx default origin page | 2026-07-29 | B |
