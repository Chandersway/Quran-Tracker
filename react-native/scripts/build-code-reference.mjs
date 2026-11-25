/** Builds a navigable source index. Indexing is deliberately not a parity verdict. */
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const original = path.dirname(root);
const output = path.join(root, 'docs', 'recheck-2026-11-18');
mkdirSync(output, { recursive: true });
const slash = (value) => value.replaceAll('\\', '/');
function list(cwd, extensions, exclusions = []) {
  return execFileSync(
    'rg',
    [
      '--files',
      ...extensions.flatMap((ext) => ['-g', `*.${ext}`]),
      ...['node_modules', 'build', '.gradle', '.git', '.expo', 'dist', ...exclusions].flatMap(
        (name) => ['-g', `!**/${name}/**`],
      ),
    ],
    { cwd, encoding: 'utf8' },
  )
    .trim()
    .split(/\r?\n/)
    .filter(Boolean)
    .map(slash)
    .sort();
}

// Keep newlines/offsets while masking comments and Kotlin string/character literals.
// Kotlin's named declarations are indexed lexically; this is not a Kotlin compiler.
function maskKotlin(source) {
  let result = '';
  let i = 0;
  let depth = 0;
  let state = 'code';
  const blank = (text) => text.replace(/[^\r\n]/g, ' ');
  while (i < source.length) {
    const pair = source.slice(i, i + 2);
    const triple = source.slice(i, i + 3);
    if (state === 'code') {
      if (pair === '//') state = 'line';
      else if (pair === '/*') {
        state = 'block';
        depth = 1;
        result += '  ';
        i += 2;
        continue;
      } else if (triple === '"""') {
        state = 'raw';
        result += '   ';
        i += 3;
        continue;
      } else if (source[i] === '"') state = 'string';
      else if (source[i] === "'") state = 'char';
      else {
        result += source[i++];
        continue;
      }
    } else if (state === 'line' && source[i] === '\n') state = 'code';
    else if (state === 'block') {
      if (pair === '/*') {
        depth++;
        result += '  ';
        i += 2;
        continue;
      }
      if (pair === '*/') {
        if (--depth === 0) state = 'code';
        result += '  ';
        i += 2;
        continue;
      }
    } else if (state === 'raw' && triple === '"""') {
      state = 'code';
      result += '   ';
      i += 3;
      continue;
    } else if (state === 'string' || state === 'char') {
      if (source[i] === '\\') {
        result += blank(source.slice(i, i + 2));
        i += 2;
        continue;
      }
      if (source[i] === (state === 'string' ? '"' : "'")) state = 'code';
    }
    result += blank(source[i++]);
  }
  return result;
}

function kotlinDeclarations(source) {
  const masked = maskKotlin(source);
  const declarations = [];
  const regex =
    /\b(class|interface|object|fun|typealias)\s+(?:<[^>{}]+>\s*)?([A-Za-z_]\w*(?:\.[A-Za-z_]\w*)*)/g;
  for (const match of masked.matchAll(regex)) {
    const name = match[2];
    if (name === 'where') continue;
    declarations.push({
      kind: match[1],
      name,
      line: masked.slice(0, match.index).split('\n').length,
    });
  }
  return declarations;
}

function typescriptDeclarations(file, source) {
  const parsed = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true);
  const declarations = [];
  function visit(node, parent = '') {
    let kind;
    if (ts.isClassDeclaration(node)) kind = 'class';
    else if (ts.isInterfaceDeclaration(node)) kind = 'interface';
    else if (ts.isTypeAliasDeclaration(node)) kind = 'type';
    else if (ts.isEnumDeclaration(node)) kind = 'enum';
    else if (ts.isFunctionDeclaration(node)) kind = 'function';
    else if (ts.isMethodDeclaration(node) || ts.isMethodSignature(node)) kind = 'method';
    else if (
      ts.isVariableDeclaration(node) &&
      node.initializer &&
      (ts.isArrowFunction(node.initializer) || ts.isFunctionExpression(node.initializer))
    )
      kind = 'function-variable';
    const name = node.name?.getText(parsed);
    if (kind && name) {
      declarations.push({
        kind,
        name: parent ? `${parent}.${name}` : name,
        line: parsed.getLineAndCharacterOfPosition(node.getStart(parsed)).line + 1,
      });
    }
    const owner = kind && name ? (parent ? `${parent}.${name}` : name) : parent;
    ts.forEachChild(node, (child) => visit(child, owner));
  }
  visit(parsed);
  return { parsed, declarations };
}

function nativeTypeDeclarations(source) {
  const masked = maskKotlin(source);
  return Array.from(
    masked.matchAll(
      /\b(class|interface|implementation|enum|struct|protocol|extension)\s+([A-Za-z_]\w*)/g,
    ),
    (match) => ({
      kind: match[1],
      name: match[2],
      line: masked.slice(0, match.index).split('\n').length,
    }),
  );
}

function entry(base, file, side) {
  const source = readFileSync(path.join(base, file), 'utf8');
  const declarations = file.endsWith('.kt')
    ? kotlinDeclarations(source)
    : /\.(?:tsx?|jsx?|mjs|cjs)$/.test(file)
      ? typescriptDeclarations(file, source).declarations
      : file.endsWith('.sql')
        ? []
        : nativeTypeDeclarations(source);
  const role = /(^|\/)(tests?|androidTest)(\/|\.)|(?:\.test|_test)\.[^.]+$/.test(file)
    ? 'test'
    : /(^|\/)debug\//.test(file)
      ? 'debug'
      : /(^|\/)generated\//.test(file)
        ? 'generated-content'
        : file.startsWith('scripts/')
          ? 'tooling'
          : 'implementation';
  return {
    path: file,
    side,
    role,
    lines: source.split(/\r?\n/).length,
    sha256: createHash('sha256').update(source).digest('hex'),
    declarations,
  };
}

const kotlin = list(original, ['kt'], ['react-native']).map((file) =>
  entry(original, file, 'kotlin'),
);
const native = list(
  root,
  ['ts', 'tsx', 'js', 'jsx', 'mjs', 'cjs', 'kt', 'java', 'swift', 'm', 'mm', 'h', 'cpp', 'c'],
  ['android', 'ios', '.tooling', 'audio-cache'],
).map((file) => entry(root, file, 'react-native'));
const backend = list(path.join(original, 'supabase'), ['ts', 'sql']).map((file) =>
  entry(original, `supabase/${file}`, 'supabase'),
);
function typeProperties(file, typeName) {
  const source = readFileSync(path.join(root, file), 'utf8');
  const parsed = typescriptDeclarations(file, source).parsed;
  const type = parsed.statements.find(
    (node) => ts.isTypeAliasDeclaration(node) && node.name.text === typeName,
  );
  if (!type || !ts.isTypeLiteralNode(type.type)) throw new Error(`Missing ${typeName}`);
  return type.type.members.filter(ts.isPropertySignature).map((node) => ({
    name: node.name.getText(parsed),
    type: node.type?.getText(parsed),
    line: parsed.getLineAndCharacterOfPosition(node.getStart(parsed)).line + 1,
    path: file,
  }));
}
const inventory = {
  schemaVersion: 1,
  meaning:
    'Structural source index, not an assertion of semantic parity or native acceptance. Kotlin is a lexical named-declaration index; TypeScript/JavaScript use the compiler AST. Other native sources list lexically identified type declarations (not all methods). SQL is indexed at file level, with schema/RPC behavior documented in the backend guide. Generated native projects, build caches and dependencies are excluded.',
  counts: {
    kotlinFiles: kotlin.length,
    reactNativeFiles: native.length,
    backendFiles: backend.length,
    kotlinDeclarations: kotlin.reduce((sum, file) => sum + file.declarations.length, 0),
    reactNativeDeclarations: native.reduce((sum, file) => sum + file.declarations.length, 0),
    backendDeclarations: backend.reduce((sum, file) => sum + file.declarations.length, 0),
  },
  routes: typeProperties('src/app/navigation/types.ts', 'RootStack'),
  preferences: typeProperties('src/state/models.ts', 'Preferences'),
  files: [...kotlin, ...native, ...backend],
};
writeFileSync(path.join(output, 'source-index.json'), `${JSON.stringify(inventory, null, 2)}\n`);

const escape = (value) => value.replaceAll('|', '\\|').replaceAll('\n', ' ');
const sourceLink = (file, line) => {
  const prefix = file.side === 'react-native' ? '../../' : '../../../';
  return `${prefix}${file.path}${line ? `#L${line}` : ''}`;
};
const lines = [
  '# Volledige bronindex',
  '',
  'Gegenereerd met `node scripts/build-code-reference.mjs`. Dit is de vindplaats van bestanden, benoemde functies, klassen, interfaces en types; **het bestaan van een naam bewijst geen functionele gelijkwaardigheid**. De inhoudelijke beoordeling staat in de deelrapporten van deze controle.',
  '',
  `${kotlin.length} oorspronkelijke Kotlin-bestanden, ${native.length} React Native-bron-/test-/toolbestanden en ${backend.length} Supabase-bron-/migratie-/testbestanden. Gegenereerde Android/iOS-projecten, dependencies en buildcaches zijn uitgesloten. Kotlin-declaraties worden lexicaal gevonden buiten commentaar en strings; TypeScript/JavaScript-declaraties worden met de compiler-AST gelezen. Anonieme callbacks zijn geen afzonderlijk benoemde functie. Overige native bronnen hebben een lexicale typenindex; niet alle native methoden worden afzonderlijk ontleed. SQL staat op bestandsniveau in deze index; tabellen, RPC's en rechten worden inhoudelijk uitgelegd in de backendhandleiding.`,
  '',
  'De [JSON-index](source-index.json) bevat de volledige lijst, regelverwijzingen, rollen, hashes, routes en persistente voorkeuren. Dit is geen lijst waarin iedere bronregel een aparte feature is. Gebruik de bronlink om de volledige implementatie te lezen.',
  '',
  '## Persistente appvoorkeuren',
  '',
  '| Sleutel | Type/waarden | Bron |',
  '| --- | --- | --- |',
  ...inventory.preferences.map(
    (pref) =>
      `| \`${pref.name}\` | \`${escape(pref.type)}\` | [models.ts:${pref.line}](../../${pref.path}#L${pref.line}) |`,
  ),
  '',
  'Dit model is niet de volledige lijst instellingen: servergebonden groeps-/meldingsvoorkeuren en zelfstandig opgeslagen leesplannen hebben een eigen opslagcontract. Die worden in de technische handleidingen apart beschreven.',
  '',
];
for (const [title, files] of [
  ['Oorspronkelijke Kotlin', kotlin],
  ['React Native en ondersteunende code', native],
  ['Supabase-functions, migraties en tests', backend],
]) {
  lines.push(`## ${title}`, '');
  for (const file of files) {
    lines.push(
      `### ${file.path}`,
      '',
      `[Volledige bron](${sourceLink(file)}), ${file.lines} regels, rol: ${file.role}.`,
      '',
    );
    if (file.declarations.length) {
      lines.push('| Soort | Declaratie | Regel |', '| --- | --- | --- |');
      for (const declaration of file.declarations)
        lines.push(
          `| ${declaration.kind} | \`${escape(declaration.name)}\` | [${declaration.line}](${sourceLink(file, declaration.line)}) |`,
        );
      lines.push('');
    } else lines.push('Geen benoemde declaraties in deze index; zie de volledige bron.', '');
  }
}
writeFileSync(path.join(output, 'CODE_INDEX.md'), `${lines.join('\n')}\n`);
console.log(JSON.stringify(inventory.counts));
