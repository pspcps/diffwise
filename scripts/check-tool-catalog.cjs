const fs = require('node:fs');
const ts = require('typescript');
const assert = require('node:assert/strict');
require.extensions['.ts'] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,filename);
const {TOOLS,TOOL_CATEGORIES}=require('../src/data/tools.ts');
const {TOOL_KEYWORDS}=require('../src/data/toolSearch.ts');
const {recentTools,rememberTool}=require('../src/utils/toolHistory.ts');
const expected=['text','file','json','api','architecture','regex','pdf','har','jwt','uuid','image_studio','time','base64','markup','case','debug','distance','measure','url'];
assert.deepEqual(TOOLS.map(t=>t.id).sort(),expected.sort(),'All 19 original tool IDs must remain');
assert.equal(new Set(TOOLS.map(t=>t.id)).size,19);
for(const tool of TOOLS){assert.ok(TOOL_CATEGORIES.includes(tool.category));assert.ok(tool.name&&tool.description&&tool.icon);assert.ok(TOOL_KEYWORDS[tool.id]?.length);}
for(const category of TOOL_CATEGORIES)assert.ok(TOOLS.some(t=>t.category===category));
let saved='[]';global.localStorage={getItem:()=>saved,setItem:(_,value)=>saved=value};
for(const value of ['not-json','{}','null','42']){saved=value;assert.deepEqual(recentTools(),[]);}
saved='["json","json","unknown","sample-private-input","text"]';assert.deepEqual(recentTools(),['json','text']);
for(const id of ['text','json','distance','measure','api','debug'])rememberTool(id);
assert.deepEqual(recentTools(),['debug','api','measure','distance','json']);rememberTool('measure');assert.deepEqual(recentTools(),['measure','debug','api','distance','json']);assert.ok(!saved.includes('sample-private-input'));
console.log('PASS: all 19 tool IDs, shared categories/search metadata, and bounded ID-only recent history.');
