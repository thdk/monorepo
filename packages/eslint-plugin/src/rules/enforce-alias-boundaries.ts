import path from 'node:path';

export interface EnforceAliasBoundariesOptions {
  /** Alias name -> directory it points to, relative to `root`. */
  aliases: Record<string, string>;
  /** Directory the alias directories are relative to. Defaults to the ESLint cwd. */
  root?: string;
}

interface Alias {
  name: string;
  dir: string;
}

interface LiteralNode {
  type: string;
  value?: unknown;
  raw?: string;
  range?: [number, number];
}

interface RuleContext {
  cwd?: string;
  filename: string;
  options: EnforceAliasBoundariesOptions[];
  report(descriptor: {
    node: LiteralNode;
    messageId: 'useAlias' | 'useRelative';
    data: Record<string, string>;
    fix(fixer: {
      replaceText(node: LiteralNode, text: string): unknown;
    }): unknown;
  }): void;
}

const isInside = (dir: string, target: string) => {
  const rel = path.relative(dir, target);
  return !rel.startsWith('..') && !path.isAbsolute(rel);
};

const toPosix = (p: string) => p.split(path.sep).join('/');

const findInnermost = (aliases: Alias[], target: string) =>
  aliases
    .filter((alias) => isInside(alias.dir, target))
    .sort((a, b) => b.dir.length - a.dir.length)[0];

const toAliasSpecifier = (alias: Alias, target: string) => {
  const rest = toPosix(path.relative(alias.dir, target));
  return rest ? `${alias.name}/${rest}` : alias.name;
};

const toRelativeSpecifier = (fromFile: string, target: string) => {
  const rel = toPosix(path.relative(path.dirname(fromFile), target));
  return rel.startsWith('.') ? rel : `./${rel}`;
};

const rule = {
  meta: {
    type: 'suggestion',
    fixable: 'code',
    schema: [
      {
        type: 'object',
        properties: {
          aliases: {
            type: 'object',
            additionalProperties: { type: 'string' },
          },
          root: { type: 'string' },
        },
        required: ['aliases'],
        additionalProperties: false,
      },
    ],
    messages: {
      useAlias:
        "Import crosses into the '{{alias}}' alias; use '{{replacement}}' instead of a relative path.",
      useRelative:
        "Import stays inside the '{{alias}}' alias; use the relative path '{{replacement}}' instead.",
    },
  },
  create(context: RuleContext) {
    const [{ aliases: aliasMap, root }] = context.options;
    const base = path.resolve(root ?? context.cwd ?? process.cwd());
    const aliases: Alias[] = Object.entries(aliasMap).map(([name, dir]) => ({
      name,
      dir: path.resolve(base, dir),
    }));
    const file = context.filename;
    const fileAlias = findInnermost(aliases, file);

    const check = (node: LiteralNode | null | undefined) => {
      if (!node || node.type !== 'Literal' || typeof node.value !== 'string') {
        return;
      }
      const specifier = node.value;
      const quote = node.raw?.[0] ?? "'";
      const replaceWith = (text: string) => (fixer: {
        replaceText(n: LiteralNode, t: string): unknown;
      }) => fixer.replaceText(node, `${quote}${text}${quote}`);

      if (specifier.startsWith('.')) {
        const target = path.resolve(path.dirname(file), specifier);
        const targetAlias = findInnermost(aliases, target);
        if (!targetAlias || targetAlias === fileAlias) return;
        const replacement = toAliasSpecifier(targetAlias, target);
        context.report({
          node,
          messageId: 'useAlias',
          data: { alias: targetAlias.name, replacement },
          fix: replaceWith(replacement),
        });
        return;
      }

      const used = aliases
        .filter(
          (a) => specifier === a.name || specifier.startsWith(`${a.name}/`),
        )
        .sort((a, b) => b.name.length - a.name.length)[0];
      if (!used) return;

      const target = path.resolve(used.dir, specifier.slice(used.name.length + 1));
      const targetAlias = findInnermost(aliases, target);
      if (!fileAlias || targetAlias !== fileAlias) return;
      const replacement = toRelativeSpecifier(file, target);
      context.report({
        node,
        messageId: 'useRelative',
        data: { alias: fileAlias.name, replacement },
        fix: replaceWith(replacement),
      });
    };

    return {
      ImportDeclaration: (n: { source: LiteralNode }) => check(n.source),
      ExportNamedDeclaration: (n: { source?: LiteralNode | null }) =>
        check(n.source),
      ExportAllDeclaration: (n: { source: LiteralNode }) => check(n.source),
      ImportExpression: (n: { source: LiteralNode }) => check(n.source),
      CallExpression: (n: {
        callee: { type: string; name?: string };
        arguments: LiteralNode[];
      }) => {
        if (n.callee.type === 'Identifier' && n.callee.name === 'require') {
          check(n.arguments[0]);
        }
      },
    };
  },
};

export default rule;
