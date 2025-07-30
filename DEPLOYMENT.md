# Deployment Guide

This guide explains how to deploy the Directus Slug Generator extension to npm and GitHub.

## Prerequisites

1. **npm Account**: Create an account at [npmjs.com](https://www.npmjs.com)
2. **GitHub Account**: Create an account at [github.com](https://github.com)
3. **npm CLI**: Install npm CLI globally: `npm install -g npm`
4. **Git**: Ensure Git is installed and configured

## Step 1: Update Package Information

Before publishing, update the following in `package.json`:

```json
{
  "author": {
    "name": "Your Real Name",
    "email": "your.real.email@example.com"
  },
  "repository": {
    "type": "git",
    "url": "https://github.com/yourusername/directus-extension-slug-generator.git"
  },
  "bugs": {
    "url": "https://github.com/yourusername/directus-extension-slug-generator/issues"
  },
  "homepage": "https://github.com/yourusername/directus-extension-slug-generator#readme"
}
```

## Step 2: Login to npm

```bash
npm login
```

Enter your npm username, password, and email when prompted.

## Step 3: Test the Build

```bash
npm run build
```

Ensure the build completes successfully and the `dist/` directory is created.

## Step 4: Test Package Contents

```bash
npm pack
```

This creates a `.tgz` file that you can inspect to ensure all necessary files are included.

## Step 5: Publish to npm

### First Time Publishing

```bash
npm publish --access public
```

### Subsequent Updates

1. Update version in `package.json`:
   ```bash
   npm version patch  # for bug fixes
   npm version minor  # for new features
   npm version major  # for breaking changes
   ```

2. Update `CHANGELOG.md` with the new version

3. Commit and tag:
   ```bash
   git add .
   git commit -m "Release version X.X.X"
   git tag -a vX.X.X -m "Release version X.X.X"
   ```

4. Publish:
   ```bash
   npm publish
   ```

## Step 6: GitHub Repository Setup

### Create GitHub Repository

1. Go to [GitHub](https://github.com) and create a new repository
2. Name it `directus-extension-slug-generator`
3. Make it public
4. Don't initialize with README (we already have one)

### Push to GitHub

```bash
git remote add origin https://github.com/yourusername/directus-extension-slug-generator.git
git branch -M main
git push -u origin main
git push --tags
```

## Step 7: GitHub Actions Setup

### Set up NPM Token

1. Go to your npm account settings
2. Generate an access token
3. Go to your GitHub repository settings
4. Add the token as a secret named `NPM_TOKEN`

### Enable GitHub Actions

The CI/CD workflow will automatically:
- Build the extension on multiple Node.js versions
- Run tests
- Publish to npm when pushing to main branch

## Step 8: Create GitHub Release

1. Go to your GitHub repository
2. Click on "Releases"
3. Click "Create a new release"
4. Choose the tag you created
5. Add release notes based on your changelog
6. Publish the release

## Verification

After publishing, verify:

1. **npm Package**: Visit `https://www.npmjs.com/package/@directus-extension/slug-generator`
2. **GitHub Repository**: Visit your GitHub repository
3. **Installation Test**: Try installing the package:
   ```bash
   npm install @directus-extension/slug-generator
   ```

## Troubleshooting

### Common Issues

1. **Package Name Already Taken**: Change the package name in `package.json`
2. **Build Failures**: Check TypeScript compilation and dependencies
3. **Publish Errors**: Ensure you're logged in and have proper permissions
4. **GitHub Actions Failures**: Check the workflow logs and secrets configuration

### Version Management

- Use semantic versioning (MAJOR.MINOR.PATCH)
- Update changelog for each release
- Tag releases in Git
- Create GitHub releases with detailed notes

## Maintenance

### Regular Tasks

1. **Dependency Updates**: Regularly update dependencies
2. **Security Audits**: Run `npm audit` and fix vulnerabilities
3. **Documentation**: Keep README and changelog updated
4. **Issue Management**: Respond to GitHub issues and PRs

### Release Process

1. Update version in `package.json`
2. Update `CHANGELOG.md`
3. Commit changes
4. Create Git tag
5. Push to GitHub
6. GitHub Actions will automatically publish to npm
7. Create GitHub release

## Support

For issues or questions:
- Create an issue on GitHub
- Check the documentation in README.md
- Review the changelog for recent changes 