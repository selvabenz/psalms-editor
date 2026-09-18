(() => {
'use strict';

const INDEX_KEY='psalms-editor-v0.4-usfm-index';
const SOURCE_PREFIX='psalms-editor-v0.4-usfm-';
const imported={};

function sourceKey(code){return SOURCE_PREFIX+code}
function normalizeCode(value){return String(value||'').trim().toLowerCase().replace(/[^a-z0-9-]+/g,'-').replace(/^-+|-+$/g,'')}
function load(){
  let codes=[];
  try{codes=JSON.parse(localStorage.getItem(INDEX_KEY)||'[]')}catch{}
  codes.forEach(code=>{try{const source=JSON.parse(localStorage.getItem(sourceKey(code))||'null');if(source?.code&&source?.psalms)imported[code]=source}catch{}})
}
function persist(source){
  const code=source.code;
  localStorage.setItem(sourceKey(code),JSON.stringify(source));
  imported[code]=source;
  localStorage.setItem(INDEX_KEY,JSON.stringify(Object.keys(imported).sort()));
}
function remove(code){
  delete imported[code];
  localStorage.removeItem(sourceKey(code));
  localStorage.setItem(INDEX_KEY,JSON.stringify(Object.keys(imported).sort()));
}
function cleanUsfm(value){
  let text=String(value||'');
  text=text.replace(/\\(?:f|fe|x|ef)\s[\s\S]*?\\(?:f|fe|x|ef)\*/g,' ');
  text=text.replace(/\\fig\s[\s\S]*?\\fig\*/g,' ');
  text=text.replace(/\\w\s+([^|\\]+)(?:\|[^\\]*)?\\w\*/g,'$1');
  text=text.replace(/\\(?:va|ca|vp)\s+[\s\S]*?\\(?:va|ca|vp)\*/g,' ');
  text=text.replace(/\\[a-z][a-z0-9-]*\*?(?:\s+)?/gi,' ');
  text=text.replace(/\|[^\s]+/g,' ');
  return text.replace(/\s+/g,' ').trim();
}
function parseUsfm(text){
  const normalized=String(text||'').replace(/^\uFEFF/,'').replace(/\r\n?/g,'\n').replace(/(?<!^)\\(?=[cv]\s)/g,'\n\\');
  const id=normalized.match(/(?:^|\n)\\id\s+([^\s]+)/i)?.[1]?.toUpperCase();
  if(id&&id!=='PSA'&&id!=='PSM'&&id!=='PS')throw Error(`Expected a Psalms USFM/SFM file; found \\id ${id}`);
  const psalms={},titles={};let chapter=null,verse=null;
  normalized.split('\n').forEach(raw=>{
    const line=raw.trim();if(!line)return;
    const chapterMatch=line.match(/^\\c\s+(\d+)/i);
    if(chapterMatch){chapter=+chapterMatch[1];verse=null;if(chapter>=1&&chapter<=150)psalms[chapter]||={};return}
    if(!chapter||chapter<1||chapter>150)return;
    const verseMatch=line.match(/^\\v\s+(\d+)(?:[a-z]|-\d+[a-z]?)?\s*(.*)$/i);
    if(verseMatch){verse=String(+verseMatch[1]);const content=cleanUsfm(verseMatch[2]);if(content)psalms[chapter][verse]=[psalms[chapter][verse],content].filter(Boolean).join(' ');return}
    const titleMatch=line.match(/^\\(?:d|s\d*|ms\d*)\s+(.+)$/i);
    if(titleMatch&&!verse){const content=cleanUsfm(titleMatch[1]);if(content)titles[chapter]=[titles[chapter],content].filter(Boolean).join(' ');return}
    if(verse){const content=cleanUsfm(line);if(content)psalms[chapter][verse]=[psalms[chapter][verse],content].filter(Boolean).join(' ')}
  });
  const verseCount=Object.values(psalms).reduce((total,chapter)=>total+Object.keys(chapter).length,0);
  if(!verseCount)throw Error('No \\c chapter and \\v verse content was found');
  return{psalms,titles,verseCount}
}
function mergeParsed(target,parsed){
  Object.entries(parsed.psalms).forEach(([psalm,verses])=>{target.psalms[psalm]||={};Object.assign(target.psalms[psalm],verses)});
  Object.assign(target.titles,parsed.titles);
}
function readFile(file){return new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result||''));reader.onerror=()=>reject(Error(`Could not read ${file.name||'file'}`));reader.readAsText(file)})}
async function importFiles(files,metadata){
  const code=normalizeCode(metadata.code);if(!code)throw Error('Add a language code');
  if(code==='tahot')throw Error('The code “tahot” is reserved for the bundled Hebrew source');
  const selected=[...(files||[])];if(!selected.length)throw Error('Choose at least one USFM or SFM file');
  const source={code,name:String(metadata.name||code).trim(),label:String(metadata.label||metadata.name||code).trim(),direction:metadata.direction==='rtl'?'rtl':'ltr',format:'USFM/SFM',importedAt:new Date().toISOString(),psalms:{},titles:{},files:selected.map(file=>file.name||'unnamed')};
  for(const file of selected)mergeParsed(source,parseUsfm(await readFile(file)));
  source.psalmCount=Object.keys(source.psalms).length;
  source.verseCount=Object.values(source.psalms).reduce((total,chapter)=>total+Object.keys(chapter).length,0);
  try{persist(source)}catch{throw Error('Browser storage is full. Remove an older imported language or use a smaller Psalms-only file.')}
  return source
}
function tahot(){return window.TAHOT_PSALMS||{meta:{},psalms:{}}}
function hebrewPsalm(psalm){return tahot().psalms?.[String(psalm)]||null}
function hebrewVerse(psalm,verse){return hebrewPsalm(psalm)?.[String(verse)]||null}
function languages(){return Object.values(imported).sort((a,b)=>a.name.localeCompare(b.name))}
function verse(code,psalm,verseNumber){return imported[code]?.psalms?.[String(psalm)]?.[String(verseNumber)]||''}
function title(code,psalm){return imported[code]?.titles?.[String(psalm)]||''}

load();
window.SCRIPTURE_SOURCES={parseUsfm,cleanUsfm,importFiles,remove,languages,verse,title,hebrewPsalm,hebrewVerse,tahotMeta:()=>tahot().meta,normalizeCode};
})();
