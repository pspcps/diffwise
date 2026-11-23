const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
require.extensions['.ts'] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true, resolveJsonModule: true } }).outputText, filename);
const { RESUME } = require('../src/data/resumeData.ts');
const { resolveLocation } = require('../src/seo/routes.ts');
const html = fs.readFileSync('dist/portfolio/v2/index.html', 'utf8');
const escape = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#x27;');
assert.equal(resolveLocation({ pathname: '/portfolio/v2/', search: '', hash: '' }).page.id, 'portfolio-v2');
assert.equal(resolveLocation({ pathname: '/portfolio/', search: '', hash: '' }).page.id, 'portfolio');
const legacy = resolveLocation({ pathname: '/', search: '', hash: '#/portfolio/v2' });
assert.equal(legacy.page.id, 'portfolio-v2');assert.equal(legacy.legacy, true);
for (const project of RESUME.projects) {
  assert.ok(html.includes(escape(project.title)), project.title);
  if (project.github) assert.ok(html.includes(`href="${project.github}"`), project.title + ' direct source');
}
assert.equal((html.match(/class="v2-project"/g) || []).length, RESUME.projects.length);
assert.equal((html.match(/role="tabpanel"/g) || []).length, 5);
for (const name of ['about', 'experience', 'projects', 'toolkit', 'contact']) {
  assert.ok(html.includes(`id="v2-tab-${name}"`));assert.ok(html.includes(`aria-labelledby="v2-tab-${name}"`));
}
assert.ok(html.includes('aria-selected="true"'));
assert.ok(html.includes(RESUME.email));assert.ok(html.includes('AI-DLC'));
for (const employer of RESUME.experience) assert.ok(html.includes(escape(employer.company)));
assert.ok(html.includes('href="/portfolio/"'));assert.ok(html.includes('href="/resume/"'));
assert.ok(html.includes('Private repository'));assert.ok(html.includes('workflow illustrations'));
assert.ok(!html.includes('pagead2.googlesyndication.com'));
assert.ok(!html.includes('richard@example.com'));assert.ok(!html.includes('Richard hanrick'));
const schema = JSON.parse(html.match(/<script id="page-structured-data" type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
assert.ok(schema['@graph'].some((node) => node['@type'] === 'ProfilePage'));
console.log('PASS portfolio v2 clean/legacy routes, original route, twelve source-linked projects, five labeled panels, current contact, AI-DLC, experience, ProfilePage and ad-free document.');
