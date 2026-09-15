#!/usr/bin/env python3
"""Icerik dogrulama: her konu tam mi, quiz tutarli mi, video eslesmesi var mi."""
import json
import os
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
t = json.load(open(ROOT / "data/topics.json", encoding="utf-8"))
v = json.load(open(ROOT / "data/topic_videos.json", encoding="utf-8"))
cur = json.load(open(ROOT / "data/curriculum.json", encoding="utf-8"))

beklenen = set()
for s in cur["siniflar"]:
    for d in s["dersler"]:
        for u in d["uniteler"]:
            for k in u["konular"]:
                beklenen.add(f"{s['id']}|{d['id']}|{u['id']}|{k}")

sorun = []
for ders, konular in t.items():
    for k, x in konular.items():
        q = x.get("quiz") or []
        if len(q) != 5:
            sorun.append((k, f"quiz={len(q)}"))
        if len(x.get("anlatim") or []) < 7:
            sorun.append((k, f"anlatim={len(x.get('anlatim') or [])}"))
        for i, s in enumerate(q):
            if len(s.get("siklar", [])) != 4:
                sorun.append((k, f"s{i} sik sayisi"))
                continue
            if len(set(s["siklar"])) != 4:
                sorun.append((k, f"s{i} tekrar eden sik"))
            if not (0 <= s.get("cevap", -1) < 4):
                sorun.append((k, f"s{i} cevap indeksi"))
            if not s.get("aciklama"):
                sorun.append((k, f"s{i} aciklama yok"))
        for alan in ("ozet", "ornek", "ipucu"):
            if not x.get(alan):
                sorun.append((k, f"{alan} yok"))

icerik_anahtarlari = {k for c in t.values() for k in c}
video_anahtarlari = set(v.keys())

print(f"Konu sayisi          : {sum(len(c) for c in t.values())}")
print(f"Soru sayisi          : {sum(len(x.get('quiz') or []) for c in t.values() for x in c.values())}")
print(f"Video sayisi         : {len(v)}")
print(f"Gomulemeyen video    : {sum(1 for x in v.values() if x.get('embed') is False)}")
print(f"Yapisal sorun        : {len(sorun)}")
print(f"Eksik konu           : {len(beklenen - icerik_anahtarlari)}")
print(f"Fazla/uyumsuz anahtar: {len(icerik_anahtarlari - beklenen)}")
print(f"Videosuz konu        : {len(beklenen - video_anahtarlari)}")
print(f"topics.json boyutu   : {round(os.path.getsize(ROOT / 'data/topics.json') / 1024)} KB")
for s in sorun[:20]:
    print("  !", s[0][:60], s[1])
for k in list(beklenen - icerik_anahtarlari)[:10]:
    print("  - eksik:", k)
