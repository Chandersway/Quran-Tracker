import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
import source from '../src/i18n/source-catalog.json';
import aliases from '../src/i18n/source-aliases.json';
import newCopy from '../src/i18n/new-ui-copy.json';
import screenKeys from '../src/i18n/screen-source-keys.json';

const root = process.cwd();
const catalog = source.entries as Record<string, { values: Partial<Record<string, string>> }>;
const exact = new Map(
  Object.entries(catalog)
    .filter(([, value]) => value.values.en)
    .map(([key, row]) => [row.values.en!, key]),
);
const compatibility = aliases as Record<string, string>;
const newKeys = newCopy.entries as Record<string, unknown>;
const rawSource = JSON.parse(
  fs.readFileSync(path.join(root, 'docs/kotlin-copy-literals.json'), 'utf8'),
) as { literals: { value: string; path: string; line: number }[] };
const rawValues = new Map(rawSource.literals.map((row) => [row.value, row]));
const fields = screenKeys as Record<string, Record<string, string>>;
type Entry = {
  path: string;
  line: number;
  kind: string;
  value: string;
  status: string;
  sourceKey?: string;
};
const entries: Entry[] = [];
const controlledProps = new Set([
  'title',
  'label',
  'subtitle',
  'message',
  'placeholder',
  'accessibilityLabel',
  'action',
  'error',
]);

function files(folder: string): string[] {
  return fs
    .readdirSync(folder, { withFileTypes: true })
    .flatMap((entry) =>
      entry.isDirectory()
        ? files(path.join(folder, entry.name))
        : entry.name.endsWith('.tsx')
          ? [path.join(folder, entry.name)]
          : [],
    );
}
for (const file of files(path.join(root, 'src/features'))) {
  const text = fs.readFileSync(file, 'utf8');
  const ast = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const relative = path.relative(root, file).replaceAll('\\', '/');
  const screen = relative.includes('groups/GroupsScreen')
    ? 'groups'
    : relative.includes('groups/GroupScreen')
      ? 'group'
      : relative.includes('account/AccountScreen')
        ? 'account'
        : relative.includes('NotificationsScreen')
          ? 'notifications'
          : relative.includes('SettingsScreen')
            ? 'settings'
            : relative.includes('NotesScreen')
              ? 'notes'
              : relative.includes('study/StudyScreen')
                ? 'study'
                : relative.includes('BooksScreen')
                  ? 'books'
                  : '';
  function add(node: ts.Node, value: string, kind: string, field?: string) {
    value = value.trim();
    if (!value || !/[A-Za-z\u0600-\u06ff]/.test(value) || /^(https?:|\d+:\d+)/.test(value)) return;
    const mapped = field ? fields[screen]?.[field] : undefined;
    const key = mapped ?? (value in catalog ? value : (compatibility[value] ?? exact.get(value)));
    entries.push({
      path: relative,
      line: ast.getLineAndCharacterOfPosition(node.getStart(ast)).line + 1,
      kind,
      value,
      status:
        key && key in newKeys
          ? 'explicit-new-ui-copy-review'
          : key
            ? mapped
              ? 'source-field-map'
              : value === key
                ? 'source-key'
                : compatibility[value]
                  ? 'compatibility-source-alias'
                  : 'exact-source-value'
            : value in newKeys
              ? 'explicit-new-ui-copy-review'
              : rawValues.has(value)
                ? 'raw-source-value-locale-group-unverified'
                : 'needs-source-reconciliation-or-new-copy-review',
      ...(key ? { sourceKey: key } : {}),
    });
  }
  function literals(node: ts.Node, kind: string) {
    if (ts.isStringLiteralLike(node)) {
      add(node, node.text, kind);
      return;
    }
    if (ts.isConditionalExpression(node)) {
      literals(node.whenTrue, kind);
      literals(node.whenFalse, kind);
      return;
    }
    if (
      ts.isBinaryExpression(node) &&
      node.operatorToken.kind === ts.SyntaxKind.AmpersandAmpersandToken
    ) {
      literals(node.right, kind);
      return;
    }
    if (
      ts.isCallExpression(node) &&
      ts.isIdentifier(node.expression) &&
      ['t', 'format', 'template', 'interpolate'].includes(node.expression.text)
    ) {
      const key = node.arguments[0];
      if (key && ts.isStringLiteralLike(key)) add(key, key.text, 'localization-call');
      return;
    }
    // Arguments to formatters/date constructors/callbacks are implementation
    // details or content identifiers, not their rendered return values.
    if (ts.isCallExpression(node) || ts.isNewExpression(node)) return;
    if (ts.isTemplateExpression(node)) {
      const fixed = node.head.text + node.templateSpans.map((span) => span.literal.text).join('');
      if (!/[A-Za-z\u0600-\u06ff]/.test(fixed)) return;
      const value =
        node.head.text +
        node.templateSpans
          .map((span) => '${' + span.expression.getText(ast) + '}' + span.literal.text)
          .join('');
      add(node, value, 'rendered-template');
      return;
    }
    ts.forEachChild(node, (child) => literals(child, kind));
  }
  function walk(node: ts.Node) {
    if (
      ts.isJsxAttribute(node) &&
      controlledProps.has(node.name.getText(ast)) &&
      node.initializer
    ) {
      literals(
        ts.isJsxExpression(node.initializer) && node.initializer.expression
          ? node.initializer.expression
          : node.initializer,
        'controlled-ui-property',
      );
    }
    if (ts.isJsxElement(node) && ['T', 'Text'].includes(node.openingElement.tagName.getText(ast))) {
      const attributes = node.openingElement.attributes.properties;
      const optOut = attributes.some(
        (attribute) =>
          ts.isJsxAttribute(attribute) &&
          (attribute.name.getText(ast) === 'arabic' ||
            (attribute.name.getText(ast) === 'translate' &&
              attribute.initializer &&
              ts.isJsxExpression(attribute.initializer) &&
              attribute.initializer.expression?.kind === ts.SyntaxKind.FalseKeyword)),
      );
      if (!optOut)
        for (const child of node.children) {
          if (ts.isJsxText(child)) add(child, child.text, 'rendered-jsx-text');
          else if (ts.isJsxExpression(child) && child.expression)
            literals(child.expression, 'rendered-expression');
        }
    }
    if (
      ts.isPropertyAssignment(node) &&
      node.name.getText(ast) === 'en' &&
      ts.isObjectLiteralExpression(node.initializer)
    ) {
      for (const field of node.initializer.properties)
        if (ts.isPropertyAssignment(field) && ts.isStringLiteralLike(field.initializer))
          add(
            field.initializer,
            field.initializer.text,
            'locale-record-field',
            field.name.getText(ast).replace(/^['"]|['"]$/g, ''),
          );
    }
    ts.forEachChild(node, walk);
  }
  walk(ast);
}
const unique = [
  ...new Map(
    entries.map((entry) => [`${entry.path}:${entry.line}:${entry.value}`, entry]),
  ).values(),
];
const pending = unique.filter(
  (entry) => entry.status === 'needs-source-reconciliation-or-new-copy-review',
);
fs.writeFileSync(
  path.join(root, 'docs/COPY_REVIEW.json'),
  JSON.stringify(
    {
      schemaVersion: 1,
      method:
        'TypeScript AST of controlled JSX text/properties/localization calls and English locale record fields. Dynamic/user/Quran/backend content is not automatically translated. Locale-record entries are review candidates, not proof every field renders.',
      sourceCatalogEntries: Object.keys(catalog).length,
      preservedSourceLiterals: JSON.parse(
        fs.readFileSync(path.join(root, 'docs/kotlin-copy-literals.json'), 'utf8'),
      ).literals.length,
      explicitNewCopy: 'src/i18n/new-ui-copy.json (requires-user-copy-review)',
      counts: { total: unique.length, pending: pending.length },
      entries: unique,
    },
    null,
    2,
  ) + '\n',
  'utf8',
);
fs.writeFileSync(
  path.join(root, 'docs/COPY_REVIEW.md'),
  [
    '# Source copy review',
    '',
    `The source catalog contains ${Object.keys(catalog).length} semantic/structured source entries and the raw literal inventory preserves all ${JSON.parse(fs.readFileSync(path.join(root, 'docs/kotlin-copy-literals.json'), 'utf8')).literals.length} UI-source literals with source locations.`,
    '',
    `TypeScript AST inspection found ${unique.length} controlled UI text references; ${pending.length} still need source reconciliation or explicit review as genuinely new functional copy. This is an open review list, not a claim of full localization parity. Unknown text remains visible instead of being silently machine translated.`,
    '',
    '`new-ui-copy.json` explicitly separates necessary new RN affordances and API-only operational panels from the curated Kotlin wording. No new marketing prose is canonical.',
    '',
    '| Screen | Line | Text needing reconciliation |',
    '|---|---:|---|',
    ...pending.map(
      (entry) =>
        `| \`${entry.path}\` | ${entry.line} | ${entry.value.replaceAll('|', '\\|').replaceAll('\n', ' ')} |`,
    ),
    '',
  ].join('\n'),
  'utf8',
);
process.stdout.write(
  JSON.stringify({
    total: unique.length,
    pending: pending.length,
    sourceCatalogEntries: Object.keys(catalog).length,
  }) + '\n',
);
