# Git Signing and Identity Systems: Mapping Keys to Authorship

**Lane:** Git signing and identity systems — researched 2026-08-07

Legend used throughout: **[shipped]** = implemented behavior, **[intent]** = documented intent/roadmap, **[rec]** = this lane's recommendation for EFS, **[spec]** = speculation/untested.

---

## 1. Commit/tag signing formats: OpenPGP, X.509, SSH

**[shipped]** Git supports three signature formats selected by `gpg.format`: `openpgp` (default, GnuPG), `x509` (S/MIME via gpgsm or a compatible program), and `ssh` (since Git 2.34, Oct 2021, via `ssh-keygen -Y`). The SSH path was added by Fabian Stelzer's patch series ([git/git PR #1041](https://github.com/git/git/pull/1041)). The signature always covers the *entire commit object* — tree, parents, author line, committer line, message — and is stored in the commit's `gpgsig` header.

**[shipped]** SSH signing verification is driven by an **allowed_signers file** (`gpg.ssh.allowedSignersFile`). Each line is: `principals-pattern [options] keytype base64-key`. Principals are a comma-separated pattern list of `USER@DOMAIN`-style identities (ssh_config PATTERNS wildcards allowed). Options include `cert-authority`, `namespaces=...`, `valid-after=YYYYMMDD[HHMM[SS]][Z]`, `valid-before=...` ([ssh-keygen(1), ALLOWED SIGNERS](https://man.openbsd.org/ssh-keygen.1#ALLOWED_SIGNERS)). Git commit signatures use namespace `git`. Verification (`git verify-commit`, `git log --show-signature`) succeeds only if the signing key matches an entry whose principals pattern matches the identity — Git uses the **committer email** as the identity to match; a valid signature with no matching entry prints "No principal matched" ([Caleb Hearth walkthrough](https://calebhearth.com/sign-git-with-ssh), [github/docs #34387](https://github.com/github/docs/issues/34387)). A revocation list can be supplied via `gpg.ssh.revocationFile` (KRL or key-per-line) ([ssh-keygen(1)](https://man.openbsd.org/ssh-keygen.1)).

**The timestamp problem.** **[shipped]** The SSHSIG wire format ([PROTOCOL.sshsig](https://github.com/openssh/openssh-portable/blob/master/PROTOCOL.sshsig)) contains *no signing timestamp* (fields: magic, version, publickey, namespace, reserved, hash_algorithm, signature) — unlike OpenPGP signatures, which embed a signing time. Since Git 2.35 (Jan 2022), Git passes the **commit's committer date** as `-Overify-time` to `ssh-keygen -Y verify`, so `valid-after`/`valid-before` key-lifetime windows are evaluated against the commit's own claimed date ([Stelzer, "ssh signing: make verify-commit consider key lifetime"](https://lore.kernel.org/git/20211209085249.13587-6-fs@gigacodes.de/)). Analysis: the committer date is attacker-controlled data inside the very object being verified, so a signer holding a compromised-then-expired key can backdate commits to pass lifetime checks. Any system doing time-window key validity (i.e., key rotation) must bind a **trusted external timestamp** to the signature — Git itself has none.

**What git verifies vs what forges display.** **[shipped]** `git verify-commit` checks cryptographic validity against *local* trust (GPG keyring / allowed_signers) — it answers "did a key I trust sign these bytes." Forge badges are a separate, server-side, database-backed claim: signature valid *and* key registered on an account *and* committer email matches that account's verified email. Forge verification is not portable — cloning a repo carries the signatures but not the badge logic or the key↔account mapping.

## 2. SSH certificates (CA-signed user certs) in Git hosting

**[shipped]** GitHub Enterprise Cloud and GitLab (instance-level, via `gitlab-sshd`) support SSH CAs for **authentication**: the org/instance registers a CA public key, users authenticate with short-lived CA-signed certs, no per-user key upload ([GitHub SSH CA docs](https://docs.github.com/en/enterprise-server@3.13/organizations/managing-git-access-to-your-organizations-repositories/about-ssh-certificate-authorities), [GitLab gitlab-sshd SSH certificates](https://docs.gitlab.com/administration/operations/gitlab_sshd_ssh_certificates/)).

**[shipped]** For **signing**, `ssh-keygen -Y sign` can sign with a certificate, and an allowed_signers entry marked `cert-authority` accepts signatures made with any cert issued by that CA; the expected principal must match *both* the allowed_signers pattern *and* a principal embedded in the certificate ([ssh-keygen(1)](https://man.openbsd.org/ssh-keygen.1#ALLOWED_SIGNERS)). Matthew Garrett (Mar 21, 2026) demonstrates the full flow (`* cert-authority ssh-rsa AAAA…` trusting a CA for all principals) and reports the key gap: **no forge verifies cert-signed commits — GitHub/GitLab show them Unverified**, so he built his own validation tooling ([mjg59, "SSH certificates and git signing"](https://codon.org.uk/~mjg59/blog/p/ssh-certificates-and-git-signing/), [Sayr.us walkthrough](https://sayr.us/git/ssh-sign-ca/)). GitLab has an open MR track for group-level CA files, still in development as of 2025-2026 ([gitlab-org MR 126741](https://gitlab.com/gitlab-org/gitlab/-/merge_requests/126741)). **[rec]** The `cert-authority` mechanism is the closest native-Git analog to "stable principal, rotating actor keys" — a principal-level CA key issues short-lived actor certs; verifiers need only the CA entry.

## 3. Sigstore gitsign: keyless signing

**[shipped]** gitsign flow: on commit, an OIDC login (GitHub/Google/Microsoft, browser or device-code flow) yields an identity token; an ephemeral keypair is generated in-process; Fulcio issues a ~10-minute X.509 cert binding the OIDC identity to the key; the commit is signed and the CMS/PKCS#7 signature + cert stored in the `gpgsig` header; an entry is written to the **Rekor transparency log** so the signature remains checkable after cert expiry ([sigstore/gitsign README](https://github.com/sigstore/gitsign), [Introducing Gitsign, Chainguard/Lynch](https://medium.com/sigstore/introducing-gitsign-9fd3f1b682aa)).

**[shipped]** Verification: `gitsign verify --certificate-identity=<email> --certificate-oidc-issuer=<issuer>` is preferred over `git verify-commit` because plain x509 verification "only verif[ies] cryptographic integrity… not **who** put the data there" ([README](https://github.com/sigstore/gitsign)). Verification needs the Sigstore trust roots (Fulcio root cert, Rekor + CT log public keys) fetched via a signed **TUF** metadata channel (`gitsign initialize`), not hard-coded ([Sigstore security model](https://docs.sigstore.dev/about/security/), [custom components](https://docs.sigstore.dev/cosign/system_config/custom_components/)). Two Rekor storage modes: **online** (default; commit SHA in Rekor; verification requires network) and **offline/bundle** (hashed content in Rekor, inclusion proof embedded in the commit; offline verification, still labeled experimental) ([README](https://github.com/sigstore/gitsign)).

**Adoption reality, Aug 2026.** **[shipped]** gitsign is actively maintained: v0.17.1 released Aug 5, 2026; v0.17.0 (Jul 29, 2026) added Rekor v2 (rekor-tiles) signing and experimental sigstore-go support ([releases](https://github.com/sigstore/gitsign/releases)). Rekor v2 went GA Oct 2025 on a tile-based backend ([Ry Walker research summary](https://rywalker.com/research/sigstore)). Sigstore broadly is an OpenSSF-graduated project underpinning npm/PyPI/Homebrew provenance and GitHub Artifact Attestations. But **GitHub still displays gitsign-signed commits as Unverified** — Sigstore's CA is not in GitHub's trust root and the ephemeral-key model doesn't fit GitHub's account-key registry ([README FAQ](https://github.com/sigstore/gitsign)). So gitsign's commit-signing adoption remains niche relative to SSH signing; Sigstore's *artifact* signing is the mainstream success.

## 4. Push certificates (`git push --signed`)

**[shipped]** Since Git 2.2, `git push --signed` signs a "push certificate": the pushed ref updates (old-sha → new-sha per ref) plus the server URL and a server-supplied **nonce**, attesting "I intended to push these commits to this ref on this server" — closing the replay gap where valid signed commits are re-pushed to a different branch/repo by someone else ([Ryabitsev, "Signed git pushes", Nov 3 2020](https://people.kernel.org/monsieuricon/signed-git-pushes)). Server-side: `receive.certNonceSeed` (secret random string, HMAC'd with a timestamp to make one-time nonces; `receive.certNonceSlop` tolerates stale nonces in stateless HTTP mode) ([git-receive-pack docs](https://git-scm.com/docs/git-receive-pack/2.24.0), [git commit 5732373d](https://gitlab.comp.anu.edu.au/comp8440/git/-/commit/5732373daacf9486a0db9741cf0de4e7a41b08b3)). The cert is delivered to receive hooks (`GIT_PUSH_CERT*` env); servers may record or enforce.

**[shipped]** Consumption in practice is near-zero: "The vast majority of public git hosting forges do NOT have this turned on" ([Ryabitsev](https://people.kernel.org/monsieuricon/signed-git-pushes)). kernel.org records push certs into a public transparency log; Gitea has an open feature request since 2020 ([gitea #13454](https://github.com/go-gitea/gitea/issues/13454)); gitoxide opened a signed-push tracking issue in 2026 ([gitoxide #2434](https://github.com/GitoxideLabs/gitoxide/issues/2434)). GitHub/GitLab do not consume push certs. **[rec]** For EFS, the push-certificate *shape* (ref-update + destination + server nonce, signed) is the right unit for "admission events" — it is what a signed EFS write-record naturally is, with the chain replacing both the nonce channel and the transparency log.

## 5. GitHub verified badges and vigilant mode

**[shipped]** "Verified" asserts: commit is signed; signature cryptographically checks out against a GPG/SSH/S/MIME key **uploaded to the GitHub account** whose verified email matches the committer email ([About commit signature verification](https://docs.github.com/en/authentication/managing-commit-signature-verification/about-commit-signature-verification)). Critical persistence rule: verification happens **once, at push time**, and "previously verified commits retain their verified status based on the record created during the initial verification" — GitHub does **not** re-verify or retroactively downgrade when a key is later removed or revoked (same doc). GitLab differs: **revoking** an SSH key marks previously-signed commits unverified; merely **deleting** it leaves prior statuses intact ([GitLab SSH-signed commits](https://docs.gitlab.com/user/project/repository/signed_commits/ssh/)). GitLab also requires committer email ∈ account's verified emails.

**[shipped]** Vigilant mode (opt-in, since Apr 2021) marks *all* the user's commits: **Verified** (signed+verified, committer is the sole vigilant author), **Partially verified** (signed+verified but author ≠ committer and the author enabled vigilant mode — "the commit signature doesn't guarantee the consent of the author"), **Unverified** (unsigned commits attributed to you) ([GitHub changelog](https://github.blog/changelog/2021-04-28-flag-unsigned-commits-with-vigilant-mode/), [displaying verification statuses](https://docs.github.com/en/authentication/managing-commit-signature-verification/displaying-verification-statuses-for-all-of-your-commits)). Web-UI commits are auto-signed by **GitHub's own web-flow GPG key** and always show Verified — the forge is a signer of record, a centralization point ([about-commit-signature-verification](https://docs.github.com/en/authentication/managing-commit-signature-verification/about-commit-signature-verification)).

## 6. Author vs committer vs signer; spoofing

**[shipped]** A commit carries an `author` line and a `committer` line, both free-text name/email set by whoever writes the object (`--author`, `user.email`); the **signer** is a third, implicit party — whoever's key produced the `gpgsig`. Git enforces no relationship among the three. Unsigned author spoofing is trivial and GitHub resolves avatars/links purely by email lookup, so anyone with push access can make commits display as any GitHub user ([Gomes, "Spoofing git commits"](https://medium.com/@pjbgf/spoofing-git-commits-7bef357d72f0), [Arnica commit-spoofing analysis](https://www.arnica.io/blog/trying-to-identify-spoofing-in-github-may-the-4th-be-with-you)). GitHub's position: impersonation via email grants no privileges and "doesn't compromise accounts" — mitigation is signing + vigilant mode + branch protection requiring signed commits. GitLab has an open issue about signed commits with spoofed *author* fields still displaying misleadingly ([gitlab #297665](https://gitlab.com/gitlab-org/gitlab/-/issues/297665)). Analysis for EFS: a signature proves *the signer endorsed these bytes*, including a possibly-false author line; display layers must key trust to the **signer's principal**, never the author string.

## 7. Ethereum-key bridges (secp256k1 → git)

**[shipped/negative]** **OpenSSH does not support secp256k1.** `ssh-keygen -t` accepts `rsa, ecdsa (nistp256/384/521 via -b), ecdsa-sk, ed25519, ed25519-sk, mldsa44-ed25519` — no secp256k1, so the SSH signing path cannot carry an Ethereum key ([ssh-keygen(1)](https://man.openbsd.org/ssh-keygen.1)). (Note the new `mldsa44-ed25519` PQ-hybrid type — recent OpenSSH; a reminder that allowed_signers verifiers must track OpenSSH's key-type evolution.)

**[shipped]** **GnuPG does support secp256k1** (expert-mode curve choice since 2.1; interop with Bitcoin-tooling implementations confirmed; historical "unknown curve" issues were libgcrypt version dependent) ([dev.gnupg.org T1740](https://dev.gnupg.org/T1740), [jtriley, GnuPG and elliptic curves](https://jtriley.substack.com/p/gnu-privacy-guard-and-elliptic-curves)). So an Ethereum secp256k1 private key *can* in principle be wrapped as an OpenPGP ECDSA key and sign commits Git accepts. **[spec]** Whether GitHub's verifier accepts a secp256k1 ECDSA *curve* is undocumented — GitHub lists only algorithm families ("RSA, ElGamal, DSA, ECDH, ECDSA, EdDSA") with no curve list ([checking-for-existing-gpg-keys](https://docs.github.com/en/authentication/managing-commit-signature-verification/checking-for-existing-gpg-keys)); treat forge display as unverified-by-default for this path.

**[shipped/negative]** Multiple targeted searches (Aug 2026: "sign git commit ethereum wallet", EIP-191 git signing, secp256k1 git tooling) surfaced **no maintained tool bridging Ethereum wallets to git signing** — only building blocks (MetaMask `personal_sign`/[eth-sig-util](https://github.com/MetaMask/eth-sig-util), [EIP-191 envelope format](https://www.cyfrin.io/blog/understanding-ethereum-signature-standards-eip-191-eip-712), HSM-style signers like [kaleido vault-plugin-secrets-ethsign](https://github.com/kaleido-io/vault-plugin-secrets-ethsign)). Adjacent prior art: [Radicle](https://radicle.dev/) binds repos to DIDs with **ed25519** device keys (not secp256k1); Gitopia authenticates pushes with a wallet but does not wallet-sign commit objects. **[rec]** The realistic Ethereum bridge is therefore **off-band**: sign the commit SHA (or a canonical commit descriptor) with EIP-191/EIP-712 and record it as an attestation — exactly the [EAS](https://github.com/ethereum-attestation-service/eas-contracts) pattern and exactly EFS's native record model. This also works for smart accounts, which cannot produce in-commit signatures at all (subject to the v2 no-ERC-1271-authorship ruling).

## 8. FIDO2 / hardware-backed SSH signing

**[shipped]** OpenSSH 8.2+ supports security-key key types `sk-ssh-ed25519@openssh.com` / `sk-ecdsa-sha2-nistp256@openssh.com`: the private key lives in the authenticator (YubiKey etc.), every signature requires user-presence touch (optionally PIN via `-O verify-required`), and `-O resident` stores the credential on-token for portability ([Yubico, Securing git with SSH and FIDO2](https://developers.yubico.com/SSH/Securing_git_with_SSH_and_FIDO2.html), [Bernard 2024 walkthrough](https://emmanuelbernard.com/blog/2024/06/26/ssh-fido2/)). Works with Git's SSH signing (Git 2.34+, OpenSSH 8.2+ on both signer and verifier); GitHub requires the key be registered as type "Signing Key" for badges. This is the cheapest existing route to "actor key = hardware-bound, per-action user presence" — relevant if EFS actor keys should be phishing-resistant. Passkey/WebAuthn platform authenticators are the same FIDO2 substrate, but forges consume them for *login*, not signature verification.

## 9. Agent/CI identity

**[shipped]** GitHub Actions issues per-job **OIDC tokens** whose claims pin repo, workflow, ref, SHA, and triggering actor; this is the identity backbone for keyless signing in CI ([attest-build-provenance action](https://github.com/actions/attest-build-provenance)). **GitHub Artifact Attestations** (GA June 25, 2024) uses Actions OIDC + Fulcio + a Sigstore bundle to bind artifact hashes to workflow identity as SLSA provenance ([GitHub changelog](https://github.blog/changelog/2024-06-25-artifact-attestations-is-generally-available/)) — machine identity done via federation, no long-lived keys. For *commits* made in CI: commits created through GitHub's REST API with `GITHUB_TOKEN` or a GitHub App token are signed **by GitHub's web-flow key** and badge as verified `github-actions[bot]` / `app[bot]` — but only "if the request… contains no custom author information, custom committer information, and no custom signature information" ([about-commit-signature-verification](https://docs.github.com/en/authentication/managing-commit-signature-verification/about-commit-signature-verification), [verified-bot-commit action](https://github.com/IAreKyleW00t/verified-bot-commit)). I.e., today's "verified bot commit" is forge-vouched, not key-holding — the bot has no key; the platform signs. gitsign in CI can use the Actions OIDC token for genuinely machine-held ephemeral signatures ([Chainguard, gitsign + GitHub Actions](https://www.chainguard.dev/unchained/keyless-git-commit-signing-with-gitsign-and-github-actions)).

## 10. Mapping KEL principals with rotating actor keys onto git verification

Synthesis (**[rec]** unless noted):

1. **allowed_signers as a generated artifact is the natural bridge.** The file format already expresses everything a KEL projection needs: principal identity string, per-key `valid-after`/`valid-before` windows (from KEL rotation events), `namespaces=git`, revocation via KRL file. An EFS lens/SDK can deterministically compile "KEL state as of time T" → allowed_signers + revocation file, and any stock Git ≥2.34 verifies offline. This is the zero-new-client-code path.
2. **But do not trust Git's verify-time.** Git feeds the committer date (attacker-controlled) as the validity-check time **[shipped]** ([lore patch series](https://lore.kernel.org/git/20211209085249.13587-6-fs@gigacodes.de/)). EFS must anchor "when was this signature admitted" to its own chain: verify **at admission time against KEL state at admission**, then persist the verdict as a record. Precedent for verify-once-persist: GitHub ([docs](https://docs.github.com/en/authentication/managing-commit-signature-verification/about-commit-signature-verification)); precedent for retroactive downgrade on revocation: GitLab ([docs](https://docs.gitlab.com/user/project/repository/signed_commits/ssh/)). EFS should record the admission-time verdict immutably *and* let lenses recompute display-time status against later KEL events (revocation ≠ rewriting history; it changes interpretation).
3. **cert-authority is the rotation-friendly native mechanism.** One allowed_signers line per principal (`<principal> cert-authority <principal-CA-key>`) lets actor keys rotate freely as short-lived SSH certs without regenerating the file — the KEL principal maps to the CA key, KEL rotation events roll the CA. Verified working with stock tooling; **no forge honors it** ([mjg59 2026](https://codon.org.uk/~mjg59/blog/p/ssh-certificates-and-git-signing/)) — which doesn't matter if EFS's own lens is the display layer.
4. **Sigstore is the architectural sibling, not a dependency.** Fulcio ≈ "bind ephemeral key to durable identity," Rekor ≈ "trusted timestamp + transparency." EFS's chain already provides both roles natively (admission = log inclusion = timestamp), so EFS can achieve gitsign's guarantees without TUF roots or online Rekor lookups — a genuine simplification. gitsign's `matchCommitter` / `--certificate-identity` flags show the verification UX shape: verify *identity*, not just integrity ([gitsign README](https://github.com/sigstore/gitsign)).
5. **Ethereum keys stay off-band.** No in-commit secp256k1 path exists that stock tooling verifies (§7). Wallet involvement should be an EFS record attesting to a commit/ref hash (EIP-712, EAS-style), with day-to-day commit signing done by ed25519/FIDO2 actor keys enrolled in the KEL.
6. **The unit to sign for hosting is the ref-update, not just the commit.** Push certificates (§4) exist precisely because signed commits don't bind to a destination ref/repo; EFS's admitted write-records should carry `(repo, ref, old, new, principal, admission-time)` — the push-cert schema — making the chain the transparency log kernel.org built by hand.
7. **Display trust must key on signer-principal, never author strings** (§6), and EFS needs an explicit analog of "Partially verified" for author≠signer to avoid re-importing GitHub's consent gap.

## Sources

- https://calebhearth.com/sign-git-with-ssh
- https://github.com/github/docs/issues/34387
- https://man.openbsd.org/ssh-keygen.1
- https://github.com/openssh/openssh-portable/blob/master/PROTOCOL.sshsig
- https://github.com/git/git/pull/1041
- https://lore.kernel.org/git/20211209085249.13587-6-fs@gigacodes.de/
- https://lore.kernel.org/all/20211022150949.1754477-4-fs@gigacodes.de/
- https://people.kernel.org/monsieuricon/signed-git-pushes
- https://git-scm.com/docs/git-receive-pack/2.24.0
- https://gitlab.comp.anu.edu.au/comp8440/git/-/commit/5732373daacf9486a0db9741cf0de4e7a41b08b3
- https://github.com/go-gitea/gitea/issues/13454
- https://github.com/GitoxideLabs/gitoxide/issues/2434
- https://docs.github.com/en/authentication/managing-commit-signature-verification/about-commit-signature-verification
- https://docs.github.com/en/authentication/managing-commit-signature-verification/checking-for-existing-gpg-keys
- https://docs.github.com/en/authentication/managing-commit-signature-verification/displaying-verification-statuses-for-all-of-your-commits
- https://github.blog/changelog/2021-04-28-flag-unsigned-commits-with-vigilant-mode/
- https://docs.gitlab.com/user/project/repository/signed_commits/ssh/
- https://docs.gitlab.com/administration/operations/gitlab_sshd_ssh_certificates/
- https://gitlab.com/gitlab-org/gitlab/-/merge_requests/126741
- https://docs.github.com/en/enterprise-server@3.13/organizations/managing-git-access-to-your-organizations-repositories/about-ssh-certificate-authorities
- https://codon.org.uk/~mjg59/blog/p/ssh-certificates-and-git-signing/
- https://sayr.us/git/ssh-sign-ca/
- https://github.com/sigstore/gitsign
- https://github.com/sigstore/gitsign/releases
- https://medium.com/sigstore/introducing-gitsign-9fd3f1b682aa
- https://www.chainguard.dev/unchained/keyless-git-commit-signing-with-gitsign-and-github-actions
- https://docs.sigstore.dev/about/security/
- https://docs.sigstore.dev/cosign/system_config/custom_components/
- https://rywalker.com/research/sigstore
- https://medium.com/@pjbgf/spoofing-git-commits-7bef357d72f0
- https://www.arnica.io/blog/trying-to-identify-spoofing-in-github-may-the-4th-be-with-you
- https://gitlab.com/gitlab-org/gitlab/-/issues/297665
- https://dev.gnupg.org/T1740
- https://jtriley.substack.com/p/gnu-privacy-guard-and-elliptic-curves
- https://github.com/MetaMask/eth-sig-util
- https://www.cyfrin.io/blog/understanding-ethereum-signature-standards-eip-191-eip-712
- https://github.com/kaleido-io/vault-plugin-secrets-ethsign
- https://github.com/ethereum-attestation-service/eas-contracts
- https://radicle.dev/
- https://developers.yubico.com/SSH/Securing_git_with_SSH_and_FIDO2.html
- https://emmanuelbernard.com/blog/2024/06/26/ssh-fido2/
- https://github.blog/changelog/2024-06-25-artifact-attestations-is-generally-available/
- https://github.com/actions/attest-build-provenance
- https://github.com/IAreKyleW00t/verified-bot-commit
