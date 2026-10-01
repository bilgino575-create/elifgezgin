# GEZİ — Elif Gezgin'in dijital sanat dünyası (v3)

Bu belge sitenin tasarım sistemi ve mimarisidir. Sıfırdan kuruldu; v1
(ATÖLYE) ve v2 (RENK) tamamen kaldırıldı. Burada ne yazıyorsa sitede o var.

## 0. Fikir

Soyadı "Gezgin" demek: dolaşan, yol alan. Site bir sayfa değil, bir **gezi**:
ziyaretçi elinde bir ışıkla (imleç) yedi durağı olan bir rotada ilerler.
Kaydırmak sayfayı kaydırmaz, kamerayı yürütür. Her durak bir sanat
enstalasyonu — grafik tasarımın bir disiplini, uzayda bir heykel olarak.
Yedi durak tek bir evrene aittir: aynı malzemeler (krom, cam, sıvı, mat
neon, kâğıt), aynı iki yazı ailesi, aynı ışık kuralı (durağın rengi uzayı
boyar, imleç ışığı nesneleri yalar). Ama her durağın kendi renk yönetimi
var; ziyaretçi her inişte "bu da ne?" der, ne olduğunu da anlar.

Durakların adı "sahne" değil "durak": sitede `01 / 07 — RENK` gibi yazar.

| # | durak | ne gösterir | palet | malzeme / nesne |
|---|---|---|---|---|
| 01 | RENK | giriş: Elif Gezgin — Grafik Tasarımcı | mürekkep siyahı + elektrik mavisi + sıcak pembe + cyan (karanlık + neon) | krom "ELİF", holografik cam "GEZGİN", sıvı küreler, krom şeritler, parçacık alanı, süzülen afiş parçaları, parlak zemin |
| 02 | TİPOGRAFİ | Proje 02: krom 3B tipografi | krem + kobalt + turuncu | krom harfler (imlece göre yansıma), dönen harf halkası, HTML'de ayrılan harfler |
| 03 | MARKA | Proje 03: cam küp içinde kimlik sistemi | derin mor + magenta + cyan | tek transmisyon camı, içinde logo/renk/kart/desen levhaları |
| 04 | AFİŞ | Proje 01: süzülen dev afiş (imlece eğilir) → Proje 06: parçalanıp yeniden birleşen afiş serisi | asit yeşili + siyah | afiş düzlemleri, parçacık afişler (instanced quad'lar) |
| 05 | DİJİTAL SANAT | Proje 04: heykel üzerine projeksiyon → Proje 05: uzayda açılan dergi forması | kırık beyaz + krom + renkli yansıma (beyaz stüdyo) | projeksiyonlu bozulmuş küre, iki sayfalık forma |
| 06 | ELİF | hakkımda: enstalasyon | siyah + ultraviyole + lime | dev "ELİF / GEZGİN", heykel (Elif'in kendi GLB'si), derinlikte dolaşan disiplin kelimeleri, arka planda soyut tasarım sistemi |
| 07 | İLETİŞİM | "BİRLİKTE TUHAF BİR ŞEY YAPALIM." | elektrik mavisi zemin + kırık beyaz yazı + krom | yavaşça dönen krom düğüm, imleçle değişen ışık |

Durak renkleri uzayın kendisini boyar: arka plan shader'ı ve sis rengi
kaydırmayla bir durağın paletinden diğerine geçer. "Section" yok; dünya var.

## 1. Tasarım sistemi

### 1.1 Renk — mürekkepler

Adlı mürekkepler, tasarım dilinin tamamı bunlardan kurulur:

| ad | hex | kullanım |
|---|---|---|
| `ink` | `#07060f` | boşluk, durak 01/06 zemini |
| `electric` | `#1f3bff` | ana vurgu; durak 07 zemini; imleç ışığı |
| `cyan` | `#19e3ff` | neon ikinci ışık |
| `violet` | `#6a2cff` | durak 03 derinlik, 06 ışık |
| `hotpink` | `#ff2e88` | neon, krom yansıması |
| `magenta` | `#e400ff` | durak 03 |
| `lime` | `#c8ff00` | durak 04 zemini; 06 yazı |
| `acid` | `#7dff2a` | parçacık, vurgu |
| `orange` | `#ff5a1f` | durak 02 vurgusu |
| `coral` | `#ff6b57` | sıcak ışık |
| `yellow` | `#ffd400` | afişlerde |
| `purple` | `#2a0f5e` | durak 03 zemini |
| `cream` | `#f3eee3` | durak 02 zemini |
| `offwhite` | `#f7f6f2` | durak 05 zemini; yazı |
| `chrome` | — | malzeme: metalness 1, roughness 0.04–0.12, durağın env'i |

Kural: bir durakta en fazla üç mürekkep + bir zemin. Gradient yalnızca
ışıktan gelir (volumetrik parlama, yansıma), düz CSS gradient yoktur.

### 1.2 Tipografi

- **Archivo** (değişken: `wdth` 62–125, `wght` 100–900, italik): tek bir
  grotesk, hem 300 px'lik yoğun başlıkları (wdth 62, wght 900) hem geniş
  neon kelimeleri (wdth 125) hem metni (wdth 100, wght 400) taşır. Türkçe
  karakterler tam (latin-ext).
- **Instrument Serif** italik: editoryal karşı ses — "01 / 07", açıklama
  cümleleri, "örnek proje" notları.
- Ölçek (clamp ile akışkan): `--t-giant` 18–34 vw (durak başlıkları),
  `--t-display` 7–12 vw, `--t-h2` 3.2–5.6 rem, `--t-lead` 1.25–1.6 rem,
  `--t-body` 1–1.1 rem, `--t-meta` 0.75–0.8 rem (büyük harf, 0.12 em aralık).
- 3B tipografi: harfler yazı tipinden canvas'ta izlenip (`glyphs.ts`) kontur
  → `Shape` → ekstrüzyon; hero'da "ELİF" krom, "GEZGİN" holografik cam.
  Uzaydaki kelimeler (06, 02 halkası) troika SDF metin (`drei/Text`),
  özel malzemeyle.
- Türkçe: `upper()` İ/ı dönüşümlerini `tr-TR` locale ile yapar.

### 1.3 Izgara ve boşluk

Editoryal, asimetrik: 12 kolonlu bir ızgara (`--col`), ama her durağın HTML
katmanı farklı bir köşeyi tutar (01 sol-alt, 02 sağ-üst, 03 sol-üst, 04
sağ-alt, 05 alt-orta, 06 sol, 07 orta). Aynı yerleşim iki kez kullanılmaz.
Kenar boşluğu `--gutter` 16 px (telefon) → 48 px (1440+).

### 1.4 Hareket

- Easing: `cubic-bezier(.16,1,.3,1)` (çıkış), kamera için kritik sönümlü
  yay (frame-rate'ten bağımsız, kapalı form).
- Süre: mikro 160–240 ms, geçiş 600–900 ms, kamera yürüyüşü kaydırmaya bağlı.
- İmleç: DOM'daki parlayan küre + sahnedeki nokta ışığı aynı kaynaktan
  (`store.pointer`). Manyetik hedefler (`data-magnet`), hover'da büyüme,
  proje üzerinde "AÇ" etiketi. Dokunmatikte kapalı.
- Reduced motion: kamera duraklara atlar, parçacıklar durur, otomatik
  dönüşler ve yükselmeler kapalı, loader tek kare.

### 1.5 Malzemeler ve ışık

- Krom: `MeshStandardMaterial` metalness 1, roughness 0.05, env durağın
  Lightformer'larından (durak değişince yeniden çekilir).
- Cam: tek `MeshTransmissionMaterial` (durak 03 küp), diğer "cam"lar
  iridescence'lı fizik malzeme (ucuz).
- Sıvı: gürültüyle yer değiştirilen küreler (vertex shader), iridescent.
- Mat neon: emissive düz renk + bloom.
- Kâğıt: afişler içerik hattının WebP türevleri (2048 px doku), mat
  `MeshStandardMaterial`, arkasında ince siyah bir yaprak.
- Zemin: tek `MeshReflectorMaterial` düzlemi kamerayla duraktan durağa
  gider, boşluğun alt rengini alır (HIGH/ULTRA yansıtır; MID/LOW yalnızca
  env parlaması).
- Post (HIGH/ULTRA): bloom (eşik 0.85), kromatik sapma (hafif, kenarlarda),
  vinyet, grain; DOF yalnızca ULTRA'da. MID: yalnızca vinyet+grain shader
  arka planda. LOW: hiç.

## 2. Mimari

```
src/
  app/                      layout (fontlar, metadata), (tr)/ ve en/ rotaları,
                            isler/[slug] + en/work/[slug], OG görselleri, sitemap, robots
  components/
    3d/                     Experience (Canvas, tier, dpr), World (durak grafiği, her sahne
                            kendi hata sınırı + Suspense adasında), CameraRig, Backdrop, Env,
                            CursorLight, ParticleField, Floor, Post, Tiering, text/ (glif
                            izleme, ekstrüzyon), materials, scenes/ (ColorScene,
                            TypographyScene, BrandingScene, PosterScene, DigitalArtScene,
                            AboutScene + Statue, ContactScene)
    sections/               her durağın HTML katmanı (Hero, Typography, Branding,
                            Poster, DigitalArt, About, Contact) — semantik, erişilebilir
    ui/                     Navigation (+ telefon menüsü), RouteIndex, CustomCursor,
                            Loader, SplitWord, CopyEmail
    sections/FallbackArt    WebGL yokken ve proje sayfasında işin görseli (next/image)
    WorkPage, WorkStage     proje sayfası ve küçük 3B sahnesi (WorkScene)
  lib/                      store, scroll (Lenis → p), stops (durak haritası), tiers, i18n,
                            meta, probe (boyamadan önce çalışan sınıf betiği), workOg
  content/                  works.generated.ts (içerik hattından)
content/                    site.ts, works/<slug>/meta.json + görseller
scripts/                    prepare-content (sharp), samples (örnek işler, SVG → PNG),
                            shoot, probe, verify, contrast, lighthouse
```

### 2.1 Kaydırma = kamera yolculuğu

`p ∈ [0,1]` tek saat. Yedi durak, yedi "stop" anahtarı; aralarında kamera
bir Catmull-Rom yolu üzerinde yürür, bakış hedefi ayrı interpolasyonla.
Duraklar dünyada dağınık yerleşir (x, y ve z'de), yol kıvrımlıdır: 01
(0,0,0) → 02 (26,3,−6) → 03 (50,−2,4) → 04 (74,4,−8) → 05 (98,0,6) → 06
(122,−3,−4) → 07 (146,2,0). Komşu durakların nesneleri uzakta görünür
(süreklilik). Her durağın HTML katmanı kamera o durağa yaklaşınca belirir
(`data-stop`), ayrılınca kaybolur. Scroll yolu 7 × 110 vh (telefon 7 × 90).

### 2.2 İlk yük

HTML tek başına durur (LCP metin: 2B gezide dev "GEZGİN", sahnede
"GRAFİK TASARIMCI"). İlk JS: Next çalışma zamanı + loader + imleç + nav;
gsap (imleç) ve lenis (kaydırma) ilk boyamadan sonra dinamik iner. 3B
parçası (three, fiber, drei, postprocessing, sahneler) ilk boyamadan sonra
`requestIdleCallback` ile iner; shader programları ilk kareden önce
`compileAsync` ile (KHR_parallel_shader_compile varsa iş parçacığı dışında)
derlenir; yedi enstalasyon tek karede değil, kamera yaklaştıkça kurulur
(`Lazy`: giriş ve komşusu hemen, diğerleri yolda). Fontlar: latin alt
kümesi + yalnızca Türkçe harfler ve editoryal noktalamayı taşıyan 11 KB'lık
`archivo-tr.woff2` ilk boyama yolunda, `fetchpriority=high` ile; latin-ext'in
kalanı yalnızca gerekirse. 2B gezide loader hiç çizilmez. Loader gerçek yükleme
birimlerini sayar: fontlar, 3B parçası, sahnenin ilk karesi, giriş
durağının dokuları (dört birim; WebGL yoksa yalnızca fontlar). 9 saniyede
bitmezse "Gir" düğmesi çıkar; heykel sayılmaz, 06'ya yaklaşınca iner.

Loader sahnesi: karanlık; tek bir renkli parçacık; büyür; bir forma dönüşür
(yüzlerce parçacık bir küreye/ "E"ye toplanır); form parçalanır; site açılır.
Canvas 2D ile, three olmadan.

### 2.3 Projeler

`content/works/<slug>/meta.json`: başlık, kategori, yıl, rol, araçlar, metin,
`presentation` (`poster | chrome-type | glass-cube | projection | spread |
particles`), görseller. Örnekler `sample: true` ve sitede "örnek proje"
diye yazar. Gerçek müşteri/ödül uydurulmaz. Her proje bir durakta fiziksel
nesne; tıklanınca `/isler/<slug>` kendi deneyimi: tam ekran artwork, dev
başlık/kategori/yıl, açıklama, 3B sunum (hafif canvas), süreç, son iş,
detaylar.

### 2.4 Örnek işler

`scripts/samples.mjs`: altı örnek iş (afiş, tipografik kimlik, marka
sistemi, üretken dijital iş, dergi forması, afiş serisi) SVG olarak
tasarlanıp sharp ile PNG'ye basılır; yazı sitenin kendi Archivo'su
(fontconfig `assets/fonts/fonts.conf`). Yalnızca `content/works` boşken
çalışır; `npm run samples` zorlar. Üretilen görseller gerçek işlerle aynı
hattan geçer (`prepare-content`), sahnede doku, DOM'da `next/image`.
Elif'in gerçek işleri geldiğinde örnek klasörleri silinir; kod değişmez.

## 3. Mobil, kademeler, yedekler

- Zayıf cihaz koruması, boyamadan önce (`lib/probe.ts`): WebGL2 bağlamı
  `failIfMajorPerformanceCaveat` ile açılır; `WEBGL_debug_renderer_info`
  ile yazılım çizicileri (SwiftShader, llvmpipe, lavapipe, VMware,
  VirtualBox, Microsoft Basic Render, WARP, uzak masaüstü) tanınır ve
  sahne hiç kurulmaz, 2B gezi gösterilir. Sahne kurulduktan sonra
  detect-gpu kademesi 0 çıkarsa sahne kendini söker ve belge 2B geziye
  döner (`loading.fallback()`). `?gl=1` elle açar, `?nogl` elle kapatır.
- Kademeler: `ultra | high | mid | low` (GPU sınıfı + dokunmatik +
  `deviceMemory` + histerezisli fps izleme). DPR 1–1.75, telefonda en çok
  1.5. Parçacık sayısı, doku boyu, post, yansıma çözünürlüğü kademeye
  bağlı. MID/LOW'da kare composer olmadan doğrudan çizilir.
- Mobil ayrı yönetim: kamera daha yakın ve sakin, nesneler küçük, yazı daha
  güçlü, dokunarak sürükleme (nesneyi döndürür), çift kolonlu durak
  katmanları tek kolon, özel imleç yok, menü tam ekran.
- WebGL yoksa (`html:not(.gl)`): aynı HTML katmanları normal akışta, durak
  renkleri ve mürekkep parlamaları CSS'te, işlerin görselleri `next/image`
  ile (eğik afiş, cam kart, yuvarlak projeksiyon, geniş forma), 06'da
  disiplin kelimeleri, 07'de halkalar; boş ekran yok. Loader tek birim.
- `prefers-reduced-motion`: §1.4.

## 4. SEO ve erişilebilirlik

Başlık "Elif Gezgin — Grafik Tasarımcı"; açıklama grafik tasarım, marka
kimliği, görsel kimlik, dijital sanat, portfolyo. OpenGraph/Twitter
görselleri `next/og` ile (Archivo Black). JSON-LD Person. `hreflang`
tr/en. Atlama bağlantısı, odak halkaları, klavyeyle ulaşılabilir proje
bağlantıları, menüde ARIA, canlı bölgeler yok, `aria-hidden` dekoratif
katmanlarda.

## 5. Doğrulama

build + lint + typecheck; ekran görüntüleri 1440 ve 390 her durak; klavye,
taşma (320/375/390/430/768/1024/1440/1920), reduced motion, no-WebGL, dil,
bundle, bellek, kontrast; Lighthouse; konsol temiz. Ölçülmeyen hiçbir şey
iddia edilmez.

## 6. Ölçümler (v3, bu konteynerde)

Bütün tarayıcı ölçümleri Playwright Chromium + SwiftShader (yazılım WebGL)
ile alındı; kare süreleri bu makineyi anlatır, gerçek bir GPU'yu değil.
Bir GPU üzerindeki fps **ölçülmedi**.

| kontrol | sonuç |
|---|---|
| build / lint / typecheck | temiz (Next 16.2.9, ESLint 0 uyarı, tsc 0 hata) |
| konsol (1440 + 390, yedi durak; reduced; no-WebGL; proje sayfası; EN) | temiz |
| taşma | 8 genişlik × 2 mod × 7 durak + telefon menüsü + proje sayfası (3 genişlik × 2 mod) = 22 sayfa, yatay taşma yok |
| reduced motion | kamera her p'de tam durakta (ara konum yok), katmanlar geçişsiz |
| dil | `/` tr, `/en` en; hreflang tr/en/x-default; başlık "Elif Gezgin — Grafik Tasarımcı" / "Graphic Designer" |
| ilk JS (gzip) | 230 KB, 10 dosya (Next çalışma zamanı + React DOM 69 KB, gsap+lenis 39 KB, site kodu); 3B parçası tembel: 705 KB gzip (three + fiber + drei + postprocessing + sahneler) |
| çizim çağrısı / üçgen (HIGH, 1440) | 01: 75 / 430k · 02: 80 / 92k · 03: 34 / 16k · 04: 40 / 16k · 05: 41 / 65k · 06: 52 / 16k (+heykel) · 07: 73 / 546k (heykel komşu durakta görünür) |
| bellek (5 tam tur, HIGH) | dokular 43 → 43 (sabit; env tek küp hedefi), geometri 79 → 92 ve program 50 → 61 (görünür ışık kombinasyonları derlendikçe artar, sonra sabitlenir), JS yığını 39 MB |
| klavye | 68 odak durağı, hepsi halkalı; odak bir durağın katmanına girince kamera o durağa gelir (gizli katmanda kalan odak: 0) |
| kontrast (AA, render edilen piksellere karşı) | WebGL'siz ana sayfa 635 metin kutusu / 0 hata (hover + odak + telefon menüsü dahil); proje sayfası 64 / 0; WebGL (LOW kademe, yedi durak × 2 genişlik) 210 / 0. Fark harmanlı (difference) WebGL'siz nav ve bağlantıların kendi alt çizgisi ölçüm dışı: piksel testi onları yargılayamaz |
| Lighthouse | 2B gezi (yazılım çiziciler ve tarayıcı botlarının gördüğü yol): telefon performans 91 / masaüstü 99 (LCP 3.4 s / 0.8 s, TBT 110 ms / 0, CLS 0; LCP öğesi dev "GEZGİN" yazısı); erişilebilirlik, en iyi uygulamalar, SEO 100/100/100 her iki yolda. Sahne yolu `?gl=1` bu konteynerde (SwiftShader) telefon 39 / masaüstü 61: yazılım WebGL ana iş parçacığını yer, gerçek GPU ölçümü yok |

Ekran görüntüleri `docs/screenshots/v3/` (WebP): `gezi-desktop-p*` ve
`gezi-mobile-p*` yedi durak (1440 × 900 ve 390 × 844, HIGH), `reduced-*`
hareket azaltılmış, `nogl-*` WebGL'siz tam sayfa, `work-*` proje sayfası
(WebGL ve WebGL'siz), `low-mobile-*` LOW kademe, `en-*` İngilizce.

Bilinen sınırlar:

- SwiftShader'da krom düz gri okunur; gerçek GPU'da env yansımaları ile
  krom. Ekran görüntüleri bu yüzden kromu olduğundan mat gösterir.
- Sahne yolunun Lighthouse puanı yalnızca yazılım WebGL'de ölçülebildi;
  gerçek bir GPU'da 3B parçası ilk boyamadan sonra boşta iner, shader'lar
  asenkron derlenir, enstalasyonlar yolda kurulur, ama bunun sayısı bu
  makinede alınamaz. Düşük cihazlar `low` kademesine iner (post yok, DPR
  1, 900 parçacık, yansıma yok); yazılım çiziciler ve kademe 0 sahneyi hiç
  almaz.
- `low-mobile-*` ekran görüntüleri `?gl=1&tier=low` ile alındı; koruma
  olmasa bu konteyner zaten 2B geziyi alır.
- Örnek işler kurgudur ve sitede "örnek proje" diye yazar; gerçek müşteri,
  ödül ya da başarı yazılmadı. E-posta ve sosyal hesaplar boş: site "yakında"
  der, uydurmaz.
- Ses yok (otomatik çalan ses koymama kararı; ambient altyapı eklenmedi).
- Env (küp render target) durak değişiminde yeniden çizilir; tek hedef,
  ayırma yok.
