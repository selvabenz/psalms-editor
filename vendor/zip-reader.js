/* Rose Cookies local ZIP reader/writer. No runtime CDN or package dependency. */
((root,factory)=>{const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;root.ROSE_ZIP=api})(typeof globalThis!=='undefined'?globalThis:this,()=>{
'use strict';
const td=new TextDecoder('utf-8',{fatal:true}),te=new TextEncoder();
const u16=(v,o)=>v.getUint16(o,true),u32=(v,o)=>v.getUint32(o,true);
function bytes(value){if(value instanceof Uint8Array)return value;if(value instanceof ArrayBuffer)return new Uint8Array(value);if(ArrayBuffer.isView(value))return new Uint8Array(value.buffer,value.byteOffset,value.byteLength);return te.encode(String(value))}
function concat(parts){const size=parts.reduce((n,p)=>n+p.length,0),out=new Uint8Array(size);let at=0;for(const part of parts){out.set(part,at);at+=part.length}return out}
function safePath(name){
  if(!name||name.includes('\0')||name.includes('\\')||name.startsWith('/')||/^[A-Za-z]:/.test(name))throw Error(`Unsafe ZIP path: ${name||'(empty)'}`);
  const parts=name.split('/');if(parts.some(x=>x===''||x==='.'||x==='..'))throw Error(`Unsafe ZIP path: ${name}`);
  return parts.join('/');
}
function findEocd(data){const start=Math.max(0,data.length-65557);for(let i=data.length-22;i>=start;i--)if(data[i]===0x50&&data[i+1]===0x4b&&data[i+2]===0x05&&data[i+3]===0x06)return i;throw Error('Invalid ZIP: end-of-central-directory record not found')}
async function inflate(raw,expected){
  if(typeof DecompressionStream!=='function')throw Error('This browser cannot decompress ZIP files offline');
  const stream=new Blob([raw]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
  const result=new Uint8Array(await new Response(stream).arrayBuffer());
  if(result.length!==expected)throw Error(`Invalid ZIP entry size: expected ${expected}, received ${result.length}`);
  return result;
}
async function read(input,limits={}){
  const data=bytes(input instanceof Blob?await input.arrayBuffer():input),view=new DataView(data.buffer,data.byteOffset,data.byteLength),eocd=findEocd(data);
  const count=u16(view,eocd+10),centralSize=u32(view,eocd+12),centralOffset=u32(view,eocd+16),maxTotal=limits.maxTotal||200*1024*1024,maxEntry=limits.maxEntry||100*1024*1024;
  if(u16(view,eocd+8)!==count)throw Error('Multi-disk ZIP archives are not supported');
  if(centralOffset+centralSize>data.length)throw Error('Invalid ZIP central directory');
  const entries=new Map(),normalizedPaths=new Set();let cursor=centralOffset,total=0;
  for(let i=0;i<count;i++){
    if(u32(view,cursor)!==0x02014b50)throw Error('Invalid ZIP central-directory entry');
    const flags=u16(view,cursor+8),method=u16(view,cursor+10),crc=u32(view,cursor+16),compressedSize=u32(view,cursor+20),size=u32(view,cursor+24),nameLength=u16(view,cursor+28),extraLength=u16(view,cursor+30),commentLength=u16(view,cursor+32),localOffset=u32(view,cursor+42);
    if(flags&1)throw Error('Encrypted ZIP entries are not supported');
    if(method!==0&&method!==8)throw Error(`Unsupported ZIP compression method ${method}`);
    const rawName=td.decode(data.subarray(cursor+46,cursor+46+nameLength)),directory=rawName.endsWith('/'),name=safePath(directory?rawName.slice(0,-1):rawName);
    if(normalizedPaths.has(name))throw Error(`Duplicate normalized ZIP path: ${name}`);normalizedPaths.add(name);
    if(size>maxEntry)throw Error(`ZIP entry is too large: ${name}`);total+=size;if(total>maxTotal)throw Error('ZIP uncompressed size exceeds the safety limit');
    if(!directory)entries.set(name,{name,size,compressedSize,method,crc,localOffset});cursor+=46+nameLength+extraLength+commentLength;
  }
  async function get(name){
    const entry=entries.get(name);if(!entry)throw Error(`Missing ZIP entry: ${name}`);
    const o=entry.localOffset;if(u32(view,o)!==0x04034b50)throw Error(`Invalid local ZIP header: ${name}`);
    const start=o+30+u16(view,o+26)+u16(view,o+28),end=start+entry.compressedSize;if(end>data.length)throw Error(`Truncated ZIP entry: ${name}`);
    const raw=data.subarray(start,end),out=entry.method===0?new Uint8Array(raw):await inflate(raw,entry.size);
    if(out.length!==entry.size)throw Error(`ZIP size mismatch: ${name}`);return out;
  }
  return{entries,list:()=>[...entries.keys()],get,raw:data};
}
let crcTable;
function crc32(data){if(!crcTable)crcTable=Array.from({length:256},(_,n)=>{let c=n;for(let k=0;k<8;k++)c=(c&1)?0xedb88320^(c>>>1):c>>>1;return c>>>0});let c=0xffffffff;for(const b of data)c=crcTable[(c^b)&255]^(c>>>8);return(c^0xffffffff)>>>0}
function dosDateTime(date=new Date()){
  const year=Math.max(1980,date.getFullYear()),time=(date.getHours()<<11)|(date.getMinutes()<<5)|(date.getSeconds()>>1),day=((year-1980)<<9)|((date.getMonth()+1)<<5)|date.getDate();return{time,day};
}
function write(files){
  const locals=[],centrals=[];let offset=0;const seen=new Set(),stamp=dosDateTime();
  for(const file of files){const name=safePath(file.name),nameBytes=te.encode(name),data=bytes(file.data);if(seen.has(name))throw Error(`Duplicate normalized ZIP path: ${name}`);seen.add(name);const crc=crc32(data),local=new Uint8Array(30+nameBytes.length),lv=new DataView(local.buffer);lv.setUint32(0,0x04034b50,true);lv.setUint16(4,20,true);lv.setUint16(6,0x800,true);lv.setUint16(8,0,true);lv.setUint16(10,stamp.time,true);lv.setUint16(12,stamp.day,true);lv.setUint32(14,crc,true);lv.setUint32(18,data.length,true);lv.setUint32(22,data.length,true);lv.setUint16(26,nameBytes.length,true);local.set(nameBytes,30);locals.push(local,data);
    const central=new Uint8Array(46+nameBytes.length),cv=new DataView(central.buffer);cv.setUint32(0,0x02014b50,true);cv.setUint16(4,20,true);cv.setUint16(6,20,true);cv.setUint16(8,0x800,true);cv.setUint16(10,0,true);cv.setUint16(12,stamp.time,true);cv.setUint16(14,stamp.day,true);cv.setUint32(16,crc,true);cv.setUint32(20,data.length,true);cv.setUint32(24,data.length,true);cv.setUint16(28,nameBytes.length,true);cv.setUint32(38,0,true);cv.setUint32(42,offset,true);central.set(nameBytes,46);centrals.push(central);offset+=local.length+data.length;
  }
  const centralSize=centrals.reduce((n,p)=>n+p.length,0),eocd=new Uint8Array(22),ev=new DataView(eocd.buffer);ev.setUint32(0,0x06054b50,true);ev.setUint16(8,files.length,true);ev.setUint16(10,files.length,true);ev.setUint32(12,centralSize,true);ev.setUint32(16,offset,true);return concat([...locals,...centrals,eocd]);
}
return{read,write,safePath,crc32,bytes};
});
