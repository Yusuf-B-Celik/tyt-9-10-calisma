/* ============================================================
   TYT 9–10 · Uygulama mantığı
   ============================================================ */

const ANAHTAR = "tyt910-v3";
const VERI = { mufredat: null, konular: {}, videolar: {}, hazir: false };

const RENK = {
  mat: "#6ea8fe", fiz: "#a78bfa", kim: "#34d399", biy: "#f472b6",
  tde: "#fbbf24", tar: "#fb923c", cog: "#38bdf8", din: "#4ade80", fel: "#c084fc",
};
const IKON = {
  mat: "📐", fiz: "🧲", kim: "⚗️", biy: "🧬",
  tde: "📖", tar: "🏛️", cog: "🗺️", din: "🕌", fel: "🤔",
};

const el = (id) => document.getElementById(id);

/* ---------- yardımcılar ---------- */
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

/**
 * Metindeki matematik yazimini uslu/altli hale getirir.
 * "2^5" -> 2<sup>5</sup>, "x^10" -> x<sup>10</sup>, "a^(-n)" -> a<sup>-n</sup>,
 * "H_2O" -> H<sub>2</sub>O, "10^6" vb.
 */
function matYaz(metin) {
  return esc(metin)
    .replace(/\^\(([^)]{1,14})\)/g, "<sup>$1</sup>")
    .replace(/\^\{([^}]{1,14})\}/g, "<sup>$1</sup>")
    .replace(/\^([A-Za-z0-9+\-]{1,6})/g, "<sup>$1</sup>")
    .replace(/([A-Za-zçğıöşü])_([0-9]{1,3})\b/g, "$1<sub>$2</sub>");
}

/** icerik alanlarini matematik gosterimiyle basar */
const mat = (s) => matYaz(s);

/* ---------- ikonlar (SVG) ---------- */
const SVG = {
  ev: '<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/>',
  kitap: '<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5z"/><path d="M4 20.5A2.5 2.5 0 0 1 6.5 18H20v3H6.5A2.5 2.5 0 0 1 4 20.5z"/>',
  grafik: '<path d="M4 20V4"/><path d="M4 20h16"/><path d="M8 17v-5"/><path d="M13 17V8"/><path d="M18 17v-8"/>',
  ara: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>',
  gunes: '<circle cx="12" cy="12" r="4.2"/><path d="M12 2v2.4M12 19.6V22M2 12h2.4M19.6 12H22M4.9 4.9l1.7 1.7M17.4 17.4l1.7 1.7M19.1 4.9l-1.7 1.7M6.6 17.4l-1.7 1.7"/>',
  ay: '<path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5z"/>',
  geri: '<path d="M15 5l-7 7 7 7"/>',
  ileri: '<path d="M9 5l7 7-7 7"/>',
  saat: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
  oynat: '<path d="M6.5 4.8v14.4L19 12z"/>',
  onay: '<path d="M20 6.5 9.5 17 4 11.5"/>',
};
const ikon = (ad, boy = 19, kalinlik = 1.9) =>
  `<svg viewBox="0 0 24 24" width="${boy}" height="${boy}" fill="none" stroke="currentColor" stroke-width="${kalinlik}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${SVG[ad]}</svg>`;

const dersKod = (id) => (id.split("-")[1] || "genel");
const dersRenk = (id) => RENK[dersKod(id)] || "#6ea8fe";
const dersIkon = (id) => IKON[dersKod(id)] || "📚";
const anahtar = (s, d, u, k) => `${s}|${d}|${u}|${k}`;

function ilerleme() {
  try { return JSON.parse(localStorage.getItem(ANAHTAR) || "{}"); } catch { return {}; }
}
function ilerlemeYaz(o) { try { localStorage.setItem(ANAHTAR, JSON.stringify(o)); } catch {} }

let TOAST_ZAMAN = null;
function toast(mesaj) {
  const t = el("toast");
  t.textContent = mesaj;
  t.classList.add("goster");
  clearTimeout(TOAST_ZAMAN);
  TOAST_ZAMAN = setTimeout(() => t.classList.remove("goster"), 2100);
}

/* ---------- veri ---------- */
async function veriYukle() {
  const yol = "data/";
  const [mufredat, konular, videolar] = await Promise.all([
    fetch(yol + "curriculum.json").then((r) => r.json()),
    fetch(yol + "topics.json").then((r) => r.json()).catch(() => ({})),
    fetch(yol + "topic_videos.json").then((r) => r.json()).catch(() => ({})),
  ]);
  VERI.mufredat = mufredat;
  VERI.konular = konular;
  VERI.videolar = videolar;
  VERI.hazir = true;
}

function dersBul(dersId) {
  for (const s of VERI.mufredat.siniflar)
    for (const d of s.dersler)
      if (d.id === dersId) return { sinif: s, ders: d };
  return null;
}
function konuListesi(dersId) {
  const b = dersBul(dersId);
  if (!b) return [];
  const liste = [];
  b.ders.uniteler.forEach((u) => {
    u.konular.forEach((k, i) =>
      liste.push({ sinifId: b.sinif.id, dersId, uniteId: u.id, uniteAd: u.ad, konu: k, sira: i })
    );
  });
  return liste;
}
function icerik(sinifId, dersId, uniteId, konu) {
  const d = VERI.konular[dersId];
  return (d && d[anahtar(sinifId, dersId, uniteId, konu)]) || null;
}
function video(sinifId, dersId, uniteId, konu) {
  return VERI.videolar[anahtar(sinifId, dersId, uniteId, konu)] || null;
}
function dersIlerleme(dersId) {
  const p = ilerleme();
  const liste = konuListesi(dersId);
  const biten = liste.filter((x) => p[anahtar(x.sinifId, x.dersId, x.uniteId, x.konu)]).length;
  return { biten, toplam: liste.length, yuzde: liste.length ? Math.round((biten / liste.length) * 100) : 0 };
}
function toplamIlerleme(sinifId) {
  const s = VERI.mufredat.siniflar.find((x) => x.id === sinifId);
  let biten = 0, toplam = 0;
  s.dersler.forEach((d) => { const r = dersIlerleme(d.id); biten += r.biten; toplam += r.toplam; });
  return { biten, toplam, yuzde: toplam ? Math.round((biten / toplam) * 100) : 0 };
}
function devamKonusu(sinifId) {
  const s = VERI.mufredat.siniflar.find((x) => x.id === sinifId);
  const p = ilerleme();
  for (const d of s.dersler)
    for (const x of konuListesi(d.id))
      if (!p[anahtar(x.sinifId, x.dersId, x.uniteId, x.konu)]) return x;
  return null;
}

/* ---------- tema ---------- */
function temaAyarla(t) {
  document.documentElement.setAttribute("data-tema", t);
  try { localStorage.setItem(ANAHTAR + "-tema", t); } catch {}
  const b = el("temaBtn");
  if (b) b.textContent = t === "koyu" ? "☀️" : "🌙";
}
function temaDegistir() {
  const suan = document.documentElement.getAttribute("data-tema");
  temaAyarla(suan === "koyu" ? "acik" : "koyu");
}

/* ---------- üst bar / alt bar ---------- */
function ustbarCiz(geri, baslik, altYazi) {
  const bar = el("ustbar");
  const temaAd = document.documentElement.getAttribute("data-tema") === "koyu" ? "gunes" : "ay";
  if (geri) {
    bar.innerHTML = `
      <button class="ikon-btn geri-btn" id="geriBtn" title="Geri">${ikon("geri", 17, 2.1)}<span>Geri</span></button>
      <div style="flex:1;min-width:0;overflow:hidden">
        <div class="marka-ad" style="font-size:14.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(baslik || "")}</div>
        ${altYazi ? `<div class="marka-alt" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(altYazi)}</div>` : ""}
      </div>
      <div class="ustbar-sag"><button class="ikon-btn" id="temaBtn" title="Tema">${ikon(temaAd)}</button></div>`;
    el("geriBtn").onclick = () => { if (history.length > 1) history.back(); else location.hash = "#/"; };
  } else {
    bar.innerHTML = `
      <div class="marka">
        <div class="marka-logo">📚</div>
        <div style="min-width:0">
          <div class="marka-ad">TYT 9–10</div>
          <div class="marka-alt">Konu anlatımı · video · quiz</div>
        </div>
      </div>
      <div class="ustbar-sag">
        <button class="ikon-btn" id="araBtn" title="Ara">${ikon("ara")}</button>
        <button class="ikon-btn" id="temaBtn" title="Tema">${ikon(temaAd)}</button>
      </div>`;
    el("araBtn").onclick = () => (location.hash = "#/ara");
  }
  el("temaBtn").onclick = temaDegistir;
}

function altbarCiz(aktif) {
  const ogeler = [
    { id: "ana", ik: "ev", ad: "Ana Sayfa", hash: "#/" },
    { id: "dersler", ik: "kitap", ad: "Dersler", hash: "#/dersler" },
    { id: "ilerleme", ik: "grafik", ad: "İlerleme", hash: "#/ilerleme" },
  ];
  el("altbar").innerHTML = ogeler
    .map((o) => `<button data-git="${o.hash}" class="${aktif === o.id ? "aktif" : ""}"><span class="gl">${ikon(o.ik, 21, 1.8)}</span>${o.ad}</button>`)
    .join("");
  el("altbar").querySelectorAll("button").forEach((b) => (b.onclick = () => (location.hash = b.dataset.git)));
}

function ilerlemeSerit(yuzde) {
  let s = document.querySelector(".ilerleme-serit");
  if (!s) { s = document.createElement("div"); s.className = "ilerleme-serit"; document.body.appendChild(s); }
  s.style.width = yuzde + "%";
}

function dersKartiOlustur(d) {
  const r = dersIlerleme(d.id);
  const kart = document.createElement("button");
  kart.className = "ders-kart";
  kart.style.setProperty("--ders-renk", dersRenk(d.id));
  kart.innerHTML = `
    <div class="ders-kart-ust">
      <div class="ders-ikon">${dersIkon(d.id)}</div>
      <div style="min-width:0">
        <div class="ders-ad">${esc(d.ad)}</div>
        <div class="ders-meta">${d.uniteler.length} ünite · ${r.toplam} konu</div>
      </div>
    </div>
    <div class="cubuk"><i style="width:${r.yuzde}%"></i></div>
    <div class="cubuk-bilgi">
      <span>${r.biten}/${r.toplam} konu</span>
      <span>${r.yuzde === 100 ? "✅ Tamam" : r.yuzde > 0 ? "devam ediyor" : "başlanmadı"}</span>
    </div>`;
  kart.onclick = () => (location.hash = `#/ders/${d.id}`);
  return kart;
}

/* ---------- ana sayfa ---------- */
function anaCiz() {
  const sinifId = seciliSinif();
  const sinif = VERI.mufredat.siniflar.find((x) => x.id === sinifId);
  const t = toplamIlerleme(sinifId);
  const devam = devamKonusu(sinifId);
  ilerlemeSerit(t.yuzde);
  ustbarCiz(false);
  altbarCiz("ana");

  el("gorunum").innerHTML = `
    <section class="hero">
      <h1>Bugün ne çalışıyoruz?</h1>
      <p>${esc(VERI.mufredat.meta.program)} müfredatına göre sıralı konu anlatımı, formüller, çözümlü örnek, video ve quiz. İlerlemen bu cihazda saklanır.</p>
      <div class="segmente" id="sinifSec">
        ${VERI.mufredat.siniflar.map((s) => `<button data-s="${s.id}" class="${s.id === sinifId ? "aktif" : ""}">${s.ad}</button>`).join("")}
      </div>
      ${devam
        ? `<button class="btn btn-birincil btn-tam" id="devamBtn">▶ ${esc(devam.konu)} konusuna devam et</button>`
        : `<div class="rozet" style="padding:8px 14px">🎉 ${esc(sinif.ad)} tamamlandı!</div>`}
      <div class="hero-istat">
        <div><span>Bitirilen konu</span><b>${t.biten}<small style="font-size:14px;color:var(--soluk)">/${t.toplam}</small></b></div>
        <div><span>Genel ilerleme</span><b>${t.yuzde}%</b></div>
        <div><span>Ders</span><b>${sinif.dersler.length}</b></div>
      </div>
    </section>

    <div class="kart-baslik" style="margin:18px 4px 12px"><span class="em">📘</span> Dersler</div>
    <div class="ders-grid" id="dersGrid"></div>`;

  el("sinifSec").querySelectorAll("button").forEach((b) => (b.onclick = () => {
    try { localStorage.setItem(ANAHTAR + "-sinif", b.dataset.s); } catch {}
    anaCiz();
  }));
  if (devam) el("devamBtn").onclick = () => konuGit(devam);

  const grid = el("dersGrid");
  sinif.dersler.forEach((d) => grid.appendChild(dersKartiOlustur(d)));
}

function seciliSinif() {
  try { return localStorage.getItem(ANAHTAR + "-sinif") || "9"; } catch { return "9"; }
}

/* ---------- ders ekranı ---------- */
function dersCiz(dersId) {
  const b = dersBul(dersId);
  if (!b) return anaGit();
  const r = dersIlerleme(dersId);
  const p = ilerleme();
  ustbarCiz(true, b.ders.ad, `${b.sinif.ad} · ${r.biten}/${r.toplam} konu`);
  altbarCiz("dersler");
  ilerlemeSerit(r.yuzde);

  el("gorunum").innerHTML = `
    <div class="hero" style="--ders-renk:${dersRenk(dersId)}">
      <div class="ders-kart-ust" style="margin-bottom:10px">
        <div class="ders-ikon" style="--ders-renk:${dersRenk(dersId)};width:52px;height:52px;font-size:26px">${dersIkon(dersId)}</div>
        <div>
          <h1 style="font-size:21px;margin:0">${esc(b.ders.ad)}</h1>
          <div class="ders-meta">${esc(b.sinif.ad)} · ${b.ders.uniteler.length} ünite · ${r.toplam} konu</div>
        </div>
      </div>
      <div class="cubuk"><i style="width:${r.yuzde}%"></i></div>
      <div class="cubuk-bilgi" style="margin-top:7px"><span>${r.biten} konu bitirildi</span><span>${r.yuzde}%</span></div>
    </div>
    <div id="uniteListe"></div>`;

  const kap = el("uniteListe");
  b.ders.uniteler.forEach((u, i) => {
    const konular = u.konular;
    const biten = konular.filter((k) => p[anahtar(b.sinif.id, dersId, u.id, k)]).length;
    const blok = document.createElement("div");
    blok.className = "unite-blok" + (i === 0 || (biten > 0 && biten < konular.length) ? " acik" : "");
    blok.innerHTML = `
      <button class="unite-ust">
        <span class="unite-no">${i + 1}</span>
        <span class="unite-ad">${esc(u.ad)}</span>
        <span class="unite-sayi">${biten}/${konular.length}</span>
        <span class="ok">▶</span>
      </button>
      <div class="konular">
        ${konular.map((k, j) => {
          const tam = p[anahtar(b.sinif.id, dersId, u.id, k)];
          return `<button class="konu-satir ${tam ? "tamam" : ""}" data-i="${j}">
            <span class="isaret">✓</span><span class="konu-ad">${esc(k)}</span>
          </button>`;
        }).join("")}
      </div>`;
    blok.querySelector(".unite-ust").onclick = () => blok.classList.toggle("acik");
    blok.querySelectorAll(".konu-satir").forEach((s) => (s.onclick = () => {
      location.hash = `#/konu/${dersId}/${u.id}/${s.dataset.i}`;
    }));
    kap.appendChild(blok);
  });
}

/* ---------- konu ekranı ---------- */
function konuCiz(dersId, uniteId, sira) {
  const b = dersBul(dersId);
  if (!b) return anaGit();
  const unite = b.ders.uniteler.find((u) => u.id === uniteId);
  if (!unite) return anaGit();
  const konuAd = unite.konular[Number(sira)];
  if (!konuAd) return anaGit();

  const liste = konuListesi(dersId);
  const indeks = liste.findIndex((x) => x.uniteId === uniteId && x.sira === Number(sira));
  const ic = icerik(b.sinif.id, dersId, uniteId, konuAd);
  const vd = video(b.sinif.id, dersId, uniteId, konuAd);
  const k = anahtar(b.sinif.id, dersId, uniteId, konuAd);
  const tamam = !!ilerleme()[k];

  ustbarCiz(true, konuAd, `${b.ders.ad} · ${unite.ad}`);
  altbarCiz("");
  ilerlemeSerit(dersIlerleme(dersId).yuzde);

  el("gorunum").innerHTML = `
    <div class="konu-ust">
      <div class="kirinti">
        ${esc(b.ders.ad)} <span>${ikon("ileri", 12, 2.4)}</span> ${esc(unite.ad)}
      </div>
      <h1 class="konu-baslik">${esc(konuAd)}</h1>
      <div class="konu-etiket">
        <span class="sure-rozet">${ikon("saat", 14, 2)} ~20 dk</span>
        ${vd ? `<span class="sure-rozet">${ikon("oynat", 13, 2)} ${esc(vd.kanal)}</span>` : ""}
        ${tamam ? `<span class="sure-rozet tamam">${ikon("onay", 14, 2.4)} Bitirildi</span>` : ""}
      </div>
    </div>

    <div class="konu-izgara">
      <div class="konu-ana">
      ${ic ? `
        <section class="kart">
          <h2 class="kart-baslik"><span class="em">💡</span> Kısaca</h2>
          <p class="kutu-ozet" style="margin:0">${mat(ic.ozet)}</p>
        </section>

        <section class="kart">
          <h2 class="kart-baslik"><span class="em">📝</span> Konu anlatımı</h2>
          <ol class="anlatim">${(ic.anlatim || []).map((m) => `<li>${mat(m)}</li>`).join("")}</ol>
        </section>

        ${(ic.formuller || []).length ? `
        <section class="kart">
          <h2 class="kart-baslik"><span class="em">🧠</span> Ezberlenecekler</h2>
          <div class="formul-kutu"><ul>${ic.formuller.map((f) => `<li>${mat(f)}</li>`).join("")}</ul></div>
        </section>` : ""}

        ${ic.ornek ? `
        <section class="kart">
          <h2 class="kart-baslik"><span class="em">✏️</span> Çözümlü örnek</h2>
          <div class="ornek-kutu">${mat(ic.ornek)}</div>
        </section>` : ""}

        ${ic.ipucu ? `
        <section class="kart">
          <h2 class="kart-baslik"><span class="em">🎯</span> TYT ipucu</h2>
          <div class="ipucu-kutu">${mat(ic.ipucu)}</div>
        </section>` : ""}
      ` : `
        <section class="kart"><div class="bos"><span class="em">🚧</span>Bu konunun anlatımı hazırlanıyor.<br>Videoyu izleyip testi çözebilirsin.</div></section>
      `}

      ${vd ? `
        <section class="kart">
          <h2 class="kart-baslik"><span class="em">🎬</span> Konu videosu</h2>
          ${vd.embed === false ? `
          <div class="bos" style="padding:22px">
            <span class="em">🔗</span>
            Bu videonun sahibi siteye gömülmesine izin vermiyor.<br>
            YouTube'da açıp izleyebilirsin.
          </div>` : `
          <div class="video-sar">
            <iframe src="https://www.youtube.com/embed/${esc(vd.id)}?rel=0" title="${esc(vd.baslik)}"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              referrerpolicy="strict-origin-when-cross-origin" allowfullscreen loading="lazy"></iframe>
          </div>`}
          <div class="video-bilgi"><b>${esc((vd.baslik || "").slice(0, 80))}</b> · ${esc(vd.kanal)}${vd.sure ? " · " + esc(vd.sure) : ""}</div>
          <div class="alt-video">
            <a href="https://www.youtube.com/watch?v=${esc(vd.id)}" target="_blank" rel="noopener">▶ YouTube'da aç</a>
            ${(vd.alternatif || []).map((a) => `<a href="https://www.youtube.com/watch?v=${esc(a.id)}" target="_blank" rel="noopener">▶ ${esc(a.kanal)}${a.sure ? " · " + esc(a.sure) : ""}</a>`).join("")}
          </div>
        </section>` : ""}
      </div>

      <aside class="konu-yan">
        ${(ic && ic.quiz && ic.quiz.length) ? `
          <section class="kart">
            <h2 class="kart-baslik"><span class="em">🧪</span> Test · ${ic.quiz.length} soru</h2>
            <div id="quizAlan"></div>
          </section>` : ""}

        <div class="bitir-kutu ${tamam ? "on" : ""}" id="bitirKutu" role="button" tabindex="0">
          <span class="onay">✓</span>
          <div>
            <div style="font-weight:700">${tamam ? "Bitirildi olarak işaretli" : "Konuyu bitirdim"}</div>
            <div style="font-size:12.5px;color:var(--soluk)">İlerlemene ekle</div>
          </div>
        </div>

        <div class="btn-satir konu-gezinti">
          ${indeks > 0 ? `<button class="btn" id="oncekiBtn">${ikon("geri", 16, 2.2)} Önceki</button>` : ""}
          ${indeks < liste.length - 1 ? `<button class="btn btn-birincil" id="sonrakiBtn">Sonraki konu ${ikon("ileri", 16, 2.2)}</button>` : ""}
        </div>
      </aside>
    </div>`;

  if (ic && ic.quiz && ic.quiz.length) quizBaslat(ic.quiz, k, dersId, uniteId, sira);

  el("bitirKutu").onclick = () => {
    const p = ilerleme();
    if (p[k]) { delete p[k]; toast("İşaret kaldırıldı"); }
    else { p[k] = Date.now(); toast("Konu bitirildi 🎉"); }
    ilerlemeYaz(p);
    konuCiz(dersId, uniteId, sira);
  };
  if (indeks > 0) el("oncekiBtn").onclick = () => {
    const o = liste[indeks - 1];
    location.hash = `#/konu/${dersId}/${o.uniteId}/${o.sira}`;
  };
  if (indeks < liste.length - 1) el("sonrakiBtn").onclick = () => {
    const o = liste[indeks + 1];
    location.hash = `#/konu/${dersId}/${o.uniteId}/${o.sira}`;
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
}

/* ---------- quiz motoru ---------- */
function quizBaslat(sorular, konuAnahtari, dersId, uniteId, sira) {
  const alan = el("quizAlan");
  let i = 0, dogru = 0, cevaplandi = false;

  function ciz() {
    const s = sorular[i];
    const yuzde = Math.round((i / sorular.length) * 100);
    alan.innerHTML = `
      <div class="quiz-ust">
        <span class="quiz-sayac">Soru <b>${i + 1}</b> / ${sorular.length}</span>
        <span class="quiz-sayac" id="quizDogru">${dogru} doğru · ${i - dogru} yanlış</span>
      </div>
      <div class="cubuk kalin" style="margin-bottom:14px"><i style="width:${yuzde}%"></i></div>
      <p class="quiz-soru">${mat(s.soru)}</p>
      <div id="sikAlan"></div>`;
    const kap = el("sikAlan");
    const harfler = ["A", "B", "C", "D", "E"];
    s.siklar.forEach((sk, j) => {
      const btn = document.createElement("button");
      btn.className = "sik";
      btn.innerHTML = `<span class="harf">${harfler[j]}</span><span>${mat(sk)}</span>`;
      btn.onclick = () => sec(j, btn);
      kap.appendChild(btn);
    });
  }

  function sec(j, btn) {
    if (cevaplandi) return;
    cevaplandi = true;
    const s = sorular[i];
    const tumu = alan.querySelectorAll(".sik");
    tumu.forEach((x) => x.classList.add("kilit"));
    if (j === s.cevap) { btn.classList.add("dogru"); dogru++; }
    else { btn.classList.add("yanlis"); if (tumu[s.cevap]) tumu[s.cevap].classList.add("dogru"); }
    const sayac = el("quizDogru");
    if (sayac) sayac.innerHTML = `${dogru} doğru · ${i + 1 - dogru} yanlış`;
    const ac = document.createElement("div");
    ac.className = "aciklama " + (j === s.cevap ? "dogru" : "yanlis");
    ac.innerHTML = `<b>${j === s.cevap ? "Doğru!" : "Doğru cevap: " + mat(s.siklar[s.cevap])}</b><br>${mat(s.aciklama || "")}`;
    alan.appendChild(ac);
    const ileri = document.createElement("button");
    ileri.className = "btn btn-birincil btn-tam";
    ileri.style.marginTop = "14px";
    ileri.textContent = i < sorular.length - 1 ? "Sonraki soru" : "Testi bitir";
    ileri.onclick = () => {
      if (i < sorular.length - 1) { i++; cevaplandi = false; ciz(); }
      else bitir();
    };
    alan.appendChild(ileri);
  }

  function bitir() {
    const yuzde = Math.round((dogru / sorular.length) * 100);
    const sinif = yuzde === 100 ? "iyi" : yuzde >= 60 ? "orta" : "kotu";
    const mesaj = yuzde === 100
      ? "Mükemmel! Bu konuyu bitirmiş sayılabilirsin."
      : yuzde >= 60 ? "İyi gidiyorsun. Yanlışlarını notlarına ekle."
      : "Anlatımı bir kez daha oku, videoyu durdurup soruları önce sen çöz.";
    alan.innerHTML = `
      <div class="sonuc">
        <div class="sonuc-puan ${sinif}">${dogru}<small style="font-size:22px;color:var(--soluk)">/${sorular.length}</small></div>
        <p>${mesaj}</p>
        <div class="btn-satir">
          <button class="btn" id="tekrarBtn">Testi tekrar çöz</button>
          ${sira !== undefined ? `<button class="btn btn-birincil" id="quizSonraki">Sonraki konu</button>` : ""}
        </div>
      </div>`;
    el("tekrarBtn").onclick = () => { i = 0; dogru = 0; cevaplandi = false; ciz(); };
    const qs = el("quizSonraki");
    if (qs) qs.onclick = () => {
      const liste = konuListesi(dersId);
      const idx = liste.findIndex((x) => x.uniteId === uniteId && x.sira === Number(sira));
      const o = liste[idx + 1];
      if (o) location.hash = `#/konu/${dersId}/${o.uniteId}/${o.sira}`;
      else toast("Bu dersteki son konu");
    };
    if (yuzde === 100) {
      const p = ilerleme();
      if (!p[konuAnahtari]) { p[konuAnahtari] = Date.now(); ilerlemeYaz(p); toast("Test tam puan, konu bitirildi 🎉"); }
      const kutu = el("bitirKutu");
      if (kutu && !kutu.classList.contains("on")) {
        kutu.classList.add("on");
        kutu.querySelector("div div").textContent = "Bitirildi olarak işaretli";
      }
    }
  }

  ciz();
}

/* ---------- dersler / ilerleme / arama ---------- */
function derslerCiz() {
  const sinifId = seciliSinif();
  const sinif = VERI.mufredat.siniflar.find((x) => x.id === sinifId);
  ustbarCiz(false);
  altbarCiz("dersler");
  ilerlemeSerit(toplamIlerleme(sinifId).yuzde);
  el("gorunum").innerHTML = `
    <h1 style="font-size:22px;margin:6px 0 14px">Dersler</h1>
    <div class="segmente" id="sinifSec">
      ${VERI.mufredat.siniflar.map((s) => `<button data-s="${s.id}" class="${s.id === sinifId ? "aktif" : ""}">${s.ad}</button>`).join("")}
    </div>
    <div class="ders-grid" id="dersGrid"></div>`;
  el("sinifSec").querySelectorAll("button").forEach((b) => (b.onclick = () => {
    try { localStorage.setItem(ANAHTAR + "-sinif", b.dataset.s); } catch {}
    derslerCiz();
  }));
  const grid = el("dersGrid");
  sinif.dersler.forEach((d) => grid.appendChild(dersKartiOlustur(d)));
}

function ilerlemeCiz() {
  ustbarCiz(false);
  altbarCiz("ilerleme");
  const p = ilerleme();
  const tumKonular = VERI.mufredat.siniflar.flatMap((s) => s.dersler.flatMap((d) => konuListesi(d.id)));
  const biten = tumKonular.filter((x) => p[anahtar(x.sinifId, x.dersId, x.uniteId, x.konu)]).length;
  const yuzde = tumKonular.length ? Math.round((biten / tumKonular.length) * 100) : 0;
  ilerlemeSerit(yuzde);

  const gunler = new Set(Object.values(p).map((t) => new Date(t).toDateString()));
  const icerikliKonu = tumKonular.filter((x) => icerik(x.sinifId, x.dersId, x.uniteId, x.konu)).length;
  const videoKonu = tumKonular.filter((x) => video(x.sinifId, x.dersId, x.uniteId, x.konu)).length;

  el("gorunum").innerHTML = `
    <h1 style="font-size:22px;margin:6px 0 16px">İlerleme</h1>
    <div class="stat-grid">
      <div class="stat"><b>${yuzde}%</b><span>Genel ilerleme</span></div>
      <div class="stat"><b>${biten}<small style="font-size:15px;color:var(--soluk)">/${tumKonular.length}</small></b><span>Bitirilen konu</span></div>
      <div class="stat"><b>${gunler.size}</b><span>Çalışılan gün</span></div>
      <div class="stat"><b>${tumKonular.length - biten}</b><span>Kalan konu</span></div>
    </div>
    <div class="stat-grid">
      <div class="stat kucuk"><b>${icerikliKonu}</b><span>Anlatımı hazır konu</span></div>
      <div class="stat kucuk"><b>${videoKonu}</b><span>Videolu konu</span></div>
      <div class="stat kucuk"><b>${gunler.size > 0 ? "🔥" : "—"}</b><span>Çalışma serisi</span></div>
    </div>

    <div class="kart">
      <h2 class="kart-baslik"><span class="em">📚</span> Derslere göre</h2>
      ${VERI.mufredat.siniflar.map((s) => `
        <div style="margin:14px 0 6px;font-size:12.5px;font-weight:800;color:var(--soluk);letter-spacing:.5px">${esc(s.ad.toUpperCase())}</div>
        ${s.dersler.map((d) => {
          const r = dersIlerleme(d.id);
          return `<div class="ders-satir" style="--ders-renk:${dersRenk(d.id)}">
            <span>${dersIkon(d.id)}</span>
            <span class="ad">${esc(d.ad)}</span>
            <span class="mini-cubuk"><i style="width:${r.yuzde}%"></i></span>
            <span class="yu">${r.yuzde}%</span>
          </div>`;
        }).join("")}
      `).join("")}
    </div>

    <div class="btn-satir">
      <button class="btn" id="disaAktarBtn">⬇️ İlerlemeyi kopyala</button>
      <button class="btn" id="sifirlaBtn">🗑️ Sıfırla</button>
    </div>`;

  el("sifirlaBtn").onclick = () => {
    if (confirm("Tüm ilerlemen silinecek. Emin misin?")) {
      localStorage.removeItem(ANAHTAR);
      toast("İlerleme sıfırlandı");
      ilerlemeCiz();
    }
  };
  el("disaAktarBtn").onclick = async () => {
    const metin = JSON.stringify({ anahtar: ANAHTAR, veri: p }, null, 1);
    try { await navigator.clipboard.writeText(metin); toast("İlerleme panoya kopyalandı"); }
    catch { toast("Kopyalanamadı, tarayıcı izni gerekli"); }
  };
}

function aramaCiz() {
  ustbarCiz(false);
  altbarCiz("");
  el("gorunum").innerHTML = `
    <h1 style="font-size:22px;margin:6px 0 14px">Ara</h1>
    <div class="ara-sar"><span class="buyutec">🔍</span><input id="araInput" type="search" placeholder="Konu, ünite veya ders yaz..." autocomplete="off"></div>
    <div id="araSonuc"></div>`;
  const input = el("araInput");
  input.focus();
  const ara = () => {
    const q = input.value.toLocaleLowerCase("tr").trim();
    const kap = el("araSonuc");
    if (q.length < 2) { kap.innerHTML = `<div class="bos"><span class="em">⌨️</span>En az 2 harf yaz</div>`; return; }
    const sonuc = [];
    VERI.mufredat.siniflar.forEach((s) => s.dersler.forEach((d) => konuListesi(d.id).forEach((x) => {
      if (`${d.ad} ${x.uniteAd} ${x.konu}`.toLocaleLowerCase("tr").includes(q))
        sonuc.push({ ...x, dersAd: d.ad, sinifAd: s.ad });
    })));
    if (!sonuc.length) { kap.innerHTML = `<div class="bos"><span class="em">🤷</span>Sonuç bulunamadı</div>`; return; }
    kap.innerHTML = `<div class="sonuc-liste">${sonuc.slice(0, 60).map((x) => `
      <button class="sonuc-satir" data-d="${x.dersId}" data-u="${x.uniteId}" data-i="${x.sira}">
        <span>${dersIkon(x.dersId)}</span>
        <span style="flex:1;min-width:0"><b>${esc(x.konu)}</b><span class="yol">${esc(x.sinifAd)} · ${esc(x.dersAd)} · ${esc(x.uniteAd)}</span></span>
        <span class="ok">›</span>
      </button>`).join("")}</div>`;
    kap.querySelectorAll(".sonuc-satir").forEach((b) => (b.onclick = () => {
      location.hash = `#/konu/${b.dataset.d}/${b.dataset.u}/${b.dataset.i}`;
    }));
  };
  input.oninput = ara;
  ara();
}

/* ---------- yönlendirme ---------- */
function anaGit() { location.hash = "#/"; }
function konuGit(x) { location.hash = `#/konu/${x.dersId}/${x.uniteId}/${x.sira}`; }

function yonlendir() {
  const p = location.hash.replace(/^#\/?/, "").split("/").filter(Boolean);
  window.scrollTo({ top: 0 });
  if (!p.length) return anaCiz();
  if (p[0] === "dersler") return derslerCiz();
  if (p[0] === "ilerleme") return ilerlemeCiz();
  if (p[0] === "ara") return aramaCiz();
  if (p[0] === "ders" && p[1]) return dersCiz(p[1]);
  if (p[0] === "konu" && p[1] && p[2] && p[3] !== undefined) return konuCiz(p[1], p[2], p[3]);
  return anaGit();
}

/* ---------- başlat ---------- */
async function baslat() {
  try { temaAyarla(localStorage.getItem(ANAHTAR + "-tema") || (matchMedia("(prefers-color-scheme: light)").matches ? "acik" : "koyu")); }
  catch { temaAyarla("koyu"); }
  try {
    await veriYukle();
  } catch (e) {
    el("yukleniyor").innerHTML = `<div class="bos"><span class="em">⚠️</span>İçerik yüklenemedi.<br><small>${esc(e.message)}</small></div>`;
    return;
  }
  el("yukleniyor").classList.add("gizli");
  window.addEventListener("hashchange", yonlendir);
  yonlendir();
}

document.addEventListener("DOMContentLoaded", baslat);
