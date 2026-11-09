#!/usr/bin/env node

// Bootstrap-publish a brand-new package to npm from your machine.
//
// A package that does not exist on npm yet cannot have a trusted publisher, so
// CI cannot publish its first version. Run this once, then add the trusted
// publisher on npmjs.com so CI can take over.

import yargs from 'yargs';
import { $, question } from 'zx';

import { exec } from '../src/utils/exec';

const program = async () => {
  const options = await yargs(process.argv.slice(2))
    .usage('$0 <project> [--preid <id>] [--dry-run]')
    .demandCommand(1, 'Provide the nx project to publish')
    .option('preid', {
      description:
        'Bump the manifest to a prerelease (e.g. 0.0.3-initial.0) and publish it under this dist tag so `latest` stays untouched. Without it, the version on disk is published as `latest`. Never commits, tags or pushes.',
      type: 'string',
    })
    .option('dry-run', {
      alias: 'd',
      description:
        'Preview without writing files or publishing (no OTP needed)',
      type: 'boolean',
      default: false,
    })
    .strict()
    .parseAsync();

  const project = String(options._[0]);
  const dry = options.dryRun ? ['--dry-run'] : [];
  $.verbose = true;

  // Build first so the short-lived OTP is not spent waiting on the build.
  await $`pnpm exec nx run ${project}:build`;

  if (options.preid) {
    await $`pnpm exec nx release version prerelease --projects ${project} --preid ${options.preid} --first-release --git-commit=false --git-tag=false --git-push=false ${dry}`;
  }

  // Keep the OTP a string: Nx types --otp as a number, which drops leading zeros.
  const otp = options.dryRun
    ? []
    : ['--otp', (await question('npm OTP: ')).trim()];

  await $`pnpm exec nx release publish --projects ${project} --first-release --tag ${options.preid ?? 'latest'} ${otp} ${dry}`;
};

exec('first-publish', program);
