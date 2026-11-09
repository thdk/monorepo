# @thdk/eslint-plugin

A small collection of ESLint rules for monorepo and app structure. Flat config only (ESLint >= 9).

```sh
npm i -D @thdk/eslint-plugin
```

```js
// eslint.config.mjs
import thdk from '@thdk/eslint-plugin';

export default [
  {
    plugins: { '@thdk': thdk },
    rules: {
      '@thdk/enforce-alias-boundaries': [
        'error',
        { aliases: { '@routes': 'app/routes', '@shared': 'app/shared' } },
      ],
    },
  },
];
```

## Rules

| Rule                                                    | Fixable | Description                                                                                          |
| ------------------------------------------------------- | ------- | ---------------------------------------------------------------------------------------------------- |
| [`enforce-alias-boundaries`](#enforce-alias-boundaries) | yes     | Use an alias when an import crosses an alias boundary, and a relative path when it stays inside one. |

### `enforce-alias-boundaries`

Keeps short relative imports inside a module and forces an alias as soon as an import
crosses into another one, so deeply nested files never import `../../../../shared/x`.

Every file and import target is mapped to its **innermost** alias (the alias with the
longest matching directory). Then:

- relative import into a _different_ alias: reported, fixed to the alias
- alias import resolving into the _same_ alias as the importing file: reported, fixed to a relative path
- everything else (packages, paths outside every alias, relative imports within one alias) is left alone

Checks `import`, `export ... from`, `export *`, dynamic `import()` and `require()`.

Options:

| Option    | Type                     | Description                                                            |
| --------- | ------------------------ | ---------------------------------------------------------------------- |
| `aliases` | `Record<string, string>` | Alias name to directory, relative to `root`. Required.                 |
| `root`    | `string`                 | Directory the alias paths are relative to. Defaults to the ESLint cwd. |

Limitations: aliases are plain prefixes. Wildcard aliases like `@modules/*` are not
supported; declare each module as its own alias if it should act as a boundary. The
aliases must also exist in your `tsconfig` `paths` / bundler config; this rule only
rewrites specifiers.

The intent is inspired by `useAliasWhen: 'parent-import-cross-alias'` in
[eslint-plugin-import-alias#242](https://github.com/dword-design/eslint-plugin-import-alias/pull/242).
