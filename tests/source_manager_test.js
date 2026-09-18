const fs=require('fs'),vm=require('vm'),path=require('path');
const ROOT=path.resolve(__dirname,'..'),store=new Map();
global.window=global;
global.localStorage={getItem:key=>store.has(key)?store.get(key):null,setItem:(key,value)=>store.set(key,String(value)),removeItem:key=>store.delete(key)};
global.FileReader=class{readAsText(file){this.result=file.content;if(this.onload)this.onload()}};
vm.runInThisContext(fs.readFileSync(path.join(ROOT,'source-manager.js'),'utf8'),{filename:'source-manager.js'});

const checks=[];function ck(value,message){checks.push([!!value,message]);if(!value)console.error('FAIL',message)}

(async()=>{
 const first=String.raw`\id PSA Test Psalms
\h Psalms
\c 1
\d A Psalm title
\q1 \v 1 \w Blessed|lemma="bless"\w* is the person \f + \ft a note\f*
\q2 who walks uprightly.
\v 2 Second verse.`;
 const parsed=SCRIPTURE_SOURCES.parseUsfm(first);
 ck(parsed.verseCount===2,'parser finds USFM chapter and verse records');
 ck(parsed.psalms['1']['1']==='Blessed is the person who walks uprightly.','parser joins poetry continuation lines and removes word/note markup');
 ck(parsed.titles['1']==='A Psalm title','parser retains Psalm descriptive titles');
 let rejected=false;try{SCRIPTURE_SOURCES.parseUsfm('\\id GEN\n\\c 1\n\\v 1 Beginning')}catch{rejected=true}
 ck(rejected,'parser rejects non-Psalms USFM books');
 const second=String.raw`\id PSA
\c 2
\v 1 Why do the nations rage?
\v 2 The kings take their stand.`;
 const source=await SCRIPTURE_SOURCES.importFiles([{name:'PSA-1.usfm',content:first},{name:'PSA-2.sfm',content:second}],{code:'xx',name:'Test Language',label:'Test Psalms',direction:'ltr'});
 ck(source.psalmCount===2&&source.verseCount===4,'multi-file language import merges Psalm content');
 ck(SCRIPTURE_SOURCES.verse('xx',2,1)==='Why do the nations rage?','imported verse content is addressable by language, Psalm and verse');
 ck(JSON.parse(store.get('psalms-editor-v0.4-usfm-xx')).name==='Test Language','imported language source persists separately from annotations');
 SCRIPTURE_SOURCES.remove('xx');
 ck(!store.has('psalms-editor-v0.4-usfm-xx'),'imported language source can be removed without annotation changes');
 const failed=checks.filter(check=>!check[0]);console.log(`PASS ${checks.length-failed.length}/${checks.length}`);if(failed.length)process.exit(1);console.log('USFM/SFM SOURCE MANAGER TEST PASSED');
})().catch(error=>{console.error(error);process.exit(1)});
