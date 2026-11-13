const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const ts=require('typescript');
require.extensions['.ts']=(module,filename)=>module._compile(ts.transpileModule(fs.readFileSync(filename,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true,resolveJsonModule:true}}).outputText,filename);
const {HOME_PAGE,PORTFOLIO_PAGE,RESUME_PAGE,RESUME_PAGES,TOOL_PAGES}=require('../src/seo/pages.ts');
const {resolveLocation}=require('../src/seo/routes.ts');
const {HASH_TO_MODE}=require('../src/seo/legacyRoutes.ts');
const root=path.resolve(__dirname,'..'),dist=path.join(root,'dist');
const escape=s=>s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const pages=[HOME_PAGE,...TOOL_PAGES,PORTFOLIO_PAGE,RESUME_PAGE,...RESUME_PAGES];
const titles=new Set(),canonicals=new Set();
assert.equal(TOOL_PAGES.length,19);let preview;
for(const p of pages){
 const file=path.join(dist,p.path,'index.html');assert.ok(fs.existsSync(file),file);
 const html=fs.readFileSync(file,'utf8');const isPreview=html.includes('data-indexable="false"');preview??=isPreview;assert.equal(preview,isPreview);
 assert.equal((html.split('</head>')[0].match(/<title>/g)||[]).length,1);assert.ok(html.includes(`<title>${escape(p.title)}</title>`));assert.ok(html.includes(`content="${escape(p.description)}"`));assert.ok(p.title.length<85&&p.description.length>=90&&p.description.length<=190);
 assert.ok(html.includes(`<link rel="canonical" href="https://psdevtool.online${p.path}"`));assert.ok(!titles.has(p.title));titles.add(p.title);assert.ok(!canonicals.has(p.path));canonicals.add(p.path);
 assert.ok(html.includes('og-image.png'));assert.ok(/<h1[ >]/.test(html));assert.ok(html.includes('data-prerendered'));assert.ok(html.includes('type="module"'));assert.ok(!html.includes('name="keywords"'));
 const schema=JSON.parse(html.match(/<script id="page-structured-data" type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);assert.ok(!JSON.stringify(schema).includes('aggregateRating'));assert.ok(Array.isArray(schema['@graph']));
 if(p.id==='home')assert.equal(schema['@graph'].find(n=>n['@type']==='ItemList').itemListElement.length,19);
 else if(p.id!=='portfolio'&&p.id!=='resume'&&!p.id.startsWith('resume-')){const app=schema['@graph'].find(n=>n['@type']==='WebApplication');assert.equal(app.url,'https://psdevtool.online'+p.path);assert.deepEqual(app.featureList,p.features);assert.ok(p.steps.length>=3&&p.faq.length>=2);for(const item of p.faq)assert.ok(html.includes(escape(item.question)));}
 const route=resolveLocation({pathname:p.path,search:'',hash:''});assert.equal(route.page.id,p.id);
 assert.ok(html.includes(`name="robots" content="${isPreview?'noindex, follow':'index, follow, max-image-preview:large'}"`));
}
for(const [hash,id] of Object.entries(HASH_TO_MODE)){const route=resolveLocation({pathname:'/',search:'',hash});assert.equal(route.page.id,id);assert.equal(route.legacy,true);assert.ok(route.page.path.startsWith('/tools/'));}
const legacy=resolveLocation({pathname:'/',search:'',hash:'#/distance?lat1=51&lon1=0'});assert.equal(legacy.search,'?lat1=51&lon1=0');
assert.equal(resolveLocation({pathname:'/unknown-page/',search:'',hash:''}).page.id,'notfound');
assert.equal(resolveLocation({pathname:'/tools/json-formatter/',search:'',hash:'#how-to-use'}).page.id,'json');
const sitemap=fs.readFileSync(path.join(dist,'sitemap.xml'),'utf8');assert.ok(!sitemap.includes('#'));assert.equal((sitemap.match(/<loc>/g)||[]).length,pages.length);for(const p of pages)assert.ok(sitemap.includes('https://psdevtool.online'+p.path));
const robots=fs.readFileSync(path.join(dist,'robots.txt'),'utf8');assert.ok(preview?robots.includes('Disallow: /'):robots.includes('Sitemap: https://psdevtool.online/sitemap.xml'));
const missing=fs.readFileSync(path.join(dist,'404.html'),'utf8');assert.ok(missing.includes('noindex, follow'));
const manifest=JSON.parse(fs.readFileSync(path.join(dist,'site.webmanifest'),'utf8'));for(const icon of manifest.icons)assert.ok(fs.existsSync(path.join(dist,icon.src)));
for(const size of [16,32,48,96,180,192,512]){const png=fs.readFileSync(path.join(dist,`brand/icon-${size}.png`));assert.equal(png.readUInt32BE(16),size);assert.equal(png.readUInt32BE(20),size);}
const og=fs.readFileSync(path.join(dist,'og-image.png'));assert.equal(og.readUInt32BE(16),1200);assert.equal(og.readUInt32BE(20),630);
const ico=fs.readFileSync(path.join(dist,'favicon.ico'));assert.equal(ico.readUInt16LE(2),1);assert.equal(ico.readUInt16LE(4),3);
const config=JSON.parse(fs.readFileSync(path.join(root,'vercel.json'),'utf8'));assert.equal(config.trailingSlash,true);assert.ok(!config.rewrites?.some(r=>r.source==='/(.*)'));
console.log(`PASS: ${pages.length} prerendered pages, ${Object.keys(HASH_TO_MODE).length} legacy routes, metadata/schema, clean sitemap, ${preview?'preview noindex':'production indexing'}, 404, logo icons and sharing PNG.`);
