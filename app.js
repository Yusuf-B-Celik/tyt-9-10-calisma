const DURUM_ANAHTARI = "tyt910-ilerleme-v1";
let MUFR = null, KAYNAK = null, QUIZ = null;
let secili = { sinif: "9", ders: null, unite: null, konu: null };
let sekme = "yol";

const $ = (id) => document.getElementById(id);
const ilerleme = () => { try { return JSON.parse(localStorage.getItem(DURUM_ANAHTARI) || "{}"); } catch { return {}; } };
const kaydet = (o) => localStorage.setItem(DURUM_ANAHTARI, JSON.stringify(o));
const konuAnahtari = (s, d, u, k) => `${s}|${d}|${u}|${k}`;

async function baslat() {
  const [m, k] = await Promise.all([
    fetch("data/curriculum.json").then(r => r.json()),
    fetch("data/resources.json").then(r => r.json())
  ]);
  MUFR = m; KAYNAK = k;
  try { QUIZ = await fetch("data/quizzes.json").then(r => r.json()); } catch { QUIZ = { quizler: {} }; }
  $("tytBilgi").textContent = MUFR.meta.soruDagilimi;
  sinifSecDoldur();
  mebDoldur();
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

function mebDoldur() {
  $("mebListe").innerHTML = KAYNAK.meb.map(m => `<a href="${m.url}" target="_blank" rel="noopener">${m.ad}</a>`).join("");
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
    const det = document.createElement("details");
    if (secili.ders === d.id) det.open = true;
    const toplam = d.uniteler.flatMap(u => u.konular).length;
    const biten = d.uniteler.flatMap(u => u.konular).filter(k => prog[konuAnahtari(sinif.id, d.id, uId(d, k), k)]).length;
    const s = document.createElement("summary");
    s.textContent = `${d.ad} (${biten}/${toplam})`;
    s.onclick = () => { secili.ders = d.id; };
    det.appendChild(s);
    d.uniteler.forEach(u => {
      const du = document.createElement("div"); du.className = "unite";
      const h = document.createElement("h4"); h.textContent = u.ad; du.appendChild(h);
      u.konular.forEach(k => {
        const ad = `${d.ad} ${u.ad} ${k}`.toLocaleLowerCase("tr");
        if (q && !ad.includes(q)) return;
        const b = document.createElement("button");
        b.className = "konu" + (prog[konuAnahtari(sinif.id, d.id, u.id, k)] ? " tamam" : "");
        b.textContent = (prog[konuAnahtari(sinif.id, d.id, u.id, k)] ? "✓ " : "• ") + k;
        b.onclick = () => { secili.ders = d.id; secili.unite = u.id; secili.konu = k; dersleriCiz(); panelCiz(); };
        du.appendChild(b);
      });
      det.appendChild(du);
    });
    kutu.appendChild(det);
  });
}
function uId(d, k) { for (const u of d.uniteler) if (u.konular.includes(k)) return u.id; return ""; }

function panelCiz() {
  const p = $("panel"), kir = $("kirinti"), bas = $("baslik");
  if (!secili.ders || !secili.konu) { kir.textContent = ""; bas.textContent = "Bir ders seç"; p.innerHTML = `<div class="kart">Soldan sınıf → ders → konu seç. Sıra müfredat sırasıdır, atlamadan ilerle.</div>`; return; }
  const sinif = MUFR.siniflar.find(x => x.id === secili.sinif);
  const ders = sinif.dersler.find(x => x.id === secili.ders);
  const unite = ders.uniteler.find(x => x.id === secili.unite);
  kir.textContent = `${sinif.ad} / ${ders.ad} / ${unite.ad}`;
  bas.textContent = secili.konu;
  if (sekme === "yol") yolCiz(p, sinif, ders, unite);
  else if (sekme === "videolar") videoCiz(p, ders);
  else quizCiz(p, sinif, ders, unite);
}

function yolCiz(p, sinif, ders, unite) {
  const anahtar = konuAnahtari(sinif.id, ders.id, unite.id, secili.konu);
  const prog = ilerleme();
  const yapildi = !!prog[anahtar];
  p.innerHTML = `
    <div class="kart"><b>Verimli sıra (15-25 dk):</b>
      <label class="adim"><input type="checkbox" data-adim="not" /> <span>1. Kısa notu oku ve kendi cümlenle 3 satır özet çıkar.</span></label>
      <label class="adim"><input type="checkbox" data-adim="video" /> <span>2. Önce MEB/OGM videosunu, takıldığın yerde kanal videosunu izle (1.25x değil, normal hız + durdurarak).</span></label>
      <label class="adim"><input type="checkbox" data-adim="quiz" /> <span>3. Quiz sekmesinde en az 5 soru çöz, yanlışları nota ekle.</span></label>
      <div class="adim"><input type="checkbox" id="tamamKutu" ${yapildi ? "checked" : ""} /> <label for="tamamKutu"><b>Konuyu bitirdim</b> olarak işaretle</label></div>
    </div>
    <div class="kart"><b>Bu konuda ne öğreneceksin?</b><br/>${secili.konu} — ${ders.ad} / ${unite.ad}. Önce kavramı tanımla, sonra 2 örnek çöz, sonra TYT tipi 1 soru dene. Takıldığın kavramı aramaya yazıp ilgili önceki konuya dön.</div>
    <div class="kart"><b>Sonraki adım:</b> <button id="sonrakiBtn">Sonraki konuya geç →</button></div>`;
  $("tamamKutu").addEventListener("change", e => {
    const o = ilerleme();
    if (e.target.checked) o[anahtar] = Date.now(); else delete o[anahtar];
    kaydet(o); dersleriCiz();
  });
  $("sonrakiBtn").addEventListener("click", () => {
    const tum = ders.uniteler.flatMap(u => u.konular.map(k => ({ u: u.id, k })));
    const i = tum.findIndex(x => x.k === secili.konu && x.u === unite.id);
    if (i >= 0 && i < tum.length - 1) { secili.unite = tum[i + 1].u; secili.konu = tum[i + 1].k; dersleriCiz(); panelCiz(); window.scrollTo({ top: 0, behavior: "smooth" }); }
    else alert("Bu derste son konudasın. Başka derse geçebilirsin.");
  });
}

function ytArama(dersAd, konu) {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(dersAd + " " + konu + " konu anlatımı")}`;
}

function videoCiz(p, ders) {
  const ilgili = KAYNAK.kanallar.filter(x => ders.ad.includes(x.ders) || x.ders === "Genel" || x.ders.includes(ders.ad));
  const liste = (ilgili.length ? ilgili : KAYNAK.kanallar.filter(x => x.ders === "Genel"));
  p.innerHTML = `
    <div class="kart"><b>${secili.konu} için izleme sırası:</b>
      <div>1. <a target="_blank" rel="noopener" href="https://ogmmateryal.eba.gov.tr/">OGM Materyal'de ara</a> — resmi anlatım + test</div>
      <div>2. <a target="_blank" rel="noopener" href="${ytArama(ders.ad, secili.konu)}">YouTube'da "${ders.ad} ${secili.konu}" ara</a></div>
    </div>
    ${liste.map(x => `<div class="kart"><b>${x.ders}:</b> <a target="_blank" rel="noopener" href="${x.url}">${x.ad}</a></div>`).join("")}
    <div class="kart">Not: Videoyu pasif izleme. Durdur-asıl soruyu önce sen çöz, sonra devam et.</div>`;
}

function quizCiz(p, sinif, ders, unite) {
  const anahtar = `${sinif.id}|${ders.id}|${unite.id}|${secili.konu}`;
  const ozel = (QUIZ && QUIZ.quizler[anahtar]) || (QUIZ && QUIZ.quizler[`${ders.id}|${secili.konu}`]);
  if (!ozel) {
    p.innerHTML = `<div class="kart"><b>Bu konu için hazır quiz henüz yok.</b><br/>Kendini şöyle yokla:<br/>1) Kavramı tanımsız bakmadan tanımlayabiliyor musun?<br/>2) 2 kolay + 1 TYT tipi soru çözdün mü? (OGM Soru Bankası: <a target="_blank" rel="noopener" href="https://ogmmateryal.eba.gov.tr/soru-bankasi">aç</a>)<br/>3) Yanlış yaptığın yeri nota yazdın mı?</div>`;
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
    if (dogru === ozel.length) {
      const o = ilerleme(); o[anahtar] = Date.now(); kaydet(o); dersleriCiz();
    }
  };
  sor();
}

document.addEventListener("DOMContentLoaded", baslat);
