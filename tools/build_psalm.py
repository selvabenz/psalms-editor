#!/usr/bin/env python3
import argparse, json, re, unicodedata, hashlib
from pathlib import Path


def sha256(path):
    h=hashlib.sha256()
    with open(path,'rb') as f:
        for chunk in iter(lambda:f.read(1024*1024), b''):
            h.update(chunk)
    return h.hexdigest()

def chapter_block(text, chapter):
    m=re.search(rf'(?m)^\\c\s+{chapter}\s*$', text)
    if not m: raise ValueError(f'Chapter {chapter} not found')
    n=re.search(r'(?m)^\\c\s+\d+\s*$', text[m.end():])
    end=m.end()+n.start() if n else len(text)
    return text[m.start():end]

def strip_note_blocks(s):
    s=re.sub(r'\\f\s.*?\\f\*', '', s, flags=re.S)
    s=re.sub(r'\\x\s.*?\\x\*', '', s, flags=re.S)
    return s

def clean_usfm_text(s):
    s=strip_note_blocks(s)
    s=s.replace('\\nd*','')
    s=re.sub(r'\\nd\s*', '', s)
    s=re.sub(r'\\[a-zA-Z0-9+]+\*?', ' ', s)
    s=re.sub(r'\s+([,.;:!?])', r'\1', s)
    return re.sub(r'\s+', ' ', s).strip()

def parse_poetic_lines(path, chapter):
    txt=Path(path).read_text(encoding='utf-8-sig')
    block=chapter_block(txt,chapter)
    verses={}
    cur_v=None
    line_idx={}
    for raw in block.splitlines():
        if raw.startswith('\\c '): continue
        if re.match(r'^\\(ms|s\d*|r|d|sp|qa|qc|qr|b)\b', raw) and not raw.startswith('\\q'):
            continue
        vm=re.search(r'\\v\s+(\d+[a-z]?)\s*', raw)
        if vm:
            cur_v=vm.group(1)
            line_idx.setdefault(cur_v,0)
            raw=raw[vm.end():]
        if not cur_v: continue
        # poem lines are q/q1/q2 etc; non-q continuation attaches to last line
        qm=re.match(r'^\\q\d*\s*', raw)
        if qm:
            raw=raw[qm.end():]
            text=clean_usfm_text(raw)
            if text:
                line_idx[cur_v]+=1
                verses.setdefault(cur_v,[]).append({'id':f'v{cur_v}l{line_idx[cur_v]}','text':text})
        else:
            text=clean_usfm_text(raw)
            if text:
                if not verses.get(cur_v):
                    line_idx[cur_v]+=1
                    verses.setdefault(cur_v,[]).append({'id':f'v{cur_v}l{line_idx[cur_v]}','text':text})
                else:
                    verses[cur_v][-1]['text'] += ' ' + text
    return verses

def parse_uhb(path, chapter):
    obj=json.loads(Path(path).read_text(encoding='utf-8'))
    verses={}
    for vk,v in obj.items():
        if vk=='front' or not vk.isdigit(): continue
        words=[]; text=''
        idx=0
        for o in v.get('verseObjects',[]):
            if o.get('type')=='word':
                idx+=1
                token={'id':f'h-{chapter}-{vk}-{idx}', 'text':o.get('text',''), 'lemma':o.get('lemma',''), 'strong':o.get('strong',''), 'morph':o.get('morph','')}
                words.append(token); text+=token['text']
            else:
                text+=o.get('text','')
        verses[vk]={'text':text.strip(), 'words':words}
    return verses

def parse_attrs(s):
    return {k:v for k,v in re.findall(r'([\w-]+)="([^"]*)"', s)}

def norm(s):
    return unicodedata.normalize('NFC',s)

def parse_alignment(path, chapter, uhb):
    txt=Path(path).read_text(encoding='utf-8-sig')
    block=chapter_block(txt,chapter)
    lookup={}
    for v,data in uhb.items():
        d={}
        for w in data['words']:
            d.setdefault(norm(w['text']),[]).append(w['id'])
        lookup[v]=d

    # Group physical USFM lines into logical poetry lines beginning with \\q.
    logical=[]; current=None; cur_v=None
    for physical in block.splitlines():
        if physical.startswith('\\c '):
            continue
        stripped=physical.strip()
        if re.match(r'^\\q\d*\b', stripped):
            if current:
                logical.append(current)
            vm=re.search(r'\\v\s+(\d+[a-z]?)\s*', stripped)
            if vm:
                cur_v=vm.group(1)
                stripped=stripped[:vm.start()]+stripped[vm.end():]
            stripped=re.sub(r'^\\q\d*\s*','',stripped)
            current={'verse':cur_v,'raw':stripped}
        elif current and stripped and not re.match(r'^\\(b|c|ms|s\d*|d|sp)\b', stripped):
            vm=re.search(r'\\v\s+(\d+[a-z]?)\s*', stripped)
            if vm:
                # A bare verse marker after an empty q starts a new line/verse.
                if current.get('raw','').strip():
                    logical.append(current)
                cur_v=vm.group(1)
                stripped=stripped[:vm.start()]+stripped[vm.end():]
                current={'verse':cur_v,'raw':stripped}
            else:
                current['raw'] += '\n' + stripped
    if current:
        logical.append(current)

    verses={}; line_index={}; token_index={}; align_index=0
    pat=re.compile(r'\\zaln-s\s*\|([^\\]*?)\\\*|\\zaln-e\\\*|\\w\s+([^|\\]+)\|([^\\]*?)\\w\*')
    for item in logical:
        cur_v=item['verse']
        if not cur_v: continue
        rawline=strip_note_blocks(item['raw'])
        if not rawline.strip(): continue
        line_index[cur_v]=line_index.get(cur_v,0)+1
        token_index.setdefault(cur_v,0)
        line_id=f'v{cur_v}l{line_index[cur_v]}'
        verses.setdefault(cur_v, {'lines':[], 'tokens':[], 'alignments':[]})
        verses[cur_v]['lines'].append({'id':line_id,'tokenIds':[]})
        stack=[]
        for m in pat.finditer(rawline):
            full=m.group(0)
            if full.startswith('\\zaln-s'):
                attrs=parse_attrs(m.group(1) or '')
                align_index+=1
                occ=int(attrs.get('x-occurrence','1') or 1)
                content=norm(attrs.get('x-content',''))
                ids=lookup.get(cur_v,{}).get(content,[])
                hid=ids[occ-1] if 0 < occ <= len(ids) else None
                a={'id':f'a-{chapter}-{align_index}','verse':cur_v,'lineId':line_id,
                   'hebrewTokenId':hid,'hebrew':attrs,'tamilTokenIds':[]}
                verses[cur_v]['alignments'].append(a)
                stack.append(a)
            elif full.startswith('\\zaln-e'):
                if stack: stack.pop()
            else:
                word=(m.group(2) or '').strip()
                if not word: continue
                token_index[cur_v]+=1
                tid=f't-{chapter}-{cur_v}-{token_index[cur_v]}'
                tok={'id':tid,'text':word,'lineId':line_id}
                verses[cur_v]['tokens'].append(tok)
                verses[cur_v]['lines'][-1]['tokenIds'].append(tid)
                for a in stack:
                    a['tamilTokenIds'].append(tid)
    return verses

def make_line_model(tamil_lines, esv_lines, alignment, uhb):
    result=[]
    for vk in sorted(tamil_lines, key=lambda x:int(re.match(r'\d+',x).group())):
        tls=tamil_lines[vk]
        els=esv_lines.get(vk,[])
        # Psalm 1 ESV sometimes splits the opening clause into an extra poetic display line.
        # For the logical Tamil-centered line model, merge the first two ESV lines when
        # ESV has exactly one extra line; the original ESV lines remain untouched above.
        if len(els) == len(tls) + 1:
            els = [{'id':els[0]['id']+'+'+els[1]['id'], 'text':els[0]['text']+' '+els[1]['text']}] + els[2:]
        al=alignment.get(vk, {'lines':[],'tokens':[],'alignments':[]})
        tok_by_id={t['id']:t for t in al.get('tokens',[])}
        a_by_line={}
        for a in al.get('alignments',[]):
            a_by_line.setdefault(a['lineId'],[]).append(a)
        for i,tl in enumerate(tls):
            lineid=tl['id']
            heb_ids=[]
            for a in a_by_line.get(lineid,[]):
                if a['hebrewTokenId'] and a['hebrewTokenId'] not in heb_ids:
                    heb_ids.append(a['hebrewTokenId'])
            # sort hebrew ids by token sequence
            order={w['id']:j for j,w in enumerate(uhb.get(vk,{}).get('words',[]))}
            heb_ids.sort(key=lambda x:order.get(x,999))
            result.append({
                'id':f'PSA.{1}.{vk}.L{i+1}',
                'verse':vk,
                'lineIndex':i+1,
                'tamilText':tl['text'],
                'englishText':els[i]['text'] if i < len(els) else '',
                'hebrewTokenIds':heb_ids,
                'tamilTokenIds':al.get('lines',[{}]*len(tls))[i].get('tokenIds',[]) if i < len(al.get('lines',[])) else [],
                'status':'not-started'
            })
    return result

def main():
    ap=argparse.ArgumentParser()
    ap.add_argument('--tamil',required=True); ap.add_argument('--esv',required=True); ap.add_argument('--alignment',required=True); ap.add_argument('--uhb',required=True); ap.add_argument('--chapter',type=int,default=1); ap.add_argument('--out',required=True)
    args=ap.parse_args(); ch=args.chapter
    tamil=parse_poetic_lines(args.tamil,ch)
    esv=parse_poetic_lines(args.esv,ch)
    uhb=parse_uhb(args.uhb,ch)
    align=parse_alignment(args.alignment,ch,uhb)
    lines=make_line_model(tamil,esv,align,uhb)
    data={
      'meta':{'book':'PSA','psalm':ch,'version':'0.1','sourcePolicy':'read-only',
              'sources':{
                'tamil':{'label':'Tamil IRV Psalms','sha256':sha256(args.tamil)},
                'hebrew':{'label':'UHB v2.1.32','sha256':sha256(args.uhb)},
                'english':{'label':'ESV Psalms (user-supplied, local reference)','sha256':sha256(args.esv)},
                'alignment':{'label':'Hebrew–Tamil alignment (user-supplied)','sha256':sha256(args.alignment)}
              }},
      'hebrew':uhb,'tamilLines':tamil,'englishLines':esv,'alignment':align,'lines':lines
    }
    Path(args.out).write_text('window.PSALM_DATA = '+json.dumps(data,ensure_ascii=False,indent=2)+';\n',encoding='utf-8')
    # stats
    matches=sum(1 for v in align.values() for a in v['alignments'] if a['hebrewTokenId'])
    total=sum(len(v['alignments']) for v in align.values())
    print(f'wrote {args.out}; {len(lines)} logical lines; alignment Hebrew matches {matches}/{total}')

if __name__=='__main__': main()
