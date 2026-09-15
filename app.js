const DURUM_ANAHTARI = "tyt910-ilerleme-v2";
let MUFR = null, NOTLAR = null, VIDEOLAR = null, QUIZ = null;
let secili = { sinif: "9", ders: null, unite: null, konu: null };
let sekme = "ders";

const $ = (id) => document.getElementById(id);
const ilerleme = () => { try { return JSON.parse(localStorage.getItem(DURUM_ANAHTARI) || "{}"); } catch { return {}; } };
const kaydet = (o) => localStorage.setItem(DURUM_ANAHTARI, JSON.stringify(o));
const konuAnahtari = (s, d, u, k) => `${s}|${d}|${u}|${k}`;

async function baslat() {
  const [m, n, v] = await Promise.all([
    fetch("data/curriculum.json").then(r => r.json()),
    fetch("data/notes.json").then(r => r.json()),
    fetch("data/videos.json").then(r => r.json())
  ]);
  MUFR = m; NOTLAR = n; VIDEOLAR = v;
  try { QUIZ = await fetch("data/quizzes.json").then(r => r.json()); } catch { QUIZ = { quizler: {} }; }
  $("tytBilgi").textContent = MUFR.meta.soruDagilimi;
  sinifSecDoldur();
  sekmeDinle();
  $("ara").addEventListener("input", dersleriCiz);
  $("sinifSec").addEventListener("change", e => { secili.sinif = e.target.value; secili.ders = null; secili.unite = null; secili.konu = null; dersleriCiz(); panelCiz(); });
  $("sifirlaBtn").addEventListener("click", () => { if (confirm("İlerleme silinsin mi?")) { localStorage.removeItem(DURUM_ANAHTARI); panelCiz(); dersleriCiz(); } });
  dersleriCiz();
  panelCiz();
}

function sinifSecDoldur() {
  const s = $("sinifSec"); s.innerHTML = "";
  MUFR.siniflar.forEach(x => {
    const o = document.createElement("option");
    o.value = x.id; o.textContent = x.ad;
    if (x.id === secili.sinif) o.selected = true;
    s.appendChild(o);
  });
}

function sekmeDinle() {
  document.querySelectorAll(".sekmeler button").forEach(b => b.addEventListener("click", () => {
    document.querySelectorAll(".sekmeler button").forEach(x => x.classList.remove("aktif"));
    b.classList.add("aktif"); sekme = b.dataset.sekme; panelCiz();
  }));
}

function dersleriCiz() {
  const q = ($("ara").value || "").toLocaleLowerCase("tr");
  const sinif = MUFR.siniflar.find(x => x.id === secili.sinif);
  const prog = ilerleme();
  const kutu = $("dersListe"); kutu.innerHTML = "";
  sinif.dersler.forEach(d => {
    const tum = d.uniteler.flatMap(u => u.konular.map(k => konuAnahtari(sinif.id, d.id, u.id, k)));
    const biten = tum.filter(k => prog[k]).length;
    const det = document.createElement("details");
    if (secili.ders === d.id) det.open = true;
    const s = document.createElement("summary");
    s.textContent = `${d.ad} (${biten}/${tum.length})`;
    s.onclick = () => { secili.ders = d.id; };
    det.appendChild(s);
    d.uniteler.forEach(u => {
      const du = document.createElement("div"); du.className = "unite";
      const h = document.createElement("h4"); h.textContent = u.ad; du.appendChild(h);
      let goster = 0;
      u.konular.forEach(k => {
        if (q && !`${d.ad} ${u.ad} ${k}`.toLocaleLowerCase("tr").includes(q)) return;
        goster++;
        const b = document.createElement("button");
        const t = prog[konuAnahtari(sinif.id, d.id, u.id, k)];
        b.className = "konu" + (t ? " tamam" : "");
        b.textContent = (t ? "✓ " : "• ") + k;
        b.onclick = () => { secili.ders = d.id; secili.unite = u.id; secili.konu = k; dersleriCiz(); panelCiz(); window.scrollTo({ top: 0, behavior: "smooth" }); };
        du.appendChild(b);
      });
      if (goster) det.appendChild(du);
    });
    kutu.appendChild(det);
  });
}

function panelCiz() {
  const p = $("panel"), kir = $("kirinti"), bas = $("baslik");
  if (!secili.ders || !secili.konu) {
    kir.textContent = ""; bas.textContent = "Bir konu seç";
    p.innerHTML = `<div class="kart">Soldan sınıf → ders → konu seç. Sıra müfredat sırasıdır: önce notu oku, videoyu izle, quizi çöz, bitmiş işaretle.</div>`;
    return;
  }
  const sinif = MUFR.siniflar.find(x => x.id === secili.sinif);
  const ders = sinif.dersler.find(x => x.id === secili.ders);
  const unite = ders.uniteler.find(x => x.id === secili.unite);
  kir.textContent = `${sinif.ad} / ${ders.ad} / ${unite.ad}`;
  bas.textContent = secili.konu;
  if (sekme === "ders") dersCiz(p, sinif, ders, unite);
  else quizCiz(p, sinif, ders, unite);
}

function dersCiz(p, sinif, ders, unite) {
  const not = NOTLAR[unite.id];
  const vid = VIDEOLAR[unite.id] || [];
  const anahtar = konuAnahtari(sinif.id, ders.id, unite.id, secili.konu);
  const yapildi = !!ilerleme()[anahtar];
  p.innerHTML = `
    ${not ? `<div class="kart"><b>📖 Ders notu — ${unite.ad}</b><p>${not.ozet}</p>
      <ul>${not.maddeler.map(m => `<li>${m}</li>`).join("")}</ul>
      <p><b>Örnek:</b> ${not.ornek}</p>
      <p><b>🎯 TYT ipucu:</b> ${not.ipucu}</p></div>` : ""}
    ${vid.length ? `<div class="kart"><b>🎬 Konu videosu (siteden çıkmadan izle)</b>
      ${vid.map((v, i) => `<p style="margin:8px 0 4px">${i + 1}. ${esc(v.baslik)}</p>
        <div class="video"><iframe src="https://www.youtube.com/embed/${v.id}" title="Konu videosu" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen loading="lazy"></iframe></div>`).join("")}
      </div>` : ""}
    <div class="kart"><div class="adim"><input type="checkbox" id="tamamKutu" ${yapildi ? "checked" : ""} /> <label for="tamamKutu"><b>Okudum + izledim, konuyu bitirdim</b></label></div>
      <div style="margin-top:8px"><button id="quizBtn">Quize geç →</button> <button id="sonrakiBtn">Sonraki konu →</button></div></div>`;
  $("tamamKutu").addEventListener("change", e => {
    const o = ilerleme();
    if (e.target.checked) o[anahtar] = Date.now(); else delete o[anahtar];
    kaydet(o); dersleriCiz();
  });
  $("quizBtn").addEventListener("click", () => {
    sekme = "quiz";
    document.querySelectorAll(".sekmeler button").forEach(x => x.classList.toggle("aktif", x.dataset.sekme === "quiz"));
    panelCiz();
  });
  $("sonrakiBtn").addEventListener("click", () => {
    const tum = ders.uniteler.flatMap(u => u.konular.map(k => ({ u: u.id, k })));
    const i = tum.findIndex(x => x.k === secili.konu && x.u === unite.id);
    if (i >= 0 && i < tum.length - 1) { secili.unite = tum[i + 1].u; secili.konu = tum[i + 1].k; dersleriCiz(); panelCiz(); }
    else alert("Bu derste son konudasın.");
  });
}

function esc(s) { const d = document.createElement("div"); d.textContent = s; return d.innerHTML; }

function quizCiz(p, sinif, ders, unite) {
  const anahtar = `${sinif.id}|${ders.id}|${unite.id}|${secili.konu}`;
  const ozel = (QUIZ && QUIZ.quizler[anahtar]) || (QUIZ && QUIZ.quizler[`${ders.id}|${secili.konu}`]);
  if (!ozel) {
    p.innerHTML = `<div class="kart"><b>Bu konu için hazır quiz henüz yazılmadı.</b><br/>Kendini şöyle yokla:<br/>1) Notlardaki her maddeyi örneksiz anlatabiliyor musun?<br/>2) Videoyu durdurup soruyu önce sen çözdün mü?<br/>3) Bir arkadaşına 2 dakikada anlatabilir misin?</div>`;
    return;
  }
  let i = 0, dogru = 0;
  const sor = () => {
    const s = ozel[i];
    p.innerHTML = `<div class="kart"><b>Soru ${i + 1}/${ozel.length}</b> — Doğru: ${dogru}<br/><br/>${s.soru}</div>` +
      s.siklar.map((sk, j) => `<button class="quiz-sik" data-j="${j}">${sk}</button>`).join("");
    p.querySelectorAll(".quiz-sik").forEach(b => b.addEventListener("click", () => {
      const j = +b.dataset.j;
      if (j === s.cevap) { b.classList.add("dogru"); dogru++; }
      else { b.classList.add("yanlis"); p.querySelectorAll(".quiz-sik")[s.cevap].classList.add("dogru"); }
      const aciklama = document.createElement("div");
      aciklama.className = "kart"; aciklama.textContent = "Açıklama: " + (s.aciklama || "");
      p.appendChild(aciklama);
      const ileri = document.createElement("button");
      ileri.textContent = i < ozel.length - 1 ? "Sonraki soru →" : "Bitir";
      ileri.className = "quiz-sik";
      ileri.onclick = () => { i++; if (i < ozel.length) sor(); else bitir(); };
      p.appendChild(ileri);
    }));
  };
  const bitir = () => {
    p.innerHTML = `<div class="kart"><b>Sonuç: ${dogru}/${ozel.length}</b><br/>${dogru === ozel.length ? "Tamamdır, konuyu bitmiş işaretleyebilirsin." : "Yanlışları nota ekle ve videoya dön."}</div>`;
    if (dogru === ozel.length) { const o = ilerleme(); o[anahtar] = Date.now(); kaydet(o); dersleriCiz(); }
  };
  sor();
}

document.addEventListener("DOMContentLoaded", baslat);
