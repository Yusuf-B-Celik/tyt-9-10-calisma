# TYT 9-10 Çalışma

Mobil öncelikli, Vercel uyumlu statik çalışma uygulaması.
Sıra: not → video → quiz. İlerleme `localStorage`'da saklanır.

## Çalıştırma
```bash
cd ~/Projects/tyt-9-10-calisma
python3 -m http.server 8080
# http://localhost:8080
```

## Vercel deploy (2 yol)
**A - Klasörden (önerilen):**
```bash
cd ~/Projects/tyt-9-10-calisma
vercel --prod
```

**B - GitHub ile:**
1. Bu klasörü GitHub'a push et
2. Vercel → New Project → repo seç → Framework: Other, Build: boş, Output: `.` → Deploy

`vercel.json` statik sunum içindir, build gerekmez.

## Yapı
- `index.html` — iskelet
- `styles.css` — mobil öncelikli koyu tema
- `app.js` — sınıf/ders/ünite/konu + sekme + quiz motoru
- `data/curriculum.json` — 9+10 TYT müfredat sırası
- `data/resources.json` — MEB + kanal seçkisi
- `data/quizzes.json` — örnek quizler (genişletilebilir)

## İçerik ekleme
Yeni konu: `curriculum.json`'a ünite/konu ekle.
Yeni quiz: `quizzes.json`'da anahtar `sinif|ders|unite|konu` olmalı.
