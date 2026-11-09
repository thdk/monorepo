import enforceAliasBoundaries from './rules/enforce-alias-boundaries.js';

export type { EnforceAliasBoundariesOptions } from './rules/enforce-alias-boundaries.js';

export interface AliasBoundariesPlugin {
  meta: { name: string };
  rules: Record<string, unknown>;
}

const plugin: AliasBoundariesPlugin = {
  meta: { name: '@thdk/eslint-plugin' },
  rules: { 'enforce-alias-boundaries': enforceAliasBoundaries },
};

export default plugin;
