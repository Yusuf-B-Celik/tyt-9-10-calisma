# TYT 9–10 · Ders Çalışma Sitesi

9 ve 10. sınıf **TYT dersleri** için konu anlatımı, formüller, çözümlü örnek, gömülü video ve quiz.
Sıra müfredat sırasıdır: **oku → izle → test et → bitir**. İlerleme `localStorage`'da saklanır.

- Canlı site: https://yusuf-b-celik.github.io/tyt-9-10-calisma/
- İçerik: 134 konu · 17 ders · 2 sınıf (MEB Türkiye Yüzyılı Maarif Modeli 2025-2026)

## Çalıştırma
```bash
cd ~/Projects/tyt-9-10-calisma
python3 -m http.server 8080    # http://localhost:8080
```

## Yayınlama
**GitHub Pages:** `main` dalına push → `https://yusuf-b-celik.github.io/tyt-9-10-calisma/`
**Vercel:** `vercel --prod` (statik, build gerekmez; `vercel.json` hazır)

## Yapı
| Dosya | Görev |
| --- | --- |
| `index.html` | Uygulama kabuğu (üst bar / görünüm / alt navigasyon) |
| `styles.css` | Tasarım sistemi: açık-koyu tema, mobil app düzeni |
| `app.js` | Hash router, konu ekranı, quiz motoru, ilerleme takibi |
| `data/curriculum.json` | Sınıf → ders → ünite → konu ağacı (kaynak doğru) |
| `data/topics.json` | Konu içerikleri: özet, anlatım, formüller, örnek, ipucu, quiz |
| `data/topic_videos.json` | Her konu için seçilmiş video + yedekler + `embed` durumu |
| `scripts/fetch_topic_videos.py` | Konu başına en iyi videoyu bulur (kanal puanı, izlenme, süre) |
| `scripts/fix_embed.py` | Gömülemeyen videoları gömülebilir alternatifle değiştirir |
| `scripts/build_data.py` | `data/topics/*.json` dosyalarını birleştirir, eksikleri raporlar |

## İçerik ekleme / güncelleme
```bash
# 1) Konu içeriğini data/topics/<grup>.json içine ekle
#    anahtar formatı:  sinifId|dersId|uniteId|konu   (curriculum.json ile birebir)
# 2) Birleştir ve eksikleri gör
python3 scripts/build_data.py
```

Quiz şeması:
```json
{ "soru": "...", "siklar": ["A","B","C","D"], "cevap": 0, "aciklama": "çözüm" }
```

## Notlar
- Videolar telif nedeniyle kopyalanmaz, YouTube üzerinden gömülür.
- Gömülmeye kapalı videolar otomatik olarak link olarak gösterilir (`embed: false`).
- İlerleme cihaz bazlıdır; "İlerleme" sekmesinden panoya kopyalanabilir.
