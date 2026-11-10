# @thdk/eslint-plugin

ESLint rules for monorepo and app structure. Flat config only (ESLint 9+).

> **Status:** pre-1.0. Rule options and messages may still change between minor versions.

## The problem

Import aliases (`@components/button`) are great for shared code, but hard to use consistently:

- With nothing enforcing them, deeply nested files end up with `../../../../components/button`, which breaks every time a file moves.
- Lint rules that force aliases everywhere go too far: a file inside `app/components/` is made to import its own sibling as `@components/sibling` instead of `./sibling`, and files that move together no longer keep working imports.

`enforce-alias-boundaries` draws the line at the **alias boundary**: crossing one requires the alias, staying inside one requires a relative path. Both directions are autofixable.

## Install

```sh
npm i -D @thdk/eslint-plugin
```

Requires ESLint 9+ with flat config (`eslint.config.*`).

## Quick start

```js
// eslint.config.mjs
import thdk from '@thdk/eslint-plugin';

export default [
  {
    plugins: { '@thdk': thdk },
    rules: {
      '@thdk/enforce-alias-boundaries': [
        'error',
        {
          root: import.meta.dirname,
          aliases: {
            '@components': 'app/components',
            '@hooks': 'app/hooks',
            '@modules/cycles': 'app/modules/cycles',
          },
        },
      ],
    },
  },
];
```

The aliases must also exist in your `tsconfig.json` `paths` (and bundler config, e.g. Vite `resolve.alias`). The rule only rewrites import specifiers; it does not configure resolution.

```jsonc
// tsconfig.json
{
  "compilerOptions": {
    "paths": {
      "@components/*": ["./app/components/*"],
      "@hooks/*": ["./app/hooks/*"],
      "@modules/cycles/*": ["./app/modules/cycles/*"],
    },
  },
}
```

## Rules

| Rule                                                    | Fixable | Description                                                                                          |
| ------------------------------------------------------- | ------- | ---------------------------------------------------------------------------------------------------- |
| [`enforce-alias-boundaries`](#enforce-alias-boundaries) | yes     | Use an alias when an import crosses an alias boundary, and a relative path when it stays inside one. |

### `enforce-alias-boundaries`

Every file and every import target is mapped to its **innermost** alias, the one with the longest matching directory. Then:

| Importing file is in... | Import target is in... | Required form |
| ----------------------- | ---------------------- | ------------- |
| alias A                 | alias A (same)         | relative      |
| alias A                 | alias B (different)    | alias         |
| no alias                | any alias              | alias         |
| any                     | no alias, or a package | left alone    |

Given the config above:

```ts
// app/routes/centers/$centerId/cycles/route.tsx  (not inside any alias)
import { Button } from '../../../../components/button'; // reported
import { Button } from '@components/button'; //            ok

// app/components/form/field.tsx  (inside @components)
import { Button } from '@components/button'; //            reported, fix: '../button'
import { Button } from '../button'; //                     ok
import { useId } from '../../hooks/use-id'; //             reported, fix: '@hooks/use-id'

// app/modules/cycles/forms/cycle-form.tsx  (innermost alias: @modules/cycles)
import { cycle } from './cycle'; //                        ok
import { cycle } from '@modules/cycles/forms/cycle'; //   reported, fix: './cycle'
```

Messages:

- `Import crosses into the '@components' alias; use '@components/button' instead of a relative path.`
- `Import stays inside the '@components' alias; use the relative path '../button' instead.`

The rule checks `import`, `export ... from`, `export * from`, dynamic `import()` and `require()`. The autofix keeps your quote style and never touches the file extension.

#### Options

| Option    | Type                     | Description                                                            |
| --------- | ------------------------ | ---------------------------------------------------------------------- |
| `aliases` | `Record<string, string>` | Alias name to directory, relative to `root`. Required.                 |
| `root`    | `string`                 | Directory the alias paths are relative to. Defaults to the ESLint cwd. |

`root` defaults to the directory ESLint runs from. In a monorepo where ESLint runs per project, or from different directories, set it explicitly (`import.meta.dirname` in an `.mjs` config) so alias directories resolve the same everywhere.

Nested aliases are supported: with both `@modules` and `@modules/cycles` declared, a file in `app/modules/cycles` belongs to `@modules/cycles`, and importing a sibling module under `@modules` counts as crossing a boundary.

#### Limitations

- Aliases are plain prefixes. Wildcard aliases like `@modules/*` are not supported; declare each module as its own alias if it should act as a boundary.
- Only string-literal specifiers are checked. Template literals and non-literal `require(x)` calls are ignored, as are test helpers like `vi.mock('...')`.
- Resolution is path-based. Symlinks are not followed and `tsconfig` `paths` are not read.

## Contributing

Issues and pull requests are welcome at [thdk/monorepo](https://github.com/thdk/monorepo/issues). The plugin lives in `packages/eslint-plugin`.

The intent of the rule is inspired by `useAliasWhen: 'parent-import-cross-alias'` in [eslint-plugin-import-alias#242](https://github.com/dword-design/eslint-plugin-import-alias/pull/242).

## License

[MIT](./LICENSE)
