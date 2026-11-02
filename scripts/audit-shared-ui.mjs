import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
import postcss from 'postcss';

const defaultRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const slash = value => value.replaceAll('\\', '/');
// Git checkouts may use CRLF on Windows and LF in CI; inventory must describe the same source.
const readSource = file => fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n');

/** Same selector, same complete declarations, same ancestor conditions. Never guesses unused selectors. */
export function exactDuplicateRules(css) {
  const ast = postcss.parse(css);
  const seen = new Map();
  const duplicates = [];
  ast.walkRules(rule => {
    const conditions = [];
    for (let parent = rule.parent; parent?.type !== 'root'; parent = parent?.parent) {
      if (!parent || parent.type !== 'atrule' || !['media', 'supports'].includes(parent.name)) return;
      conditions.unshift([parent.name, parent.params]);
    }
    if (rule.nodes.some(node => !['decl', 'comment'].includes(node.type))) return;
    const declarations = rule.nodes.filter(node => node.type === 'decl').map(node => [node.prop, node.value, Boolean(node.important)]);
    const key = JSON.stringify([conditions, rule.selector, declarations]);
    if (seen.has(key)) duplicates.push(seen.get(key));
    seen.set(key, rule);
  });
  return { ast, duplicates };
}

export function createSharedUiInventory(root = defaultRoot) {
  const files = [];
  function walk(directory) {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true }).sort((a,b) => a.name.localeCompare(b.name,'en'))) {
      const file = path.join(directory, entry.name);
      if (entry.isDirectory()) walk(file);
      else if (/\.(tsx?|css)$/.test(file)) files.push(file);
    }
  }
  walk(path.join(root, 'src'));
  const relative = file => slash(path.relative(root, file));
  const config = ts.readConfigFile(path.join(root, 'tsconfig.json'), ts.sys.readFile);
  const options = ts.parseJsonConfigFileContent(config.config, ts.sys, root).options;
  const incoming = new Map();
  const records = new Map();
  const unresolvedDynamicImports = [];
  for (const file of files) {
    const text = readSource(file);
    const dependencies = [];
    const exports = [];
    const jsx = new Map();
    const ast = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true);
    const addDependency = specifier => {
      const result = specifier.endsWith('.css') && specifier.startsWith('.')
        ? path.resolve(path.dirname(file), specifier)
        : ts.resolveModuleName(specifier, file, options, ts.sys).resolvedModule?.resolvedFileName;
      if (!result) return;
      const resolved = path.resolve(result);
      if (!resolved.startsWith(path.join(root, 'src') + path.sep)) return;
      dependencies.push(resolved);
      if (!incoming.has(resolved)) incoming.set(resolved, new Set());
      incoming.get(resolved).add(file);
    };
    function visit(node) {
      if ((ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) && node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) addDependency(node.moduleSpecifier.text);
      if (ts.isCallExpression(node) && node.expression.kind === ts.SyntaxKind.ImportKeyword) {
        if (node.arguments[0] && ts.isStringLiteral(node.arguments[0])) addDependency(node.arguments[0].text);
        else unresolvedDynamicImports.push(relative(file));
      }
      if ((ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node))) {
        const name = node.tagName.getText(ast);
        if (/^[A-Z]/.test(name)) jsx.set(name, (jsx.get(name) || 0) + 1);
      }
      if (node.modifiers?.some(modifier => modifier.kind === ts.SyntaxKind.ExportKeyword)) {
        if (ts.isVariableStatement(node)) for (const declaration of node.declarationList.declarations) {
          if (ts.isIdentifier(declaration.name) && /^[A-Z]/.test(declaration.name.text)) exports.push(declaration.name.text);
        }
        if (ts.isFunctionDeclaration(node) && node.name && /^[A-Z]/.test(node.name.text)) exports.push(node.name.text);
      }
      if (ts.isExportAssignment(node)) exports.push('default');
      ts.forEachChild(node, visit);
    }
    if (file.endsWith('.css')) {
      for (const match of text.matchAll(/@import\s+["']([^"']+)/g)) if (match[1].startsWith('.')) addDependency(match[1]);
    } else visit(ast);
    records.set(file, { dependencies, exports: [...new Set(exports)].sort(), jsx: Object.fromEntries([...jsx].sort(([a],[b])=>a.localeCompare(b,'en'))) });
  }
  const reachable = new Set();
  function trace(file) {
    if (reachable.has(file)) return;
    reachable.add(file);
    for (const dependency of records.get(file)?.dependencies || []) trace(dependency);
  }
  trace(path.join(root, 'src/main.tsx'));
  const components = files.filter(file => relative(file).startsWith('src/components/') && file.endsWith('.tsx')).map(file => ({
    file: relative(file),
    kind: /[\\/]components[\\/](ui|charts)[\\/]/.test(file) || ['AdminModulePrimitives','AdminModuleHeader','AdminFilterToolbar','DashboardControls','DashboardEmptyState','ProfileIdentity','UserAvatar','AmsBrandLogo'].some(name => path.basename(file,'.tsx') === name) ? 'shared' : 'domain',
    reachable: reachable.has(file),
    exports: records.get(file).exports,
    consumers: [...incoming.get(file) || []].filter(consumer=>reachable.has(consumer)).map(relative).sort(),
  }));
  const stylesheets = files.filter(file => file.endsWith('.css')).map(file => {
    const text = readSource(file);
    const {ast, duplicates} = exactDuplicateRules(text);
    let rules = 0; ast.walkRules(()=>rules++);
    return {file:relative(file), reachable:reachable.has(file), bytes:Buffer.byteLength(text), rules, exactDuplicateRules:duplicates.length};
  });
  const workspaces = files.filter(file=>file.endsWith('.tsx') && (relative(file).startsWith('src/pages/admin/') || /GlobalExecutiveDashboard|TasksWorkspace/.test(file))).map(file=>({file:relative(file),reachable:reachable.has(file),components:records.get(file).jsx}));
  return {
    schemaVersion:1, entry:'src/main.tsx',
    limitations:['Static imports, re-exports and literal dynamic imports; not authenticated role/persistence or visual acceptance evidence.','Import reachability is conservative and does not prove each export/selector is used. Never auto-delete based on this report.'],
    summary:{sourceFiles:files.length,reachableFiles:reachable.size,componentFiles:components.length,sharedComponentFiles:components.filter(item=>item.kind==='shared').length,cssBytes:stylesheets.reduce((sum,item)=>sum+item.bytes,0)},
    unresolvedDynamicImports:[...new Set(unresolvedDynamicImports)].sort(),
    unreachable:files.filter(file=>!reachable.has(file)).map(relative).sort(),
    components,stylesheets,workspaces,
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const inventory = createSharedUiInventory();
  const output = JSON.stringify(inventory,null,2) + '\n';
  const target = path.join(defaultRoot,'docs/ui/shared-ui-inventory.json');
  if (process.argv.includes('--check')) {
    if (!fs.existsSync(target) || readSource(target) !== output) {
      console.error('Shared UI inventory is stale. Run npm run ui:audit and review the diff.');
      process.exitCode = 1;
    }
  } else {
    fs.mkdirSync(path.dirname(target),{recursive:true});
    fs.writeFileSync(target,output);
  }
  console.log(JSON.stringify(inventory.summary));
}
