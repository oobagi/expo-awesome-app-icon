# Releasing

This package publishes to the public npm registry.

## First publish

The package does not exist on npm until the first publish. Create or sign in to
an npm account, then publish the first version from a clean local checkout:

```sh
npm login
npm ci
npm run lint
npm test
npm run build
npm publish --access public
```

## Trusted publishing

After the package exists on npm, configure trusted publishing for this repo:

- Publisher: GitHub Actions
- Organization or user: `oobagi`
- Repository: `expo-awesome-app-icon`
- Workflow filename: `publish.yml`

Trusted publishing lets GitHub Actions publish through OIDC without storing an
npm token in GitHub. Push a version tag to publish:

```sh
npm version patch
git push origin main --follow-tags
```

The `Publish Package` workflow runs on `v*` tags and publishes the tagged
package version to npm.
