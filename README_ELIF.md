# Elif için: siteyi nasıl güncellersin

Bu site senin. Kod bilmene gerek yok; aşağıdaki her şey klasörlere dosya
koymak ve birkaç satır metin değiştirmekten ibaret. Her değişiklikten sonra
siteyi yayınlamak için en alttaki "Yayınlama" bölümüne bak.

Site yedi duraklı bir gezi: 01 Renk (giriş), 02 Tipografi, 03 Marka,
04 Afiş, 05 Dijital Sanat, 06 Elif (hakkında), 07 İletişim. İşlerin 02–05
duraklarında uzayda duran nesneler olarak görünür; her birine tıklanınca
kendi sayfası açılır.

## 1. Yeni bir iş eklemek

1. `content/works/` klasörünün içine yeni bir klasör aç. Klasörün adı, işin
   adresinde görünecek: örneğin `content/works/lale-festivali` →
   `elifgezgin.com/isler/lale-festivali`. Sadece küçük harf, rakam ve tire
   kullan (Türkçe karakter ve boşluk kullanma).
2. İşin ana görselini o klasöre **`cover.jpg`** adıyla koy (PNG de olur;
   o zaman aşağıda `"cover": "cover.png"` yaz). Kare, dikey ya da yatay
   olabilir. Uzun kenar en az 1600 piksel olsun; büyük dosyalar sorun değil,
   site kendi küçültür.
3. İstersen galeri görselleri ekle: `01.jpg`, `02.jpg`, `03.jpg` …
4. Aynı klasöre **`meta.json`** adında bir dosya koy ve şunu yapıştırıp
   doldur:

```json
{
  "title": { "tr": "Lale Festivali", "en": "Tulip Festival" },
  "category": "poster",
  "year": 2026,
  "role": { "tr": "Konsept ve tasarım", "en": "Concept and design" },
  "tools": ["Illustrator", "InDesign"],
  "text": {
    "tr": "İki üç cümleyle işin hikâyesi: neydi, ne yaptın, ne oldu.",
    "en": "The story of the work in two or three sentences."
  },
  "colors": ["#ff2e88", "#19e3ff", "#07060f"],
  "process": [
    { "title": { "tr": "Fikir", "en": "Idea" }, "text": { "tr": "Bir cümle.", "en": "One sentence." } },
    { "title": { "tr": "Sistem", "en": "System" }, "text": { "tr": "Bir cümle.", "en": "One sentence." } }
  ],
  "sample": false,
  "cover": "cover.jpg",
  "gallery": ["01.jpg", "02.jpg"]
}
```

- **category** şu altısından biri olmalı; işin hangi durakta ve nasıl
  duracağını belirler:
  - `poster` → 04 Afiş durağı, imlece eğilen dev afiş
  - `series` → 04 Afiş durağı, parçacıklara dağılıp yeniden toplanan seri
    (kapak + galerideki ilk iki görsel sırayla gösterilir)
  - `typography` → 02 Tipografi durağı, krom 3B harfler (başlık kısa olsun)
  - `identity` → 03 Marka durağı, cam küp içinde kimlik levhaları
    (kapak + galerideki ilk iki görsel)
  - `digital` → 05 Dijital Sanat durağı, sıvı heykel üzerine projeksiyon
  - `editorial` → 05 Dijital Sanat durağı, uzayda açılan dergi forması
    (kapak sol sayfa, galerinin ilk görseli sağ sayfa)
- **colors** proje sayfasının renkleri (iki ya da üç tane). Satırı silersen
  renkler kapaktan kendiliğinden alınır.
- **process** süreç adımları; proje sayfasında numaralı liste olarak
  görünür. İstemiyorsan `"process": []` yaz.
- **client** diye bir satır ekleyebilirsin (`"client": "…"`) ama yalnızca
  gerçek bir müşteri varsa.
- **sample** her zaman `false` olsun; `true` sadece örnek işler içindir.
- **order** diye bir satır eklersen (`"order": 1`) işler o sıraya göre
  dizilir. Yoksa yıla göre yeniden eskiye sıralanır.

Her durakta en fazla iki iş uzayda durur (02 ve 03'te bir, 04 ve 05'te
iki). Aynı türden fazla iş eklersen hepsi İletişim durağındaki "İşler"
listesinde ve proje sayfalarının "Sonraki" bağlantısında yer alır; uzayda
yalnızca sıradaki ilk olanlar görünür. Hangisinin görüneceğini `order` ile
seçersin.

Sonra kaydet, yayınla. Başka hiçbir şey gerekmez: site klasörleri kendisi
okur ve görselleri hazırlar.

## 2. Örnek işleri kaldırmak

Adı `ornek-` ile başlayan altı klasör örnek işlerdir; sitede "Örnek proje"
etiketiyle görünürler ve proje sayfalarında bunun gerçek bir müşteri işi
olmadığı yazar. Kendi işlerini eklediğinde bu klasörleri silmen yeterli.
Sildiğin örnekler kendiliğinden geri gelmez (örnekler yalnızca
`content/works` tamamen boşken üretilir).

## 3. Bir işi düzenlemek veya silmek

- Düzenlemek: klasördeki `meta.json` metnini ya da görselleri değiştir.
- Silmek: klasörü sil.

## 4. Adını, unvanını, metinleri değiştirmek

`content/site.ts` dosyasını aç. Her satırın ne olduğu yanında yazıyor.
Tırnak içindeki metni değiştir, tırnakları koru. Örnek:

```ts
title: { tr: "Grafik Tasarımcı", en: "Graphic Designer" },
bio: {
  tr: "Buraya Türkçe metin.\n\nBoş satır için \\n\\n yaz.",
  en: "The English text here.",
},
```

- **description**: arama motorlarında ve paylaşım kartlarında görünen kısa
  açıklama.
- **tagline**: giriş durağında mesleğinin altındaki tek cümle.
- **bio**: 06 Elif durağındaki metin.
- **disciplines**: ismin etrafında uzayda dolaşan altı kelime.
- **email**: tırnak içine e-postanı yaz. Boş bırakırsan e-posta bağlantısı
  ve "Kopyala" düğmesi görünmez; yerine bir şey uydurulmaz.
- **social**: yalnızca gerçekten var olan hesaplar. Örnek:
  ```ts
  social: [
    { id: "behance", url: "https://www.behance.net/elifgezgin" },
    { id: "instagram", url: "https://www.instagram.com/elifgezgin" },
  ],
  ```
  `id` şunlardan biri olabilir: `behance`, `instagram`, `linkedin`, `dribbble`.
- **availability**: İletişim durağının son satırı.
- **url**: sitenin adresi (arama motorları ve paylaşım kartları için). Alan
  adın alındığında Vercel'de `NEXT_PUBLIC_SITE_URL` değişkenini değiştirmen
  yeterli; dosyaya dokunma.

## 5. Renkler

Her durağın kendi renkleri var (karanlık + neon, krem + kobalt + turuncu,
mor + magenta + cyan, asit yeşili + siyah, beyaz stüdyo, siyah + ultraviyole
+ lime, elektrik mavisi). Bunlar tasarımın parçası; değiştirmek istersen
`src/lib/stops.ts` dosyasındaki `palette` satırları ve `docs/GEZI.md`
bunu anlatır. Projelerin kendi renklerini ise `meta.json` içindeki
`colors` belirler.

## 6. Heykel

`public/models/` klasöründeki iki `.glb` dosyası seni temsil eden stilize
3B heykeldir (yapay zekâ ile üretildi; fotoğraf değil, site de öyle söyler).
`elif-heykel-masaustu.glb` bilgisayarda, `elif-heykel-mobil.glb` telefonda
yüklenir; ikisi de sayfa açıldıktan sonra arka planda iner. 06 Elif
durağında ismin yanında kaidesinde durur; parmakla ya da imleçle çevrilir.
Değiştirmek istersen aynı adlarla yeni dosya koy (meshopt sıkıştırmalı GLB).

## 7. Yayınlama

Site GitHub'daki `elifgezgin` deposundan Vercel'e otomatik yayınlanır.

- Bilgisayarında **GitHub Desktop** kuruluysa: değişikliklerini yap,
  GitHub Desktop'ta soldaki kutuya kısa bir açıklama yaz ("yeni iş eklendi"),
  **Commit** ve sonra **Push origin** düğmelerine bas. Birkaç dakika içinde
  site yenilenir.
- Tarayıcıdan: github.com'da depoyu aç, `content/works` klasörüne gir,
  **Add file → Upload files** ile klasörü sürükle, en altta **Commit changes**
  de.

Bir şey ters giderse hiçbir şey kaybolmaz: GitHub'daki her değişiklik geri
alınabilir. Takıldığın yerde bu dosyayı sana hediye eden arkadaşına yaz.
