/* IndexedDB persistence for immutable Rose Cookies resources and mutable review overlays. */
((root,factory)=>{const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;root.RESOURCE_DB=api})(typeof globalThis!=='undefined'?globalThis:this,()=>{
'use strict';
const DB_NAME='psalms-editor-resources-v1',DB_VERSION=1;
const STORE_NAMES=['packages','scriptureSources','tokens','wordAlignments','semanticUnits','supportWords','compatibilityFiles','reviews','settings'];
const memory=rootMemory();
function rootMemory(){const root=typeof globalThis!=='undefined'?globalThis:{};return root.__PSALMS_RESOURCE_MEMORY__||(root.__PSALMS_RESOURCE_MEMORY__=Object.fromEntries(STORE_NAMES.map(n=>[n,new Map()]))) }
function hasIndexedDb(){return typeof indexedDB!=='undefined'&&indexedDB?.open}
function request(req){return new Promise((resolve,reject)=>{req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error||Error('IndexedDB request failed'))})}
function open(){if(!hasIndexedDb())return Promise.resolve(null);return new Promise((resolve,reject)=>{const req=indexedDB.open(DB_NAME,DB_VERSION);req.onupgradeneeded=()=>{const db=req.result;
  if(!db.objectStoreNames.contains('packages'))db.createObjectStore('packages',{keyPath:'key'});
  if(!db.objectStoreNames.contains('scriptureSources'))db.createObjectStore('scriptureSources',{keyPath:'key'});
  if(!db.objectStoreNames.contains('tokens')){const s=db.createObjectStore('tokens',{keyPath:'key'});s.createIndex('packagePsalm',['packageKey','psalm']);s.createIndex('packageVerse',['packageKey','psalm','verse'])}
  if(!db.objectStoreNames.contains('wordAlignments')){const s=db.createObjectStore('wordAlignments',{keyPath:'key'});s.createIndex('packagePsalm',['packageKey','psalm'])}
  if(!db.objectStoreNames.contains('semanticUnits')){const s=db.createObjectStore('semanticUnits',{keyPath:'key'});s.createIndex('packagePsalm',['packageKey','psalm'])}
  if(!db.objectStoreNames.contains('supportWords')){const s=db.createObjectStore('supportWords',{keyPath:'key'});s.createIndex('packagePsalm',['packageKey','psalm'])}
  if(!db.objectStoreNames.contains('compatibilityFiles'))db.createObjectStore('compatibilityFiles',{keyPath:'key'});
  if(!db.objectStoreNames.contains('reviews')){const s=db.createObjectStore('reviews',{keyPath:'key'});s.createIndex('packagePsalm',['packageKey','psalm'])}
  if(!db.objectStoreNames.contains('settings'))db.createObjectStore('settings',{keyPath:'key'});
};req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error||Error('Could not open the Rose Cookies resource database'));req.onblocked=()=>reject(Error('Close other Psalms Editor tabs before upgrading resource storage'))})}
function memoryPut(store,value){memory[store].set(value.key,value)}
async function install(payload){
  const db=await open();if(!db){for(const name of ['packages','scriptureSources','tokens','wordAlignments','semanticUnits','supportWords','compatibilityFiles'])for(const value of payload[name]||[])memoryPut(name,value);memoryPut('settings',{key:'activePackage',value:payload.packageKey});return}
  await new Promise((resolve,reject)=>{const names=['packages','scriptureSources','tokens','wordAlignments','semanticUnits','supportWords','compatibilityFiles','settings'],tx=db.transaction(names,'readwrite');tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error||Error('Rose Cookies import transaction failed'));tx.onabort=()=>reject(tx.error||Error('Rose Cookies import transaction was aborted'));
    for(const name of names.slice(0,-1))for(const value of payload[name]||[])tx.objectStore(name).put(value);tx.objectStore('settings').put({key:'activePackage',value:payload.packageKey});
  });db.close();
}
async function get(store,key){const db=await open();if(!db)return memory[store].get(key)||null;const value=await request(db.transaction(store).objectStore(store).get(key));db.close();return value||null}
async function all(store){const db=await open();if(!db)return[...memory[store].values()];const values=await request(db.transaction(store).objectStore(store).getAll());db.close();return values}
async function byPsalm(store,packageKey,psalm){const db=await open();if(!db)return[...memory[store].values()].filter(x=>x.packageKey===packageKey&&x.psalm===+psalm);const tx=db.transaction(store),idx=tx.objectStore(store).index('packagePsalm'),values=await request(idx.getAll(IDBKeyRange.only([packageKey,+psalm])));db.close();return values}
async function activePackage(){const setting=await get('settings','activePackage');return setting?get('packages',setting.value):null}
async function packageById(packageId){return(await all('packages')).filter(x=>x.packageId===packageId)}
async function putReview(review){const db=await open();if(!db){memoryPut('reviews',review);return review}await new Promise((resolve,reject)=>{const tx=db.transaction('reviews','readwrite');tx.objectStore('reviews').put(review);tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error)});db.close();return review}
async function reviewsForPsalm(packageKey,psalm){return byPsalm('reviews',packageKey,psalm)}
async function reviewsForPackage(packageKey){return(await all('reviews')).filter(x=>x.packageKey===packageKey)}
return{DB_NAME,DB_VERSION,STORE_NAMES,open,install,get,all,byPsalm,activePackage,packageById,putReview,reviewsForPsalm,reviewsForPackage,_memory:memory};
});
