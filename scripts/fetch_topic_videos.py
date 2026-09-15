#!/usr/bin/env python3
"""Her konu icin en iyi YouTube videosunu bulur (izlenme + baslik uyumu + sure filtreli)."""
import json, re, subprocess, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CUR = json.load(open(ROOT / "data/curriculum.json", encoding="utf-8"))

# Guvenilir kanallar (Maarif uyumlu / TYT'de kanitlanmis)
IYI_KANAL = {
    "tonguç": 3, "tonguc": 3, "rehber matematik": 3, "mert hoca": 3, "partikül": 3,
    "hocalara geldik": 3, "benim hocam": 3, "görkem şahin": 3, "zeliha yücel": 3,
    "fizikfinito": 2, "altuğ güneş": 2, "şenol hoca": 2, "şenol": 2, "nesibe aydın": 2,
    "bıyıklı matematik": 2, "hocalara geldik 9": 3, "eokultv": 2, "ders:": 1,
    "kanal": 1, "matbook": 2, "olarak": 1, "sinif": 1, "sınıf": 1,
    "paraksilen": 3, "kimya adası": 2, "biyoloji": 1, "türkçe": 1,
    "hız yayınları": 2, "final yayınları": 1, "kafa dengi": 1,
}


def kanal_puani(kanal: str) -> int:
    k = (kanal or "").lower()
    en = 0
    for ad, p in IYI_KANAL.items():
        if ad in k:
            en = max(en, p)
    return en


def sure_saniye(s: str) -> int:
    if not s:
        return 0
    p = [int(x) for x in re.findall(r"\d+", s)]
    if len(p) == 3:
        return p[0] * 3600 + p[1] * 60 + p[2]
    if len(p) == 2:
        return p[0] * 60 + p[1]
    return p[0] if p else 0


def ara(sorgu: str, n: int = 6):
    cmd = [
        "yt-dlp", f"ytsearch{n}:{sorgu}",
        "--print", "%(id)s\t%(title)s\t%(channel)s\t%(duration_string)s\t%(view_count)s",
        "--no-download", "--flat-playlist", "--no-update", "--no-warnings",
    ]
    try:
        r = subprocess.run(cmd, capture_output=True, text=True, timeout=90)
    except subprocess.TimeoutExpired:
        return []
    out = []
    for line in r.stdout.splitlines():
        parts = line.split("\t")
        if len(parts) < 4:
            continue
        vid, bas, kan, sur = parts[0].strip(), parts[1].strip(), parts[2].strip(), parts[3].strip()
        iz = parts[4].strip() if len(parts) > 4 else ""
        if not re.fullmatch(r"[A-Za-z0-9_-]{11}", vid):
            continue
        izn = int(iz) if iz.isdigit() else 0
        out.append({"id": vid, "baslik": bas, "kanal": kan, "sure": sur,
                    "sureSn": sure_saniye(sur), "izlenme": izn})
    return out


def skorla(kon: str, aday: dict) -> float:
    puan = kanal_puani(aday["kanal"]) * 100.0
    puan += min(aday["izlenme"] / 1000.0, 300)          # izlenme etkisi (ust sinir)
    s = aday["sureSn"]
    if 300 <= s <= 5400:                                 # 5 dk - 90 dk ideal
        puan += 50
    elif s > 5400:                                       # cok uzun: canli yayin/tek video
        puan -= 25
    elif s < 180:
        puan -= 40                                       # shorts/klip
    bas = aday["baslik"].lower()
    for kw in kon.lower().split():
        if len(kw) > 3 and kw in bas:
            puan += 12
    if any(x in bas for x in ("shorts", "#shorts", "1 dakika", "kısa")):
        puan -= 30
    if "soru çözüm" in bas or "soru bankası" in bas:
        puan -= 10
    if "yazılı" in bas or "sınav" in bas and "konu anlatım" not in bas:
        puan -= 15
    return puan


def main():
    sonuc = {}
    genel = 0
    for s in CUR["siniflar"]:
        for d in s["dersler"]:
            for u in d["uniteler"]:
                for konu in u["konular"]:
                    genel += 1
                    anahtar = f"{s['id']}|{d['id']}|{u['id']}|{konu}"
                    sorgu = f"{s['ad'][0:2].strip('.')} sınıf {d['ad']} {konu} konu anlatımı"
                    adaylar = ara(sorgu)
                    if not adaylar:
                        sorgu2 = f"{d['ad']} {konu} konu anlatımı"
                        adaylar = ara(sorgu2)
                    if not adaylar:
                        continue
                    adaylar.sort(key=lambda a: skorla(konu, a), reverse=True)
                    en = adaylar[0]
                    sonuc[anahtar] = {
                        "id": en["id"], "baslik": en["baslik"], "kanal": en["kanal"],
                        "sure": en["sure"], "izlenme": en["izlenme"],
                        "alternatif": [{"id": a["id"], "baslik": a["baslik"], "kanal": a["kanal"], "sure": a["sure"]} for a in adaylar[1:3]],
                    }
                    print(f"[{genel}] {d['ad'][:12]:12s} | {konu[:38]:38s} -> {en['kanal'][:22]:22s} {en['sure']}", flush=True)
    json.dump(sonuc, open(ROOT / "data/topic_videos.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print(f"BITTI: {len(sonuc)}/{genel} konu icin video bulundu")


if __name__ == "__main__":
    main()
