const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const React = require('react');
const {renderToStaticMarkup} = require('react-dom/server');
for (const extension of ['.ts','.tsx']) require.extensions[extension]=(module,filename)=>module._compile(ts.transpileModule(fs.readFileSync(filename,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true,resolveJsonModule:true}}).outputText,filename);
const {HOME_PAGE,PORTFOLIO_PAGE,NOT_FOUND,TOOL_PAGES}=require('../src/seo/pages.ts');
const {SITE_ORIGIN,structuredData}=require('../src/seo/metadata.ts');
const SearchContent=require('../src/seo/SearchContent.tsx').default;
require.extensions['.css'] = () => {};
const HomePage=require('../src/pages/HomePage.tsx').default;
const output=path.resolve(__dirname,'../dist');
const template=fs.readFileSync(path.join(output,'index.html'),'utf8');
const preview=process.env.VERCEL_ENV==='preview';
const escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function head(page) {
 const robots=preview||page.id==='notfound'?'noindex, follow':'index, follow, max-image-preview:large';
 const meta=(name,content,property=false)=>`<meta ${property?'property':'name'}="${name}" content="${escape(content)}" />`;
 const tags=[`<title>${escape(page.title)}</title>`,meta('title',page.title),meta('description',page.description),meta('robots',robots),`<link rel="canonical" href="${SITE_ORIGIN+page.path}" />`,meta('author','Prakash Choudhary')];
 for(const [key,value] of Object.entries({'og:type':page.id==='portfolio'?'profile':'website','og:site_name':'PSDevTool','og:title':page.title,'og:description':page.description,'og:url':SITE_ORIGIN+page.path,'og:image':SITE_ORIGIN+'/og-image.png','og:image:type':'image/png','og:image:width':'1200','og:image:height':'630','og:image:alt':'PSDevTool — your everyday developer toolkit'}))tags.push(meta(key,value,true));
 for(const [key,value] of Object.entries({'twitter:card':'summary_large_image','twitter:title':page.title,'twitter:description':page.description,'twitter:url':SITE_ORIGIN+page.path,'twitter:image':SITE_ORIGIN+'/og-image.png','twitter:image:alt':'PSDevTool — your everyday developer toolkit','theme-color':'#0f1412','application-name':'PSDevTool','apple-mobile-web-app-title':'PSDevTool'}))tags.push(meta(key,value));
 tags.push('<link rel="icon" href="/favicon.ico?v=ps-1" sizes="any" />','<link rel="icon" type="image/svg+xml" href="/favicon.svg?v=ps-1" />','<link rel="icon" type="image/png" sizes="96x96" href="/brand/icon-96.png" />','<link rel="apple-touch-icon" sizes="180x180" href="/brand/icon-180.png" />','<link rel="manifest" href="/site.webmanifest" />');
 if(process.env.GOOGLE_SITE_VERIFICATION)tags.push(meta('google-site-verification',process.env.GOOGLE_SITE_VERIFICATION));
 tags.push(`<script id="page-structured-data" type="application/ld+json">${JSON.stringify(structuredData(page)).replace(/</g,'\\u003c')}</script>`);
 return '<!-- seo-head:start -->\n'+tags.join('\n')+'\n<!-- seo-head:end -->';
}
for(const page of [HOME_PAGE,...TOOL_PAGES,PORTFOLIO_PAGE,NOT_FOUND]) {
 let body;
 if(page.id==='home')body=renderToStaticMarkup(React.createElement(HomePage,{onTool:()=>{},onPortfolio:()=>{},onSearch:()=>{}}));
 else {
   const guide=renderToStaticMarkup(React.createElement(SearchContent,{page,primary:true}));
   const shell=page.id==='portfolio'||page.id==='notfound'?'':`<section class="static-tool-shell"><nav class="static-shell-nav"><a href="/"><img src="/brand/logo.svg" width="34" height="34" alt="PSDevTool logo"/>PSDevTool.</a><a href="/">All tools</a></nav><div class="static-shell-title">${escape(page.name)}</div><div class="static-shell-body"><p>${escape(page.description)}</p><p>The interactive workspace opens with JavaScript.</p><a href="#how-to-use">Read the tool guide ↓</a></div></section>`;
   body=shell+guide;
 }
 const html=template.replace(/data-indexable="(?:true|false)"/,`data-indexable="${!preview}"`).replace(/<!-- seo-head:start -->[\s\S]*?<!-- seo-head:end -->/,head(page)).replace(/<!-- app-root:start -->[\s\S]*?<!-- app-root:end -->/,`<!-- app-root:start --><div id="root" data-prerendered>${body}</div><!-- app-root:end -->`);
 const filename=page.id==='notfound'?path.join(output,'404.html'):path.join(output,page.path,'index.html');
 fs.mkdirSync(path.dirname(filename),{recursive:true});fs.writeFileSync(filename,html);
}
const urls=[HOME_PAGE,...TOOL_PAGES,PORTFOLIO_PAGE];
fs.writeFileSync(path.join(output,'sitemap.xml'),'<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'+urls.map(p=>`  <url><loc>${SITE_ORIGIN+p.path}</loc></url>`).join('\n')+'\n</urlset>\n');
fs.writeFileSync(path.join(output,'robots.txt'),preview?'User-agent: *\nDisallow: /\n':'User-agent: *\nAllow: /\n\nSitemap: '+SITE_ORIGIN+'/sitemap.xml\n');
console.log(`Generated ${urls.length} crawlable pages, a 404 page, sitemap and ${preview?'preview noindex':'production'} metadata.`);
