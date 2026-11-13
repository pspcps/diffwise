// Exercise the pure calculation engines without a browser or hosted services.
const fs = require('node:fs');
const ts = require('typescript');
const assert = require('node:assert/strict');
require.extensions['.ts'] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,filename);
const {QUANTITIES,convert}=require('../src/components/MeasureLab/units.ts');
const {SHAPES,calculateShape}=require('../src/components/MeasureLab/geometry.ts');
const {solveAlgebra}=require('../src/components/MeasureLab/algebra.ts');
const {geodesicPath}=require('../src/components/GeoDistance/geodesicPath.ts');
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-8*Math.max(1,Math.abs(b)),`${a} != ${b}`);
let checks=0;
for(const q of QUANTITIES)for(const unit of q.units){const value=q.id==='temperature'?300:123.456;const converted=convert(q,value,unit.id,q.units[0].id);near(convert(q,converted.result,q.units[0].id,unit.id).result,value);checks++;}
const run=(id,value,from,to)=>convert(QUANTITIES.find(q=>q.id===id),value,from,to).result;
near(run('length',1,'mi','m'),1609.344);near(run('length',1,'ft','in'),12);near(run('mass',1,'kg','g'),1000);near(run('volume',1,'gal US','L'),3.785411784);near(run('area',1,'acre','ft²'),43560);near(run('temperature',32,'°F','°C'),0);near(run('temperature',100,'°C','°F'),212);near(run('data',1,'KiB','B'),1024);near(run('data',1,'kB','B'),1000);near(run('energy',1,'kWh','J'),3600000);near(run('speed',36,'km/h','m/s'),10);near(run('angle',-180,'°','rad'),-Math.PI);
assert.throws(()=>run('temperature',-1,'K','°C'),/absolute zero/);assert.throws(()=>run('mass',-1,'kg','g'),/non-negative/);assert.throws(()=>run('length',Infinity,'m','ft'));assert.throws(()=>run('length',1,'kg','ft'));
for(const shape of SHAPES){const result=calculateShape(shape.id,{a:3,b:4,c:5,h:5,r:2});assert.ok(result.length>0&&result.every(r=>r.value>0&&Number.isFinite(r.value)));checks++;}
const result=(id,name,d)=>calculateShape(id,d).find(r=>r.name===name).value;
near(result('triangle','Area',{a:3,b:4,c:5}),6);near(result('cuboid','Volume',{a:3,b:4,h:5}),60);near(result('circle','Area',{r:2}),12.566370614359172);near(result('cylinder','Volume',{r:2,h:5}),62.83185307179586);assert.throws(()=>calculateShape('triangle',{a:1,b:2,c:3}),/triangle/);assert.throws(()=>calculateShape('cube',{a:0}));
assert.match(solveAlgebra('linear',{a:2,b:3,c:11}).lines[0],/ = 4$/);assert.equal(solveAlgebra('quadratic',{a:1,b:-5,c:6}).lines.join('|'),'Discriminant = 1|x₁ = 3|x₂ = 2');assert.match(solveAlgebra('quadratic',{a:1,b:0,c:1}).lines[1],/1i/);assert.match(solveAlgebra('linear',{a:0,b:1,c:1}).lines[0],/Infinitely/);assert.match(solveAlgebra('linear',{a:0,b:1,c:2}).lines[0],/No solution/);assert.equal(solveAlgebra('system',{a:2,b:1,c:7,d:1,e:-1,f:2}).lines.join('|'),'Determinant = -3|x = 3|y = 1');assert.match(solveAlgebra('system',{a:0,b:0,c:1,d:0,e:0,f:2}).lines[1],/No solution/);assert.match(solveAlgebra('percent',{whole:250,percentage:15}).lines[0],/37.5/);assert.equal(solveAlgebra('arithmetic',{first:2,difference:3,n:10}).lines.join('|'),'Term 10 = 29|Sum of 10 terms = 155');assert.equal(solveAlgebra('geometric',{first:2,ratio:1,n:5}).lines.join('|'),'Term 5 = 2|Sum of 5 terms = 10');assert.throws(()=>solveAlgebra('arithmetic',{first:1,difference:1,n:1.5}));
for(const [a,b] of [[{lat:0,lon:0},{lat:0,lon:0}],[{lat:0,lon:0},{lat:0,lon:180}],[{lat:10,lon:179},{lat:10,lon:-179}],[{lat:90,lon:0},{lat:-90,lon:0}]]){const path=geodesicPath(a,b);assert.ok(path.every(p=>p.every(Number.isFinite)));for(let i=1;i<path.length;i++)assert.ok(Math.abs(path[i][1]-path[i-1][1])<=180);near(path[0][0],a.lat);near(path.at(-1)[0],b.lat);checks++;}
const {getCareerDuration}=require('../src/utils/careerDuration.ts');
assert.equal(getCareerDuration(new Date(2027,0,1)).years,9);assert.equal(getCareerDuration(new Date(2027,0,2)).years,10);assert.equal(getCareerDuration(new Date(2017,0,2)).years,0);
console.log(`PASS ${checks} unit round-trips, shapes and geodesic edge cases; known conversions, algebra, invalid inputs and career anniversaries.`);
