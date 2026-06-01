---
name: release
description: Project-local release flow for expo-awesome-app-icon. Use when releasing this package, bumping versions, pushing v* tags, publishing to npm, creating GitHub Releases, or cleaning up release-related Actions runs.
---

# Release

## Flow

This repo publishes from `v*` tags through `.github/workflows/publish.yml`.

Before bumping:

```sh
git status --short --branch
npm run lint
npm run build
npm test
```

Use the repo scripts so the commit title is right:

```sh
npm run release:patch
# or release:minor / release:major
```

Expected release commit title: `chore: release X.Y.Z`.
Expected tag: `vX.Y.Z`.

Verify before pushing:

```sh
git log --oneline --decorate --max-count=5
git for-each-ref refs/tags/vX.Y.Z --format='%(refname:short) %(objecttype) %(subject)'
```

Push:

```sh
git push origin main --follow-tags
```

## Verify

Watch the two relevant runs:

```sh
gh run list --limit 10 --json databaseId,displayTitle,headBranch,status,conclusion,workflowName,url,createdAt
```

Release is done only when:

- `main` CI passes.
- `vX.Y.Z` Publish Package passes.
- `npm view expo-awesome-app-icon@X.Y.Z version` returns `X.Y.Z`.
- `gh release view vX.Y.Z` exists.
- `npm view expo-awesome-app-icon version` returns `X.Y.Z` unless a non-latest dist-tag was intentional.

## Repair

If npm creates a bad bare version commit title, amend it immediately:

```sh
git commit --amend -m "chore: release X.Y.Z"
git tag -fa vX.Y.Z -m "chore: release X.Y.Z"
git push --force-with-lease origin main
git push --force origin vX.Y.Z
```

Delete duplicate or bad release Actions runs with `gh run delete <id>`. Keep the final clean `main` CI run and final clean `vX.Y.Z` publish run.
