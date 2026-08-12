#!/usr/bin/env python3
from pathlib import Path
import json,re,subprocess,sys
ROOT=Path(__file__).resolve().parents[1]
P=[];F=[]
def ck(x,m):(P if x else F).append(m)
r=subprocess.run(['node','--check',str(ROOT/'app.js')],capture_output=True,text=True);ck(r.returncode==0,'app.js JavaScript syntax')
html=(ROOT/'index.html').read_text(encoding='utf8');js=(ROOT/'app.js').read_text(encoding='utf8')
ids=set(re.findall(r'\bid="([^"]+)"',html));refs=set(re.findall(r"\$\('([^']+)'\)",js));missing=sorted((refs-ids)-{'deleteSegmentBtn','mergeNextBtn','segmentStatusSelect'});ck(not missing,f'all static DOM IDs referenced by app exist: {missing}')
raw=(ROOT/'data/psalm1.js').read_text(encoding='utf8');data=json.loads(raw.split('=',1)[1].strip().rstrip(';'))
ck(data['meta']['version']=='0.2.0','data bundle version')
ck(sorted(k for k in data['hebrew'] if k.isdigit())==list('123456'),'Psalm 1 Hebrew verses 1-6')
ck(len(data['lines'])==15,'15 scaffold segments')
oldraw=(Path('/mnt/data/tamil-psalms-editor-v0.1.1/data/psalm1.js')).read_text(encoding='utf8');old=json.loads(oldraw.split('=',1)[1].strip().rstrip(';'))
for k in ['hebrew','tamilLines','englishLines','alignment','lines']:ck(data[k]==old[k],f'read-only source unchanged: {k}')
ck(data['meta']['sources']==old['meta']['sources'],'source SHA-256 provenance unchanged')
schema=json.loads((ROOT/'schema/annotation.schema.json').read_text());ck(schema['properties']['schemaVersion']['const']=='0.2.0','schema version')
sample=json.loads((ROOT/'sample/PSA001.annotations.v0.1.1.migration-sample.json').read_text())
ck(len(sample['parallelGroups'])==5,'migration sample: 5 parallel groups');ck(len(sample['components'])==22,'migration sample: 22 components');ck(len(sample['structures'])==6,'migration sample: 6 structures');ck(len(set(x['id'] for x in sample['structures']))<6,'migration sample contains duplicate structure IDs');ck(all(c['parallelGroupId'] is None for c in sample['components']),'migration sample contains unattached components')
for label,snip in {
'approved edit -> needs review':"if(wasApproved)e.status='needs-review'",
'component unique ID':"nextEntityId('C',state.components)",
'parallel unique ID':"nextEntityId('P',state.parallelGroups)",
'structure unique ID':"nextEntityId('S',state.structures)",
'v0.1 migration':'function migrateV01(input)',
'duplicate validation':"'COMPONENT_DUPLICATE'",
'conflict validation':"'COMPONENT_CONFLICT'",
'unattached validation':"'COMPONENT_UNATTACHED'",
'Hebrew coverage validation':"'HEBREW_UNASSIGNED'",
'revision restore':'function restoreComponentRevision',
'segment assignment':'function assignSegmentToken',
'group deletion keeps component':'parallelGroupId:null'
}.items():ck(snip in js,label)
print('PASS',len(P));[print('  OK',x) for x in P]
if F: print('FAIL',len(F));[print('  X',x) for x in F];sys.exit(1)
print('ALL STATIC/INTEGRITY TESTS PASSED')
