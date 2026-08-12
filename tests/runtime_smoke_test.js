const fs=require('fs'),vm=require('vm'),path=require('path');
const ROOT=path.resolve(__dirname,'..');
class ClassList{constructor(){this.s=new Set()}add(...x){x.forEach(v=>this.s.add(v))}remove(...x){x.forEach(v=>this.s.delete(v))}toggle(v,force){if(force===undefined){this.s.has(v)?this.s.delete(v):this.s.add(v);return this.s.has(v)}force?this.s.add(v):this.s.delete(v);return force}}
class El{
 constructor(tag='div',id=''){this.tagName=tag.toUpperCase();this.id=id;this.dataset={};this.style={};this.classList=new ClassList();this.children=[];this._html='';this.textContent='';this.value='';this.disabled=false;this.options=[];this.files=[]}
 set innerHTML(v){this._html=String(v);this.children=[];this.options=[];const re=/<option(?:\s+value="([^"]*)")?[^>]*>([^<]*)<\/option>/g;let m;while((m=re.exec(this._html)))this.options.push({value:m[1]??m[2],text:m[2]});if(this.options.length&&!this.value)this.value=this.options[0].value}
 get innerHTML(){return this._html}
 appendChild(x){this.children.push(x);return x}append(...xs){this.children.push(...xs)}
 querySelector(sel){return new El(sel==='input'?'input':'button')}
 querySelectorAll(sel){return []}
 addEventListener(type,fn){this['on'+type]=fn}
 showModal(){this.open=true}close(){this.open=false}scrollIntoView(){}
}
const html=fs.readFileSync(path.join(ROOT,'index.html'),'utf8'), ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]), elements={};ids.forEach(id=>elements[id]=new El('div',id));
const document={activeElement:null,getElementById(id){return elements[id]||(elements[id]=new El('div',id))},createElement(tag){return new El(tag)},createTextNode(t){return{textContent:String(t)}},querySelectorAll(){return[]},querySelector(){return null},addEventListener(){}};
const store=new Map();const localStorage={getItem:k=>store.has(k)?store.get(k):null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)};
global.window=global;global.location={search:'?test=1'};global.document=document;global.localStorage=localStorage;global.navigator={clipboard:{writeText:async()=>{}}};global.confirm=()=>true;global.CSS={escape:s=>s};global.Blob=class{};global.URL={createObjectURL:()=>'',revokeObjectURL:()=>{}};
global.FileReader=class{readAsText(file){this.result=file.content;if(this.onload)this.onload()}};
vm.runInThisContext(fs.readFileSync(path.join(ROOT,'data/psalm1.js'),'utf8'),{filename:'psalm1.js'});
let error=null;try{vm.runInThisContext(fs.readFileSync(path.join(ROOT,'app.js'),'utf8'),{filename:'app.js'})}catch(e){error=e}
if(error){console.error('STARTUP ERROR',error);process.exit(1)}
const checks=[];function ck(x,m){checks.push([!!x,m]);if(!x)console.error('FAIL',m)}
ck(elements.progressText.textContent!=='Loading…','startup render updates progress');
ck(elements.verseList.children.length===6,'startup renders six verse cards');
ck(elements.jsonPreview.textContent.includes('"schemaVersion": "0.2.0"'),'startup dataset is v0.2.0');
// Exercise the actual v0.1.1 import/migration path via the bound file input.
const sample=fs.readFileSync(path.join(ROOT,'sample/PSA001.annotations.v0.1.1.migration-sample.json'),'utf8');
try{elements.importInput.onchange({target:{files:[{content:sample}],value:''}})}catch(e){console.error('IMPORT ERROR',e);process.exit(1)}
const saved=JSON.parse(store.get('tamil-psalms-editor-v0.2-psalm1'));
fs.writeFileSync(path.join(ROOT,'sample/PSA001.annotations.v0.2.migrated-preview.json'),JSON.stringify(saved,null,2));
ck(saved.schemaVersion==='0.2.0','import migrates schema to v0.2.0');
ck(saved.parallelGroups.length===5,'import preserves 5 parallel groups');
ck(saved.components.length===22,'import preserves 22 components');
ck(saved.structures.length===6,'import preserves 6 structures');
ck(new Set(saved.structures.map(s=>s.id)).size===6,'migration repairs structure IDs to unique values');
ck(saved.structures.every(s=>s.parentId!==s.id),'migration creates no self-parent structure');
ck(saved.migration?.report?.some(x=>/duplicate legacy structure IDs/.test(x.text)),'migration report records duplicate-ID repair');
ck(elements.validationBadge.textContent!=='0','validator reports remaining imported issues');
ck(elements.migrationDialog.open===true,'migration report dialog opens');

// Exercise actual workflow functions through the test-only API.
const api=global.__TPE_TEST__;
ck(!!api,'test API is available in ?test=1 mode');
api.setLineSelection(['PSA.1.5.L1','PSA.1.5.L2']);
api.setQuickGroupFields('Antithetic','High','runtime test');
api.createQuickGroup({preventDefault(){}});
let st=api.getState();
ck(st.parallelGroups.length===6,'quick parallel-group creation works after migration');
ck(st.parallelGroups.some(g=>g.id==='P006'&&g.type==='Antithetic'),'new parallel group receives collision-safe P006 ID');
api.setActiveGroup('P001');
api.setTokenSelection(['h-1-1-1'],['t-1-1-1']);
elements.componentNote.value='runtime component';
api.createComponentDirect('d');
st=api.getState();const newComp=st.components.find(c=>c.id==='C023');
ck(!!newComp,'new component receives collision-safe C023 ID');
ck(newComp?.parallelGroupId==='P001','new component automatically attaches to active group');
api.setComponentStatus('C023','approved');
api.startEditComponent('C023');
api.setEditingLabel('e');
api.setTokenSelection(['h-1-1-1','h-1-1-2'],['t-1-1-1']);
elements.componentNote.value='corrected approved component';
api.saveComponentEdit();
st=api.getState();const edited=st.components.find(c=>c.id==='C023');
ck(edited.status==='needs-review','editing an approved component resets status to Needs review');
ck(edited.revision===2&&edited.revisions.length===1,'approved component edit preserves prior revision');
ck(edited.label==='e'&&edited.hebrewTokenIds.length===2,'component label/token correction is saved');

// Structure creation after migrated duplicate IDs must not collide.
elements.structureLabel.value='TEST';elements.structureTitle.value='Runtime structure';elements.structureType.value='Section';elements.structureStart.value='PSA.1.1.L1';elements.structureEnd.value='PSA.1.1.L1';elements.structureParent.value='';elements.structureNote.value='';
api.saveStructure();st=api.getState();
ck(st.structures.some(x=>x.id==='S007'),'new structure receives collision-safe S007 ID after migration repair');
// Deleting a group must not delete its components.
const beforeDeleteCount=st.components.length;api.deleteParallel('P001');st=api.getState();
ck(st.components.length===beforeDeleteCount,'deleting a parallel group preserves component records');
ck(st.components.filter(c=>c.parallelGroupId===null).length>=beforeDeleteCount-1,'components from deleted group become unassigned for review');

// Resolve one duplicate Hebrew segment assignment by unassigning then assigning it to a single segment.
api.assignSegmentToken('hebrew','PSA.1.3.L1','h-1-3-1');
api.assignSegmentToken('hebrew','PSA.1.3.L1','h-1-3-1');
st=api.getState();const owners=st.segments.filter(s=>s.hebrewTokenIds.includes('h-1-3-1')).map(s=>s.id);
ck(owners.length===1&&owners[0]==='PSA.1.3.L1','segmentation assignment moves a Hebrew token to one segment');

const failed=checks.filter(x=>!x[0]);console.log(`PASS ${checks.length-failed.length}/${checks.length}`);checks.filter(x=>x[0]).forEach(x=>console.log('  OK',x[1]));if(failed.length)process.exit(1);console.log('RUNTIME STARTUP + MIGRATION SMOKE TEST PASSED');
