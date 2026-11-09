import plugin from './index.js';

describe('@thdk/eslint-plugin', () => {
  it('exposes plugin meta and the enforce-alias-boundaries rule', () => {
    expect(plugin.meta?.name).toBe('@thdk/eslint-plugin');
    expect(Object.keys(plugin.rules)).toEqual(['enforce-alias-boundaries']);
  });
});
