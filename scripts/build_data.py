#!/usr/bin/env python3
"""data/topics/*.json dosyalarini birlestirir, mufredatla karsilastirir, eksikleri raporlar."""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "data"
HEDEF = DATA / "topics.json"


def anahtarlar():
    cur = json.load(open(DATA / "curriculum.json", encoding="utf-8"))
    beklenen = {}
    for s in cur["siniflar"]:
        for d in s["dersler"]:
            beklenen.setdefault(d["id"], set())
            for u in d["uniteler"]:
                for k in u["konular"]:
                    beklenen[d["id"]].add(f"{s['id']}|{d['id']}|{u['id']}|{k}")
    return beklenen


def main():
    beklenen = anahtarlar()
    birlesik, kaynaklar = {}, {}
    for f in sorted((DATA / "topics").glob("*.json")):
        try:
            icerik = json.load(open(f, encoding="utf-8"))
        except Exception as e:
            print(f"HATA {f.name}: {e}")
            continue
        for ders_id, konular in icerik.items():
            birlesik.setdefault(ders_id, {})
            for k, v in konular.items():
                if k in birlesik[ders_id]:
                    print(f"CAKISMA {k} ({f.name})")
                birlesik[ders_id][k] = v
                kaynaklar[k] = f.name

    json.dump(birlesik, open(HEDEF, "w", encoding="utf-8"), ensure_ascii=False, indent=1)

    toplam = eksik = 0
    quizzesiz = []
    print(f"\n{'DERS':10s} {'BEKLENEN':>9s} {'VAR':>5s} {'SORU':>6s}")
    for ders_id, ks in beklenen.items():
        var = sum(1 for k in ks if k in birlesik.get(ders_id, {}))
        soru = sum(len(birlesik.get(ders_id, {}).get(k, {}).get("quiz", [])) for k in ks)
        toplam += len(ks)
        eksik += len(ks) - var
        print(f"{ders_id:10s} {len(ks):>9d} {var:>5d} {soru:>6d}")
        for k in ks:
            ic = birlesik.get(ders_id, {}).get(k)
            if not ic or not ic.get("quiz"):
                quizzesiz.append(k)

    print(f"\nTOPLAM konu: {toplam} | eksik: {eksik} | quizsiz: {len(quizzesiz)}")
    if quizzesiz:
        print("Quizsiz konular:")
        for k in quizzesiz[:20]:
            print("  -", k)
    print(f"Yazildi: {HEDEF}")


if __name__ == "__main__":
    main()
