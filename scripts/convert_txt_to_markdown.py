#!/usr/bin/env python3
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]
EPISODES = {
    '2026-08-08-bank-money-creation': '商业银行为什么能创造货币？',
    '2026-08-09-clinical-trial-causality': '临床试验为什么能接近因果答案？',
    '2026-08-10-tcp-congestion-control': 'TCP拥塞控制为什么能让互联网不被自己压垮？',
    '2026-08-11-circadian-rhythm': '昼夜节律如何控制睡眠、激素与代谢？',
    '2026-08-12-containerization': '标准集装箱如何重塑全球贸易？',
    '2026-08-13-grid-supply-demand-balance': '电网为什么必须时刻保持供需平衡？',
}

DROP_PREFIXES = ('《世界运行原理·每日一课》', '世界运行原理·每日一课：', '标题：')
DROP_EXACT = {'标题', '今天的问题', '一、今天的问题', '先给结论', '二、先给结论'}
HEADING_EXACT = {'概念背景', '系统组成', '底层原理', '分步骤运行过程', '真实案例', '常见误解与争议', '常见误解/争议', '普通人意义', '要点总结', '3个延伸思考问题'}


def is_heading(line: str) -> bool:
    if line in HEADING_EXACT or line.startswith('来源与检索日期'):
        return True
    return bool(re.match(r'^[一二三四五六七八九十]+[、，.]', line)) and len(line) < 42


def convert(slug: str, title: str) -> None:
    source = ROOT / 'public/episodes' / f'{slug}.txt'
    lines = source.read_text(encoding='utf-8').splitlines()
    while lines and not lines[0].strip():
        lines.pop(0)
    cleaned = []
    skipping_title = True
    for raw in lines:
        line = raw.strip()
        if skipping_title:
            if not line or line in DROP_EXACT or line.startswith(DROP_PREFIXES) or line == title or (len(line) < 80 and title.rstrip('？') in line):
                continue
            skipping_title = False
        if line in DROP_EXACT:
            continue
        if not line:
            if cleaned and cleaned[-1] != '':
                cleaned.append('')
            continue
        if is_heading(line):
            normalized = re.sub(r'^[一二三四五六七八九十]+[、，.]\s*', '', line)
            if normalized.startswith('来源与检索日期'):
                cleaned.extend(['---', '', '## 来源与检索日期（2026-08-13）'])
            else:
                cleaned.append(f'## {normalized}')
        else:
            cleaned.append(line)
    body = '\n'.join(cleaned).strip()
    markdown = f'# {title}\n\n{body}\n'
    target = ROOT / 'public/episodes' / f'{slug}.md'
    target.write_text(markdown, encoding='utf-8')
    print(slug, len(markdown), target)


for slug, title in EPISODES.items():
    convert(slug, title)
