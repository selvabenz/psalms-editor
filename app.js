(() => {
  'use strict';
  const DATA = window.PSALM_DATA;
  const STORAGE_KEY = 'tamil-psalms-editor-v0.1.1-psalm1';
  const LABELS = ['a','b','c','d','e'];
  const STATUS_LABEL = {'not-started':'Not started','draft':'Draft','annotated':'Annotated','reviewed':'Reviewed','approved':'Approved','disputed':'Disputed'};

  // Utility functions must be initialized before state/history bootstrapping.
  const $ = id => document.getElementById(id);
  const clone = x => JSON.parse(JSON.stringify(x));
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const now = () => new Date().toISOString();
  const shortLine = id => id.replace('PSA.1.','');

  const defaultState = () => ({
    schemaVersion:'0.1.1', book:'PSA', psalm:1, sourceVersion:'UHB v2.1.32',
    psalmStatus:'not-started', lineStatuses:{}, parallelGroups:[], components:[], structures:[], notes:[], updatedAt:new Date().toISOString()
  });

  let state = loadState();
  let history = [clone(state)], historyIndex = 0;
  let selection = {lines:new Set(), hebrew:new Set(), tamil:new Set(), focus:null};

  function loadState(){
    try { const x=localStorage.getItem(STORAGE_KEY); return x ? JSON.parse(x) : defaultState(); }
    catch { return defaultState(); }
  }
  function persist(){ state.updatedAt=now(); try { localStorage.setItem(STORAGE_KEY,JSON.stringify(state)); $('saveState').textContent='Saved locally'; } catch { $('saveState').textContent='Use Export to save'; } }
  function commit(mutator, message='Saved'){
    mutator(); persist(); history = history.slice(0, historyIndex+1); history.push(clone(state)); historyIndex++;
    renderAll(); toast(message);
  }
  function undo(){ if(historyIndex<=0)return; historyIndex--; state=clone(history[historyIndex]); persist(); renderAll(); toast('Undone'); }
  function redo(){ if(historyIndex>=history.length-1)return; historyIndex++; state=clone(history[historyIndex]); persist(); renderAll(); toast('Redone'); }
  function toast(msg){ const t=$('toast'); t.textContent=msg; t.classList.add('show'); clearTimeout(t._timer); t._timer=setTimeout(()=>t.classList.remove('show'),1800); }

  const hebrewById = {};
  Object.values(DATA.hebrew).forEach(v => v.words.forEach(w => hebrewById[w.id]=w));
  const tamilById = {};
  Object.values(DATA.alignment).forEach(v => (v.tokens||[]).forEach(t => tamilById[t.id]=t));
  const alignByHebrew = {}, alignByTamil = {};
  Object.values(DATA.alignment).forEach(v => (v.alignments||[]).forEach(a => {
    if(a.hebrewTokenId){ (alignByHebrew[a.hebrewTokenId] ||= []).push(a); }
    a.tamilTokenIds.forEach(tid => (alignByTamil[tid] ||= []).push(a));
  }));
  const lineById = Object.fromEntries(DATA.lines.map(l=>[l.id,l]));

  function hasComponentToken(id, lang){ return state.components.some(c => (lang==='hebrew'?c.hebrewTokenIds:c.tamilTokenIds).includes(id)); }
  function tokenComponentLabels(id, lang){ return state.components.filter(c => (lang==='hebrew'?c.hebrewTokenIds:c.tamilTokenIds).includes(id)).map(c=>c.label); }

  function renderAll(){
    renderVerseList(); renderInspector(); renderParallelPicker(); renderParallelGroups(); renderStructures(); renderStructureSelects(); renderComponentGroupSelect(); renderDataset(); renderProgress();
    $('undoBtn').disabled=historyIndex<=0; $('redoBtn').disabled=historyIndex>=history.length-1;
  }

  function renderVerseList(){
    const root=$('verseList'); root.innerHTML='';
    for(const verse of Object.keys(DATA.hebrew).filter(x=>/^\d+$/.test(x)).sort((a,b)=>+a-+b)){
      const card=document.createElement('article'); card.className='verse-card';
      const verseLines=DATA.lines.filter(l=>l.verse===verse);
      const statuses=verseLines.map(l=>state.lineStatuses[l.id]||'not-started');
      let vStatus=statuses.every(s=>s==='approved')?'approved':statuses.some(s=>s==='reviewed')?'reviewed':statuses.some(s=>s!=='not-started')?'annotated':'not-started';
      card.innerHTML=`<div class="verse-head"><strong>Psalm 1:${verse}</strong><span class="verse-status">${STATUS_LABEL[vStatus]}</span></div>`;
      const sg=document.createElement('div'); sg.className='source-grid';
      const heb=document.createElement('div'); heb.className='source-col';
      heb.innerHTML=`<div class="source-label"><span>HEBREW • UHB 2.1.32</span><span>RTL</span></div>`;
      const ht=document.createElement('div'); ht.className='hebrew';
      DATA.hebrew[verse].words.forEach(w=>{
        const sp=document.createElement('span'); sp.className='token aligned'; sp.dataset.token=w.id; sp.dataset.lang='hebrew'; sp.textContent=w.text;
        if(selection.hebrew.has(w.id))sp.classList.add('selected'); if(hasComponentToken(w.id,'hebrew'))sp.classList.add('has-component');
        sp.title='Click for lemma, Strong’s, morphology and Tamil alignment'; ht.append(sp,document.createTextNode(' '));
      }); heb.appendChild(ht);
      const tam=document.createElement('div'); tam.className='source-col';
      tam.innerHTML=`<div class="source-label"><span>TAMIL • IRV</span><span>READ ONLY</span></div>`;
      const tl=document.createElement('div'); tl.className='tamil-lines';
      (DATA.tamilLines[verse]||[]).forEach(x=>{const d=document.createElement('span');d.className='poetry-line';d.textContent=x.text;tl.appendChild(d)}); tam.appendChild(tl);
      const tokenTray=document.createElement('div'); tokenTray.className='help'; tokenTray.style.marginTop='8px';
      (DATA.alignment[verse]?.tokens||[]).forEach(t=>{const sp=document.createElement('span');sp.className='token aligned';sp.dataset.token=t.id;sp.dataset.lang='tamil';sp.textContent=t.text;if(selection.tamil.has(t.id))sp.classList.add('selected');if(hasComponentToken(t.id,'tamil'))sp.classList.add('has-component');tokenTray.append(sp,document.createTextNode(' '))}); tam.appendChild(tokenTray);
      const eng=document.createElement('div'); eng.className='source-col';
      eng.innerHTML=`<div class="source-label"><span>ENGLISH • ESV</span><span>LOCAL REFERENCE</span></div>`;
      const el=document.createElement('div');el.className='english-lines';(DATA.englishLines[verse]||[]).forEach(x=>{const d=document.createElement('span');d.className='poetry-line';d.textContent=x.text.replace(/\*/g,'');el.appendChild(d)});eng.appendChild(el);
      sg.append(heb,tam,eng); card.appendChild(sg);
      const wl=document.createElement('div');wl.className='working-lines';wl.innerHTML='<div class="working-title">DRAFT WORKING-LINE SCAFFOLD</div>';
      verseLines.forEach(line=>{
        const r=document.createElement('div');r.className='working-row';r.dataset.line=line.id;if(selection.lines.has(line.id))r.classList.add('selected');
        const st=state.lineStatuses[line.id]||'not-started';r.innerHTML=`<span class="line-ref">${esc(shortLine(line.id))}</span><span class="line-text">${esc(line.tamilText)}</span><span class="status-badge ${st}">${esc(STATUS_LABEL[st])}</span>`;wl.appendChild(r);
      }); card.appendChild(wl);root.appendChild(card);
    }
    root.querySelectorAll('.token').forEach(el=>el.addEventListener('click',()=>selectToken(el.dataset.lang,el.dataset.token)));
    root.querySelectorAll('.working-row').forEach(el=>el.addEventListener('click',()=>selectLine(el.dataset.line)));
  }

  function selectToken(lang,id){ const set=selection[lang]; set.has(id)?set.delete(id):set.add(id); selection.focus={type:'token',lang,id}; renderVerseList(); renderInspector(); }
  function selectLine(id){ selection.lines.has(id)?selection.lines.delete(id):selection.lines.add(id); selection.focus={type:'line',id}; renderVerseList(); renderParallelPicker(); renderInspector(); }
  function clearSelection(){ selection={lines:new Set(),hebrew:new Set(),tamil:new Set(),focus:null}; renderAll(); }

  function renderInspector(){
    const title=$('inspectorTitle'), body=$('inspectorBody');
    if(selection.focus?.type==='token'){
      const {lang,id}=selection.focus;
      if(lang==='hebrew'){
        const w=hebrewById[id], als=alignByHebrew[id]||[]; const tamil=[...new Set(als.flatMap(a=>a.tamilTokenIds).map(x=>tamilById[x]?.text).filter(Boolean))];
        title.textContent=w.text; body.innerHTML=`<dl class="inspector-kv"><dt>Lemma</dt><dd dir="rtl">${esc(w.lemma)}</dd><dt>Strong</dt><dd>${esc(w.strong)}</dd><dt>Morphology</dt><dd>${esc(w.morph)}</dd><dt>Tamil alignment</dt><dd>${esc(tamil.join(' · ')||'Unaligned')}</dd><dt>Components</dt><dd>${esc(tokenComponentLabels(id,'hebrew').join(', ')||'—')}</dd></dl>`;
      } else {
        const t=tamilById[id], als=alignByTamil[id]||[]; const hs=[...new Set(als.map(a=>a.hebrewTokenId).filter(Boolean))].map(x=>hebrewById[x]);
        title.textContent=t?.text||id; body.innerHTML=`<dl class="inspector-kv"><dt>Hebrew</dt><dd dir="rtl">${esc(hs.map(h=>h.text).join(' · ')||'Unaligned')}</dd><dt>Lemma</dt><dd dir="rtl">${esc(hs.map(h=>h.lemma).join(' · ')||'—')}</dd><dt>Strong</dt><dd>${esc(hs.map(h=>h.strong).join(' · ')||'—')}</dd><dt>Components</dt><dd>${esc(tokenComponentLabels(id,'tamil').join(', ')||'—')}</dd></dl>`;
      }
    } else if(selection.focus?.type==='line'){
      const l=lineById[selection.focus.id]; title.textContent=shortLine(l.id); body.innerHTML=`<div class="inspector-kv"><dt>Verse</dt><dd>Psalm 1:${esc(l.verse)}</dd><dt>Tamil</dt><dd>${esc(l.tamilText)}</dd><dt>English</dt><dd>${esc(l.englishText.replace(/\*/g,''))}</dd><dt>Status</dt><dd>${esc(STATUS_LABEL[state.lineStatuses[l.id]||'not-started'])}</dd></div>`;
    } else if(selection.hebrew.size||selection.tamil.size||selection.lines.size){ title.textContent='Multiple selection'; body.textContent=`${selection.hebrew.size} Hebrew token(s), ${selection.tamil.size} Tamil token(s), ${selection.lines.size} line(s).`; }
    else { title.textContent='Nothing selected'; body.className='muted'; body.textContent='Click a Hebrew/Tamil token or a working line.'; }
  }

  function renderComponentButtons(){ const r=$('componentButtons'); r.innerHTML=''; LABELS.forEach(label=>{const b=document.createElement('button');b.textContent=label;b.addEventListener('click',()=>assignComponent(label));r.appendChild(b)}); }
  function assignComponent(label){
    if(!selection.hebrew.size&&!selection.tamil.size){toast('Select Hebrew and/or Tamil tokens first');return;}
    const groupId=$('componentGroupSelect').value||null;
    commit(()=>state.components.push({id:'C'+String(state.components.length+1).padStart(3,'0'),label,parallelGroupId:groupId,hebrewTokenIds:[...selection.hebrew],tamilTokenIds:[...selection.tamil],status:'annotated',note:'',createdAt:now()}),`Component ${label} added`);
    selection.hebrew.clear();selection.tamil.clear();selection.focus=null;
  }

  function renderParallelPicker(){ const r=$('parallelLinePicker'); if(!r)return;r.innerHTML=''; DATA.lines.forEach(l=>{const row=document.createElement('label');row.className='picker-row'+(selection.lines.has(l.id)?' selected':'');row.innerHTML=`<input type="checkbox" ${selection.lines.has(l.id)?'checked':''}><span class="picker-ref">${esc(shortLine(l.id))}</span><span class="picker-text"><strong>${esc(l.tamilText)}</strong><br><span class="muted">${esc(l.englishText.replace(/\*/g,''))}</span></span>`;row.querySelector('input').addEventListener('change',()=>selectLine(l.id));r.appendChild(row)}); }
  function createParallel(){ if(selection.lines.size<2){toast('Choose at least two working lines');return;} const ids=DATA.lines.filter(l=>selection.lines.has(l.id)).map(l=>l.id); commit(()=>state.parallelGroups.push({id:'P'+String(state.parallelGroups.length+1).padStart(3,'0'),lineIds:ids,type:$('parallelType').value,confidence:$('parallelConfidence').value,note:$('parallelNote').value.trim(),status:'annotated',createdAt:now()}),'Parallel group created'); selection.lines.clear(); $('parallelNote').value=''; }
  function renderParallelGroups(){ const r=$('parallelGroups');if(!r)return;r.innerHTML=''; if(!state.parallelGroups.length){r.innerHTML='<p class="muted">No parallel groups yet.</p>';return;} state.parallelGroups.forEach(g=>{const c=document.createElement('div');c.className='group-card';c.innerHTML=`<div class="group-top"><span class="group-title">${esc(g.id)} · ${esc(g.type)}</span><span class="pill">${esc(g.confidence)}</span></div><div class="group-lines">${g.lineIds.map(shortLine).join(' ↔ ')}</div>${g.note?`<p class="help">${esc(g.note)}</p>`:''}<div class="card-actions"><button data-action="reviewed">Reviewed</button><button data-action="approved">Approve</button><button data-action="delete">Delete</button></div>`;c.querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>{const a=b.dataset.action;if(a==='delete')commit(()=>{state.parallelGroups=state.parallelGroups.filter(x=>x.id!==g.id);state.components=state.components.filter(x=>x.parallelGroupId!==g.id)},'Group deleted');else commit(()=>g.status=a,`Group ${g.id}: ${STATUS_LABEL[a]}`)}));r.appendChild(c)}); }

  function renderComponentGroupSelect(){ const s=$('componentGroupSelect');if(!s)return;const cur=s.value;s.innerHTML='<option value="">No group / assign later</option>'+state.parallelGroups.map(g=>`<option value="${esc(g.id)}">${esc(g.id)} · ${esc(g.type)}</option>`).join('');if([...s.options].some(o=>o.value===cur))s.value=cur; }

  function renderStructureSelects(){ const opts=DATA.lines.map(l=>`<option value="${l.id}">${shortLine(l.id)} — ${esc(l.tamilText.slice(0,45))}</option>`).join(''); $('structureStart').innerHTML=opts;$('structureEnd').innerHTML=opts; const p=$('structureParent');p.innerHTML='<option value="">No parent</option>'+state.structures.map(x=>`<option value="${x.id}">${esc(x.label)} · ${esc(x.title)}</option>`).join(''); }
  function addStructure(){ const label=$('structureLabel').value.trim(), title=$('structureTitle').value.trim();if(!label||!title){toast('Add a label and title');return;} const a=DATA.lines.findIndex(l=>l.id===$('structureStart').value),b=DATA.lines.findIndex(l=>l.id===$('structureEnd').value);if(a>b){toast('End line must be after start line');return;} commit(()=>state.structures.push({id:'S'+String(state.structures.length+1).padStart(3,'0'),label,title,type:$('structureType').value,startLineId:$('structureStart').value,endLineId:$('structureEnd').value,parentId:$('structureParent').value||null,note:$('structureNote').value.trim(),status:'annotated',createdAt:now()}),'Structure unit added'); ['structureLabel','structureTitle','structureNote'].forEach(id=>$(id).value=''); }
  function depthFor(s){let d=0,p=s.parentId,seen=new Set();while(p&&!seen.has(p)){seen.add(p);d++;p=state.structures.find(x=>x.id===p)?.parentId;if(d>2)break;}return d;}
  function renderStructures(){ const r=$('structureTree');if(!r)return;r.innerHTML='';if(!state.structures.length){r.innerHTML='<p class="muted">No structure units yet. Add sections, strophes, refrains, inclusios or other units from the panel.</p>';return;} const sorted=[...state.structures].sort((x,y)=>DATA.lines.findIndex(l=>l.id===x.startLineId)-DATA.lines.findIndex(l=>l.id===y.startLineId)); sorted.forEach(s=>{const e=document.createElement('div');e.className='structure-item';e.dataset.depth=depthFor(s);e.innerHTML=`<div class="structure-top"><span class="structure-title">${esc(s.label)} — ${esc(s.title)}</span><span class="pill">${esc(s.type)}</span></div><div class="group-lines">${shortLine(s.startLineId)} → ${shortLine(s.endLineId)} · ${STATUS_LABEL[s.status]||s.status}</div>${s.note?`<p class="help">${esc(s.note)}</p>`:''}<div class="card-actions"><button data-action="reviewed">Reviewed</button><button data-action="approved">Approve</button><button data-action="delete">Delete</button></div>`;e.querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>{const a=b.dataset.action;if(a==='delete')commit(()=>{state.structures=state.structures.filter(x=>x.id!==s.id);state.structures.forEach(x=>{if(x.parentId===s.id)x.parentId=null})},'Structure unit deleted');else commit(()=>s.status=a,`Structure ${s.label}: ${STATUS_LABEL[a]}`)}));r.appendChild(e)}); }

  function applyStatus(status){
    if(selection.lines.size){commit(()=>selection.lines.forEach(id=>state.lineStatuses[id]=status),`Selected lines: ${STATUS_LABEL[status]}`);return;}
    toast('Select one or more working lines first');
  }
  function approveReviewed(){ commit(()=>{Object.keys(state.lineStatuses).forEach(k=>{if(state.lineStatuses[k]==='reviewed')state.lineStatuses[k]='approved'});state.parallelGroups.forEach(x=>{if(x.status==='reviewed')x.status='approved'});state.components.forEach(x=>{if(x.status==='reviewed')x.status='approved'});state.structures.forEach(x=>{if(x.status==='reviewed')x.status='approved'})},'Reviewed annotations approved'); }
  function approvePsalm(){ commit(()=>{state.psalmStatus='approved';DATA.lines.forEach(l=>state.lineStatuses[l.id]='approved')},'Psalm 1 marked approved'); }

  function loadStarter(){ if(state.parallelGroups.some(g=>g.id==='P001')||state.components.length){toast('Starter not loaded: annotations already exist');return;}
    const tids = text => Object.values(tamilById).filter(t=>text.includes(t.text)).map(t=>t.id);
    commit(()=>{
      state.parallelGroups.push({id:'P001',lineIds:['PSA.1.1.L1','PSA.1.1.L2','PSA.1.1.L3'],type:'Synonymous',confidence:'Medium',note:'Starter example only: the three negative clauses show patterned correspondence. Review the classification and segmentation before approval.',status:'draft',createdAt:now()});
      state.components.push(
        {id:'C001',label:'a',parallelGroupId:'P001',hebrewTokenIds:['h-1-1-5','h-1-1-11','h-1-1-15'],tamilTokenIds:tids(['நடக்காமலும்','நிற்காமலும்','உட்காராமலும்']),status:'draft',note:'Verbal correspondence',createdAt:now()},
        {id:'C002',label:'b',parallelGroupId:'P001',hebrewTokenIds:['h-1-1-6','h-1-1-8','h-1-1-12'],tamilTokenIds:tids(['ஆலோசனையின்படி','வழியில்','உட்காரும்','இடத்தில்']),status:'draft',note:'Social/location frame',createdAt:now()},
        {id:'C003',label:'c',parallelGroupId:'P001',hebrewTokenIds:['h-1-1-7','h-1-1-9','h-1-1-13'],tamilTokenIds:tids(['துன்மார்க்கர்களுடைய','பாவிகளுடைய','பரியாசக்காரர்கள்']),status:'draft',note:'Wicked-person terms',createdAt:now()}
      );
      ['PSA.1.1.L1','PSA.1.1.L2','PSA.1.1.L3'].forEach(id=>state.lineStatuses[id]='draft');
    },'Starter example loaded');
  }

  function renderDataset(){ const p=$('jsonPreview');if(p)p.textContent=JSON.stringify(state,null,2); const list=$('sourceHashes');if(list){list.innerHTML='';Object.values(DATA.meta.sources).forEach(s=>{const d=document.createElement('div');d.className='hash-item';d.innerHTML=`<strong>${esc(s.label)}</strong><div class="hash">SHA-256 ${esc(s.sha256)}</div>`;list.appendChild(d)});} const db=$('sourceDialogBody');if(db){db.innerHTML=Object.values(DATA.meta.sources).map(s=>`<div class="source-info-row"><strong>${esc(s.label)}</strong><div class="hash">${esc(s.sha256)}</div></div>`).join('');} }
  function renderProgress(){ const total=DATA.lines.length, done=DATA.lines.filter(l=>(state.lineStatuses[l.id]||'not-started')!=='not-started').length; $('progressText').textContent=`${done}/${total} working lines annotated · ${state.parallelGroups.length} parallel group(s) · ${state.components.length} component(s)`; $('approvePsalmBtn').textContent=state.psalmStatus==='approved'?'✓ Psalm approved':'Approve Psalm'; }

  function exportJson(){ const blob=new Blob([JSON.stringify(state,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='PSA001.annotations.v0.1.1.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);toast('Annotation JSON exported'); }
  function importJson(file){ const rd=new FileReader();rd.onload=()=>{try{const x=JSON.parse(rd.result);if(x.book!=='PSA'||+x.psalm!==1)throw new Error('Not Psalm 1 annotation JSON');state=x;persist();history=[clone(state)];historyIndex=0;clearSelection();toast('Annotations imported');}catch(e){toast('Import failed: '+e.message)}};rd.readAsText(file); }
  async function copyJson(){ try{await navigator.clipboard.writeText(JSON.stringify(state,null,2));toast('JSON copied');}catch{toast('Clipboard unavailable; use Export annotations');} }

  function bind(){
    document.querySelectorAll('.tab').forEach(b=>b.addEventListener('click',()=>{document.querySelectorAll('.tab').forEach(x=>x.classList.toggle('active',x===b));document.querySelectorAll('.tab-panel').forEach(p=>p.classList.toggle('active',p.id===b.dataset.tab));renderAll()}));
    $('undoBtn').onclick=undo;$('redoBtn').onclick=redo;$('exportBtn').onclick=exportJson;$('importInput').onchange=e=>e.target.files[0]&&importJson(e.target.files[0]);$('clearSelectionBtn').onclick=clearSelection;
    $('createParallelBtn').onclick=createParallel;$('addStructureBtn').onclick=addStructure;$('approveReviewedBtn').onclick=approveReviewed;$('approvePsalmBtn').onclick=approvePsalm;$('loadStarterBtn').onclick=loadStarter;$('copyJsonBtn').onclick=copyJson;
    document.querySelectorAll('[data-status-action]').forEach(b=>b.addEventListener('click',()=>applyStatus(b.dataset.statusAction)));
    $('sourceInfoBtn').onclick=()=>$('sourceDialog').showModal();
    document.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='z'){e.preventDefault();e.shiftKey?redo():undo();}});
  }
  renderComponentButtons(); bind(); renderAll();
})();
