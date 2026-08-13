#!/usr/bin/env python3
from __future__ import annotations
import argparse, json, re, subprocess, sys
from pathlib import Path
import time

AGENT = Path('/home/hermes/.hermes/hermes-agent')
ROOT = Path('/home/hermes/world-research-daily')
OUT = ROOT / '.audio-rebuild'
MAX_CHARS = 2900
sys.path.insert(0, str(AGENT))
from tools.tts_tool import _generate_xai_tts  # noqa: E402


def speech_text(markdown: str) -> str:
    lines=[]
    for raw in markdown.splitlines():
        line=raw.strip()
        if line.startswith('## 来源与检索日期'):
            break
        if line.startswith('# '):
            continue
        line=re.sub(r'^#{2,6}\s*', '', line)
        line=re.sub(r'^[-*+]\s+', '', line)
        line=re.sub(r'^>\s*', '', line)
        line=re.sub(r'\[([^]]+)\]\([^)]+\)', r'\1', line)
        line=re.sub(r'[*_`~]', '', line)
        if line == '---':
            continue
        lines.append(line)
    return '\n'.join(lines).strip()


def split_text(text: str) -> list[str]:
    paragraphs=[p.strip() for p in re.split(r'\n\s*\n',text) if p.strip()]
    chunks=[]; current=''
    for paragraph in paragraphs:
        units=[paragraph] if len(paragraph)<=MAX_CHARS else [x.strip() for x in re.split(r'(?<=[。！？；])',paragraph) if x.strip()]
        for unit in units:
            for small in ([unit] if len(unit)<=MAX_CHARS else [unit[i:i+MAX_CHARS] for i in range(0,len(unit),MAX_CHARS)]):
                candidate=(current+'\n\n'+small).strip() if current else small
                if len(candidate)<=MAX_CHARS: current=candidate
                else:
                    if current: chunks.append(current)
                    current=small
    if current: chunks.append(current)
    return chunks


def probe(path: Path) -> float:
    return float(subprocess.check_output(['ffprobe','-v','error','-show_entries','format=duration','-of','csv=p=0',str(path)],text=True).strip())


def build(slug: str):
    md=ROOT/'public/episodes'/f'{slug}.md'; work=OUT/slug; parts=work/'parts'; parts.mkdir(parents=True,exist_ok=True)
    text=speech_text(md.read_text(encoding='utf-8')); chunks=split_text(text)
    config={'xai':{'voice_id':'eve','language':'zh','bit_rate':128000,'text_normalization':True}}
    files=[]
    for i,chunk in enumerate(chunks,1):
        part=parts/f'part-{i:02d}.mp3'
        if part.exists():
            try:
                if part.stat().st_size > 10000 and probe(part) > 1:
                    print(f'{slug} {i}/{len(chunks)} reuse', flush=True)
                    files.append(part)
                    continue
            except Exception:
                part.unlink(missing_ok=True)
        print(f'{slug} {i}/{len(chunks)} chars={len(chunk)}',flush=True)
        last_error = None
        for attempt in range(1, 5):
            try:
                temp = part.with_suffix('.tmp.mp3')
                temp.unlink(missing_ok=True)
                _generate_xai_tts(chunk, str(temp), config)
                if temp.stat().st_size <= 10000 or probe(temp) <= 1:
                    raise RuntimeError('TTS returned invalid audio')
                temp.replace(part)
                last_error = None
                break
            except Exception as exc:
                last_error = exc
                print(f'{slug} {i}/{len(chunks)} attempt {attempt} failed: {exc}', flush=True)
                time.sleep(min(20, attempt * 5))
        if last_error:
            raise last_error
        files.append(part)
    concat=work/'concat.txt'; concat.write_text(''.join(f"file \'{p.resolve()}\'\n" for p in files),encoding='utf-8')
    target=work/f'{slug}.mp3'
    subprocess.run(['ffmpeg','-y','-loglevel','error','-f','concat','-safe','0','-i',str(concat),'-c:a','copy',str(target)],check=True)
    decode=subprocess.run(['ffmpeg','-v','error','-i',str(target),'-f','null','-'],capture_output=True,text=True)
    if decode.returncode: raise RuntimeError(decode.stderr)
    result={'slug':slug,'chunks':len(chunks),'duration':probe(target),'size':target.stat().st_size,'path':str(target)}
    (work/'result.json').write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf-8')
    print(json.dumps(result,ensure_ascii=False),flush=True)

parser=argparse.ArgumentParser(); parser.add_argument('slugs',nargs='+'); args=parser.parse_args()
for slug in args.slugs: build(slug)
