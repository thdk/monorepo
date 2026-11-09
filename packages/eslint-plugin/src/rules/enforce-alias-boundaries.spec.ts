import { RuleTester } from 'eslint';
import rule from './enforce-alias-boundaries.js';

const ruleTester = new RuleTester();

const options = [
  {
    root: '/project',
    aliases: {
      '@routes': 'app/routes',
      '@shared': 'app/shared',
      '@orders': 'app/routes/orders',
    },
  },
];

const orderFile = '/project/app/routes/orders/detail/parts/file.js';
const sharedFile = '/project/app/shared/ui/file.js';

ruleTester.run('enforce-alias-boundaries', rule, {
  valid: [
    {
      name: 'relative import staying inside the same alias',
      code: "import a from '../sibling';",
      filename: '/project/app/shared/ui/file.js',
      options,
    },
    {
      name: 'deep relative import staying inside the same innermost alias',
      code: "import a from '../../helpers/a';",
      filename: orderFile,
      options,
    },
    {
      name: 'alias import crossing into another alias',
      code: "import a from '@shared/ui/button';",
      filename: orderFile,
      options,
    },
    {
      name: 'package imports are ignored',
      code: "import a from 'react';",
      filename: orderFile,
      options,
    },
    {
      name: 'relative import that targets a path outside every alias',
      code: "import a from '../../../../config/env';",
      filename: orderFile,
      options,
    },
    {
      name: 'alias that is only a string prefix of the specifier is not matched',
      code: "import a from '@shared-extra/x';",
      filename: orderFile,
      options,
    },
  ],
  invalid: [
    {
      name: 'relative import crossing into another alias',
      code: "import a from '../../../../shared/ui/button';",
      filename: orderFile,
      options,
      errors: [{ messageId: 'useAlias' }],
      output: "import a from '@shared/ui/button';",
    },
    {
      name: 'relative import that resolves to the alias root',
      code: "import a from '../../../../shared';",
      filename: orderFile,
      options,
      errors: [{ messageId: 'useAlias' }],
      output: "import a from '@shared';",
    },
    {
      name: 'uses the innermost alias when aliases are nested',
      code: "import a from '../../shared/x';",
      filename: '/project/app/routes/users/file.js',
      options,
      errors: [{ messageId: 'useAlias' }],
      output: "import a from '@shared/x';",
    },
    {
      name: 'relative import leaving the innermost alias for its parent alias',
      code: "import a from '../../../layout';",
      filename: orderFile,
      options,
      errors: [{ messageId: 'useAlias' }],
      output: "import a from '@routes/layout';",
    },
    {
      name: 'alias import resolving into the same alias becomes relative',
      code: "import a from '@shared/ui/button';",
      filename: sharedFile,
      options,
      errors: [{ messageId: 'useRelative' }],
      output: "import a from './button';",
    },
    {
      name: 'same-alias alias import going up gets a parent path',
      code: "import a from '@shared/hooks/use-x';",
      filename: sharedFile,
      options,
      errors: [{ messageId: 'useRelative' }],
      output: "import a from '../hooks/use-x';",
    },
    {
      name: 're-exports are checked',
      code: "export { a } from '../../../../shared/a';",
      filename: orderFile,
      options,
      errors: [{ messageId: 'useAlias' }],
      output: "export { a } from '@shared/a';",
    },
    {
      name: 'export * is checked',
      code: "export * from '../../../../shared/a';",
      filename: orderFile,
      options,
      errors: [{ messageId: 'useAlias' }],
      output: "export * from '@shared/a';",
    },
    {
      name: 'dynamic imports are checked and keep their quote style',
      code: 'const a = import("../../../../shared/a");',
      filename: orderFile,
      options,
      errors: [{ messageId: 'useAlias' }],
      output: 'const a = import("@shared/a");',
    },
    {
      name: 'require calls are checked',
      code: "const a = require('../../../../shared/a');",
      filename: orderFile,
      options,
      errors: [{ messageId: 'useAlias' }],
      output: "const a = require('@shared/a');",
    },
    {
      name: 'file outside every alias must use the alias to enter one',
      code: "import a from '../app/shared/a';",
      filename: '/project/scripts/file.js',
      options,
      errors: [{ messageId: 'useAlias' }],
      output: "import a from '@shared/a';",
    },
  ],
});
