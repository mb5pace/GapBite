# RELEASING

How QuickX changes reach production. It holds no secret values.

## 1. Branches and where they run

| Branch | What it is | Where it runs | Redis keys (from v0.9.0) |
|---|---|---|---|
| `main` | Production. Only changes through a release. Nobody pushes to it directly after v0.8.0. | https://quickx-gapbite.vercel.app | `qx:` |
| `dev` | Where all work happens. Every push gets a Vercel preview deployment. | The stable branch link, `https://gapbite-git-dev-boards-team.vercel.app` (not a one-off deployment link). The team tests here. | `qxdev:` |

Both environments share one Upstash database. **From v0.9.0** every Redis key starts with the environment's prefix (`qx:` when `VERCEL_ENV` is `production`, `qxdev:` for preview and local), so a preview never sees production data and test orders, wallets and staff IDs made on the dev link do not exist in production. See ARCHITECTURE.md, "Redis keys". v0.8.0 and earlier used `qx:` everywhere, so do not use a preview of those versions for testing.

The preview deployment needs the same settings as production (names only; values stay in Vercel): the Redis connection, the cafe and admin passwords, the permanent codes and the session secret. Check **Vercel › the project › Settings › Environment Variables** and make sure each is ticked for **Preview** as well as **Production**.

## 2. Day to day

1. All work is committed and pushed to `dev`. Never push to `main`.
2. Each push to `dev` builds a preview. The team tests on the dev link.
3. Every change also adds one plain-language line under `## [Unreleased]` in `CHANGELOG.md` (what a student, the cafe desk or the team can now do, not file names). Use the headings Added, Changed, Fixed or Removed.
4. Before every push: `npm run build`, `npx tsc --noEmit` and `npm run lint` are clean.
5. The version line at the bottom of Account (and in the Cafe and Admin headers) shows `QuickX vX.Y.Z · abc1234`, with `· dev` on the preview, so you can tell which build you are testing.

## 3. Releasing: "release vX.Y.Z"

When the team says **release vX.Y.Z**:

1. On `dev`, set `"version"` in `package.json` (and `package-lock.json`) to `X.Y.Z`.
2. In `CHANGELOG.md`, move the lines under `## [Unreleased]` into a new `## [X.Y.Z] - YYYY-MM-DD` section, leaving `## [Unreleased]` empty above it. Update the link lines at the bottom.
3. Commit on `dev` ("Release vX.Y.Z") and push. Wait for the preview to be Ready.
4. Open a pull request from `dev` to `main` titled **Release vX.Y.Z**, with the new changelog section as its description. **Do not merge it.** The team merges it on GitHub.
5. After the team says it is merged and production is Ready:
   1. Check that production is Ready and `/api/health` says `"ok":true`.
   2. Tag the merge commit on `main`: `git tag -a vX.Y.Z <merge-commit> -m "QuickX vX.Y.Z"` and `git push origin vX.Y.Z`.
   3. Create the GitHub Release: `gh release create vX.Y.Z --title "QuickX vX.Y.Z" --notes-file <the changelog section>`.

   **Cloud sessions cannot do 2 and 3.** A Claude Code cloud session cannot push tags, create tags through the API, or create Releases (the environment refuses all three, and `gh release create` also needs GraphQL, which is blocked). When that happens the session says so and the team does it on GitHub instead: **Releases › Draft a new release › Choose a tag › type `vX.Y.Z` › Create new tag on publish**, target **main** (the merge commit), title **QuickX vX.Y.Z**, and paste the changelog section as the description. That creates the tag and the Release in one step. Opening the pull request may need the REST route too: `gh api repos/mb5pace/GapBite/pulls -f title="Release vX.Y.Z" -f head=dev -f base=main -F body=@<the changelog section>` if `gh pr create` is refused.
   4. Bring `dev` level with `main`: `git checkout dev && git merge --ff-only origin/main` (a merge commit if the pull request was squashed, so `dev` contains the release), then `git push origin dev`.

The first release, v0.8.0, was done once directly on `main` to start this workflow.

## 4. Version numbers

| Version | When |
|---|---|
| `0.9.0` | Phase 9 (Account and Discover) |
| `1.0.0` | The presentation-ready build, after Phase 10 |
| `1.0.1`, `1.0.2`, ... | Small fixes after 1.0.0 |
| `1.1.0`, `1.2.0`, ... | New features after 1.0.0 |

Before 1.0.0 each phase is the next minor version (0.9.0, then 0.10.0 only if a second round is needed before the presentation).

## 5. Hotfix

If production breaks, fix it on `dev` like any other change, test it on the dev link, and release it as a patch version (for example `1.0.1`) with the same steps. Do not push to `main` to go faster.

**Emergency.** If users are affected right now and the fix is not ready, roll back to the previous deployment in Vercel: **Vercel › the project › Deployments**, open the last good production deployment, **⋯ › Promote to Production** (or **Instant Rollback**). That changes what production serves without changing git. Then fix on `dev` and release a patch. Ask the team to do the rollback; it is a production change.

## 6. Where the version comes from

- `package.json` `version` is the number.
- The short commit is `VERCEL_GIT_COMMIT_SHA` (first 7 characters), or `local` on a laptop. A preview adds `· dev` (`VERCEL_ENV` is `preview`).
- `next.config.ts` reads them at build time and `lib/version.ts` turns them into the line. Vercel must have **Automatically expose System Environment Variables** switched on (Settings › Environment Variables) for the commit to show.
