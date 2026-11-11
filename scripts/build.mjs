/*
 * Builds each kit (kits/<name>/kit.cjs) into the file people import (dist/<name>.json, docs/KITS.md's shape): its
 * patterns' and pages' blocks saved by Marccent Blocks' serializer, so the editor opens them as valid blocks. Marccent
 * Blocks is found by projects.json's path (a checkout with its node_modules).
 *
 *   node scripts/build.mjs
 */
import { readdirSync, readFileSync, writeFileSync, mkdirSync, mkdtempSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { createRequire } from 'node:module';
import { spawnSync } from 'node:child_process';

const ROOT = new URL('..', import.meta.url).pathname;
const require = createRequire(import.meta.url);
const { projects } = JSON.parse(readFileSync(join(ROOT, 'docs', 'projects.json'), 'utf8'));
const BLOCKS = resolve(ROOT, '..', projects.find((p) => p.repo === 'marccent-blocks').path);

const kits = readdirSync(join(ROOT, 'kits')).sort().map((name) => require(join(ROOT, 'kits', name, 'kit.cjs')));

// Every kit's patterns and pages in one spec, serialized in one run.
const spec = {};
for (const { kit, patterns, pages } of kits) {
  for (const [ slug, , , , , blocks ] of patterns) spec[`${kit.name}/pattern/${slug}`] = blocks;
  for (const [ slug, , , blocks ] of pages) spec[`${kit.name}/page/${slug}`] = blocks;
}
const dir = mkdtempSync(join(tmpdir(), 'marccent-kits-'));
writeFileSync(join(dir, 'spec.json'), JSON.stringify(spec));
const run = spawnSync('npm', [ 'run', '--silent', 'serialize' ], {
  cwd: BLOCKS, encoding: 'utf8',
  env: { ...process.env, MARCCENT_SPEC: join(dir, 'spec.json'), MARCCENT_OUT: join(dir, 'out.json') },
});
if (run.status !== 0) {
  console.log(`FAIL build: Marccent Blocks' serializer (${BLOCKS})\n${run.stdout}${run.stderr}`);
  process.exit(1);
}
const out = JSON.parse(readFileSync(join(dir, 'out.json'), 'utf8'));

mkdirSync(join(ROOT, 'dist'), { recursive: true });
for (const { kit, content, patterns, pages, site_content: siteContent } of kits) {
  const file = {
    marccent: 1,
    kit,
    parts: {
      content,
      patterns: Object.fromEntries(patterns.map(([ slug, title, categories, description, keywords ]) => [
        slug, { title, categories, description, keywords, content: out[`${kit.name}/pattern/${slug}`] } ])),
      pages: Object.fromEntries(pages.map(([ slug, title, parent ]) => [ slug, { title, parent, content: out[`${kit.name}/page/${slug}`] } ])),
      site_content: siteContent ?? {},
    },
  };
  writeFileSync(join(ROOT, 'dist', `${kit.name}.json`), JSON.stringify(file, null, '\t') + '\n');
  console.log(`ok   build ${kit.name}: ${patterns.length} patterns, ${pages.length} pages`);
}
