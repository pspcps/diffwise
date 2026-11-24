const fs=require('node:fs'),assert=require('node:assert/strict'),ts=require('typescript');
for(const extension of ['.ts','.tsx'])require.extensions[extension]=(module,filename)=>{
 let code=ts.transpileModule(fs.readFileSync(filename,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText;
 if(filename.endsWith('/TimeZone/TimeZoneView.tsx'))code+='\nmodule.exports.checks={localDateTime,wallTimeCandidates,offsetMinutes};';
 module._compile(code,filename);
};
require.extensions['.css']=()=>{};
const {MAJOR_TIME_ZONES,fixedOffsetMinutes,zonedParts}=require('../src/data/majorTimeZones.ts');
const {default:View,checks}=require('../src/components/TimeZone/TimeZoneView.tsx');
assert.equal(MAJOR_TIME_ZONES.length,34);assert.equal(new Set(MAJOR_TIME_ZONES.map(z=>z.id)).size,34);
const instant=new Date('2026-11-24T22:45:12Z');
for(const zone of MAJOR_TIME_ZONES){
 assert.equal(fixedOffsetMinutes(zone.id),zone.offset);
 const expected=new Date(instant.getTime()+zone.offset*60000).toISOString().slice(0,19);
 assert.equal(checks.localDateTime(instant,zone.id),expected,zone.id);
 assert.deepEqual(checks.wallTimeCandidates(expected,zone.id).map(d=>d.toISOString()),[instant.toISOString()],zone.id+' round trip');
}
assert.equal(fixedOffsetMinutes('Asia/Kolkata'),null);assert.equal(fixedOffsetMinutes('UTC+14:30'),null);
assert.deepEqual(checks.wallTimeCandidates('2026-11-01T01:30:00','America/New_York').map(d=>d.toISOString()),['2026-11-01T05:30:00.000Z','2026-11-01T06:30:00.000Z']);
assert.equal(checks.wallTimeCandidates('2026-03-08T02:30:00','America/New_York').length,0);
assert.equal(checks.offsetMinutes(new Date('2026-07-01T12:00:00Z'),'America/New_York'),-240);
assert.equal(checks.offsetMinutes(new Date('2026-07-01T12:00:00Z'),'UTC-05:00'),-300);
assert.equal(zonedParts(instant,'UTC+05:45',{hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).find(p=>p.type==='minute').value,'30');
const React=require('react'),{renderToStaticMarkup}=require('react-dom/server');
const html=renderToStaticMarkup(React.createElement(View));
assert.equal((html.match(/role="img"/g)||[]).length,2);
assert.ok(html.includes('Show all time zones'));assert.ok(!html.includes('label="City and regional zones'));
assert.ok(html.includes('Pause live clocks'));assert.ok(html.includes('Major standard UTC offsets'));
console.log('PASS 34 fixed-offset round trips, fractional offsets/date rollover, city DST vs fixed standard time, DST fold/gap, major-only default and two clocks.');

const {timelineTime,plannerStart,HOUR_MS}=require('../src/utils/timeZoneTimeline.ts');
const winter=Date.parse('2026-11-24T16:00:00Z');
assert.equal(timelineTime(winter,'Asia/Kolkata').time,'21:30');
assert.equal(timelineTime(winter,'America/Los_Angeles').time,'08:00');
assert.equal(timelineTime(winter,'Pacific/Honolulu').time,'06:00');
assert.equal(timelineTime(winter,'Asia/Kathmandu').time,'21:45');
const start=plannerStart(winter,'Asia/Kolkata');assert.equal(timelineTime(start,'Asia/Kolkata').time,'15:00');
assert.equal(timelineTime(start+6*HOUR_MS,'Asia/Kolkata').time,'21:00');
const fold=Date.parse('2026-11-01T05:00:00Z');assert.equal(timelineTime(fold,'America/New_York').time,'01:00');assert.equal(timelineTime(fold+HOUR_MS,'America/New_York').time,'01:00');assert.notEqual(timelineTime(fold,'America/New_York').offset,timelineTime(fold+HOUR_MS,'America/New_York').offset);
const Planner=require('../src/components/TimeZone/TimeZonePlanner.tsx').default;
const planner=renderToStaticMarkup(React.createElement(Planner,{instant:winter,sourceZone:'Asia/Kolkata',targetZone:'Pacific/Honolulu',allZones:[],showAll:false,onSelect(){},onSourceZone(){}}));
assert.equal((planner.match(/class="tz-planner-row"/g)||[]).length,3);assert.equal((planner.match(/aria-label="Select /g)||[]).length,72);assert.ok(planner.includes('Add time zone to planner'));assert.ok(planner.includes('Use Los Angeles as reference zone'));
console.log('PASS multi-zone planner alignment, fractional offsets, DST repeated hours, three rows and 72 selectable shared timeline cells.');
