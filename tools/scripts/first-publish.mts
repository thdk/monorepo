#!/usr/bin/env zx
// Bootstrap-publish a brand-new package to npm from your machine.
//
// A package that does not exist on npm yet cannot have a trusted publisher, so
// CI cannot publish its first version. Run this once, then add the trusted
// publisher on npmjs.com so CI can take over.
//
// Usage: pnpm first-publish <nx-project> [--preid <id>] [--dry-run]
//
//   no preid  publishes the version already on disk with the `latest` tag
//   --preid   bumps the manifest to a prerelease (e.g. 0.0.3-initial.0) and
//             publishes it with `--tag <preid>` so `latest` stays untouched;
//             no git commit/tag/push
import 'zx/globals';

$.verbose = true;

const {
  _: [project],
  preid,
  'dry-run': dryRun,
} = argv;

if (!project) {
  console.error(
    'usage: pnpm first-publish <nx-project> [--preid <id>] [--dry-run]',
  );
  process.exit(1);
}

cd((await $`git rev-parse --show-toplevel`.text()).trim());
const dry = dryRun ? ['--dry-run'] : [];

// Build first so the short-lived OTP is not spent waiting on the build.
await $`pnpm exec nx run ${project}:build`;

if (preid) {
  await $`pnpm exec nx release version prerelease --projects ${project} --preid ${preid} --first-release --git-commit=false --git-tag=false --git-push=false ${dry}`;
}

// Keep the OTP a string: Nx types --otp as a number, which drops leading zeros.
const otp = dryRun ? [] : ['--otp', (await question('npm OTP: ')).trim()];

await $`pnpm exec nx release publish --projects ${project} --first-release --tag ${preid || 'latest'} ${otp} ${dry}`;
