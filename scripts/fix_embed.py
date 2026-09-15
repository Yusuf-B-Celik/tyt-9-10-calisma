#!/usr/bin/env python3
"""Gomulemeyen videolari (playable_in_embed=False) gomulebilir alternatiflerle degistirir."""
import json, re, subprocess, sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from fetch_topic_videos import ara, skorla  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent
HEDEF = ROOT / "data/topic_videos.json"

CACHE = {}


def gomulebilir(vid: str):
    """None: bilinmiyor, True/False: durum"""
    if vid in CACHE:
        return CACHE[vid]
    try:
        r = subprocess.run(
            ["yt-dlp", "--no-warnings", "--no-update", "--skip-download",
             "--print", "%(playable_in_embed)s", f"https://www.youtube.com/watch?v={vid}"],
            capture_output=True, text=True, timeout=90)
        s = r.stdout.strip().splitlines()[-1].strip() if r.stdout.strip() else ""
        durum = True if s == "True" else (False if s == "False" else None)
    except Exception:
        durum = None
    CACHE[vid] = durum
    return durum


def bilgi(vid: str):
    try:
        r = subprocess.run(
            ["yt-dlp", "--no-warnings", "--no-update", "--skip-download",
             "--print", "%(title)s\t%(channel)s\t%(duration_string)s\t%(view_count)s\t%(playable_in_embed)s",
             f"https://www.youtube.com/watch?v={vid}"],
            capture_output=True, text=True, timeout=90)
        p = r.stdout.strip().splitlines()[-1].split("\t")
        if len(p) >= 4:
            return {"baslik": p[0], "kanal": p[1], "sure": p[2],
                    "izlenme": int(p[3]) if p[3].isdigit() else 0,
                    "embed": p[4].strip() == "True" if len(p) > 4 else None}
    except Exception:
        pass
    return None


def main():
    v = json.load(open(HEDEF, encoding="utf-8"))
    degisen = 0
    kalan = []
    for i, (k, x) in enumerate(v.items(), 1):
        durum = gomulebilir(x["id"])
        parcalar = k.split("|")
        if durum is not False:
            x["embed"] = True
            continue
        # gomulemeyen: alternatifleri dene
        secim = None
        for a in x.get("alternatif", []):
            if gomulebilir(a["id"]) is True:
                b = bilgi(a["id"])
                if b and b["embed"]:
                    secim = {"id": a["id"], "baslik": b["baslik"], "kanal": b["kanal"],
                             "sure": b["sure"], "izlenme": b["izlenme"], "embed": True}
                break
        # olmadiysa yeni arama
        if not secim:
            parcalar = k.split("|")
            sorgu = f"{parcalar[0]}. sınıf {parcalar[1]} {parcalar[3]} konu anlatımı".replace("9-mat", "matematik")
            adaylar = ara(f"{parcalar[3]} konu anlatımı", n=8)
            adaylar = [a for a in adaylar if gomulebilir(a["id"]) is True]
            if adaylar:
                adaylar.sort(key=lambda a: skorla(parcalar[3], a), reverse=True)
                en = adaylar[0]
                secim = {"id": en["id"], "baslik": en["baslik"], "kanal": en["kanal"],
                         "sure": en["sure"], "izlenme": en["izlenme"], "embed": True}
        if secim:
            eski = x["id"]
            eski_alt = [{"id": x["id"], "baslik": x["baslik"], "kanal": x["kanal"], "sure": x["sure"]}]
            secim["alternatif"] = eski_alt + [a for a in x.get("alternatif", []) if a["id"] != secim["id"]][:2]
            v[k] = secim
            degisen += 1
            print(f"[{i}] DEGISTI {parcalar[3][:30]:30s} {eski} -> {secim['id']} ({secim['kanal']})", flush=True)
        else:
            x["embed"] = False
            x["not"] = "Bu video YouTube'da izlenir (gomulmeye kapali)"
            kalan.append(k)
            print(f"[{i}] KALDI  {k[:60]}", flush=True)

    json.dump(v, open(HEDEF, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print(f"\nBITTI: {degisen} video degistirildi, {len(kalan)} konu gomulemiyor")
    for k in kalan:
        print("  -", k)


if __name__ == "__main__":
    main()
