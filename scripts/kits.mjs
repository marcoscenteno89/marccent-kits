/*
 * The kits check (marccent-theme's docs/KITS.md): each built kit (dist/<name>.json) against the theme this repo pins
 * (node_modules/marccent-theme, or --theme <path>) and Marccent Blocks and Content (projects.json's paths). Fails when:
 * the kit header is missing a field, its output isn't one of markup/outputs.json's, or a kit it needs doesn't exist;
 * a block isn't one WordPress, Marccent Blocks or Marccent Content has; a class isn't one the theme defines; a component
 * in the header isn't in markup/settings.json, or one its blocks use is missing from the header; a group, field or post
 * type name isn't full words. Importing each kit into a fresh WordPress comes once Marccent Content's import adds.
 *
 *   node scripts/kits.mjs [--theme <path>]
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const at = process.argv.indexOf('--theme');
const THEME = at > -1 ? resolve(process.argv[at + 1]) : join(ROOT, 'node_modules', 'marccent-theme');
const json = (path) => JSON.parse(readFileSync(path, 'utf8'));
const { projects } = json(join(ROOT, 'docs', 'projects.json'));
const path = (repo) => resolve(ROOT, '..', projects.find((p) => p.repo === repo).path);
const BLOCKS = path('marccent-blocks');
const CONTENT = path('marccent-content');

const css = readdirSync(join(THEME, 'styles'), { recursive: true }).filter((f) => f.endsWith('.css'))
  .map((f) => readFileSync(join(THEME, 'styles', f), 'utf8')).join('\n').replace(/\/\*[\s\S]*?\*\//g, '');
const settings = json(join(THEME, 'markup', 'settings.json'));
const outputs = Object.keys(json(join(THEME, 'markup', 'outputs.json')).outputs);
const map = json(join(BLOCKS, 'tools', 'settings-map.json')).blocks;
const blocks = new Set([
  ...readdirSync(join(BLOCKS, 'src', 'blocks')).map((b) => `marccent/${b}`),
  ...readdirSync(join(CONTENT, 'blocks')).map((b) => json(join(CONTENT, 'blocks', b, 'block.json')).name),
]);
// Classes WordPress writes on saved blocks (wp-block-*, has-*, is-*, align*), and the icon font's (fa-*).
const theirs = (c) => /^(wp-|has-|is-|align|fa-)/.test(c);
const defined = (c) => new RegExp(`\\.${c.replace(/[^\w-]/g, '\\$&')}(?![\\w-])`).test(css);
// Short forms full words replace (PRODUCT-LINE.md 5.4).
const SHORT = new Set([ 'q', 'a', 'lat', 'lng', 'lon', 'addr', 'desc', 'img', 'num', 'qty', 'tel', 'msg', 'btn', 'cat', 'cats', 'dept', 'pic', 'pics', 'txt', 'url', 'cta', 'faq', 'org', 'pct', 'amt', 'min', 'max', 'col', 'cols' ]);
const words = (name) => name.split(/[_-]/).filter((w) => w.length < 2 || SHORT.has(w));

const files = existsSync(join(ROOT, 'dist')) ? readdirSync(join(ROOT, 'dist')).filter((f) => f.endsWith('.json')).sort() : [];
const names = new Set(files.map((f) => f.replace(/\.json$/, '')));
let failed = 0;
for (const file of files) {
  const { marccent, kit = {}, parts = {} } = json(join(ROOT, 'dist', file));
  const fails = [];
  if (marccent !== 1) fails.push('not a Marccent export file (marccent: 1)');
  for (const key of [ 'name', 'title', 'output', 'about', 'version', 'components', 'needs' ]) if (kit[key] === undefined) fails.push(`kit.${key} is missing`);
  if (kit.name && `${kit.name}.json` !== file) fails.push(`kit.name ${kit.name} isn't its file's`);
  if (kit.output && !outputs.includes(kit.output)) fails.push(`output ${kit.output} isn't one of markup/outputs.json's`);
  for (const need of kit.needs ?? []) if (!names.has(need)) fails.push(`needs ${need}, which isn't a kit here`);
  for (const c of kit.components ?? []) if (!settings[c]) fails.push(`component ${c} isn't in markup/settings.json`);

  const markup = [ ...Object.values(parts.patterns ?? {}), ...Object.values(parts.pages ?? {}) ].map((x) => x.content ?? '').join('\n');
  const used = new Set([ ...markup.matchAll(/<!-- wp:([a-z0-9-]+(?:\/[a-z0-9-]+)?)/g) ].map((m) => (m[1].includes('/') ? m[1] : `core/${m[1]}`)));
  for (const b of used) {
    if (!b.startsWith('core/') && !blocks.has(b)) fails.push(`block ${b} isn't one Marccent Blocks or Content has`);
    const component = b.startsWith('marccent/') && map[b.slice(9)]?.component;
    if (component && !(kit.components ?? []).includes(component)) fails.push(`block ${b} is ${component}, missing from kit.components`);
  }
  const classes = new Set([ ...markup.matchAll(/class="([^"]*)"/g), ...markup.matchAll(/"className":"([^"]*)"/g) ].flatMap((m) => m[1].split(/\s+/)).filter(Boolean));
  for (const c of classes) if (!theirs(c) && !defined(c)) fails.push(`class .${c} isn't defined in the theme's styles/`);

  const { groups = {}, types = {} } = parts.content ?? {};
  for (const [ g, group ] of Object.entries(groups)) {
    for (const w of words(g)) fails.push(`group ${g}: "${w}" isn't a full word`);
    for (const f of Object.keys(group.fields ?? {})) for (const w of words(f)) fails.push(`field ${g}.${f}: "${w}" isn't a full word`);
  }
  for (const t of Object.keys(types)) for (const w of words(t)) fails.push(`post type ${t}: "${w}" isn't a full word`);

  for (const f of fails) console.log(`FAIL ${file}: ${f}`);
  failed += fails.length;
  if (!fails.length) console.log(`ok   ${file}: ${Object.keys(groups).length} groups, ${Object.keys(types).length} post types, ${Object.keys(parts.patterns ?? {}).length} patterns, ${Object.keys(parts.pages ?? {}).length} pages, ${used.size} blocks, ${classes.size} classes`);
}
if (!files.length) console.log('FAIL no kits built (npm run build)');
process.exit(failed || !files.length ? 1 : 0);
