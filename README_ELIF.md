# Elif için: siteyi nasıl güncellersin

Bu site senin. Kod bilmene gerek yok; aşağıdaki her şey klasörlere dosya
koymak ve birkaç satır metin değiştirmekten ibaret. Her değişiklikten sonra
siteyi yayınlamak için en alttaki "Yayınlama" bölümüne bak.

## 1. Yeni bir iş eklemek

1. `content/works/` klasörünün içine yeni bir klasör aç. Klasörün adı, işin
   adresinde görünecek: örneğin `content/works/lale-festivali` →
   `elifgezgin.com/isler/lale-festivali`. Sadece küçük harf, rakam ve tire
   kullan (Türkçe karakter ve boşluk kullanma).
2. İşin ana görselini o klasöre **`cover.jpg`** adıyla koy. Kare, dikey ya da
   yatay olabilir; site oranı otomatik alır. Uzun kenar en az 1600 piksel
   olsun; büyük dosyalar sorun değil, site kendi küçültür.
3. İstersen galeri görselleri ekle: `01.jpg`, `02.jpg`, `03.jpg` …
   Sıralama dosya adına göre.
4. Aynı klasöre **`meta.json`** adında bir dosya koy ve şunu yapıştırıp
   doldur:

```json
{
  "title": { "tr": "Lale Festivali Afişi", "en": "Tulip Festival Poster" },
  "category": "poster",
  "year": 2025,
  "role": { "tr": "Konsept ve tasarım", "en": "Concept and design" },
  "tools": ["Illustrator", "InDesign"],
  "text": {
    "tr": "İki cümleyle işin hikâyesi: neydi, ne yaptın, ne oldu.",
    "en": "The story of the work in two sentences."
  },
  "client": "İstanbul Kültür Vakfı",
  "sample": false,
  "cover": "cover.jpg",
  "gallery": ["01.jpg", "02.jpg"]
}
```

- **category** şu beşinden biri olmalı, duvardaki nesnenin şeklini belirler:
  - `poster` → raya asılı baskı
  - `editorial` → açılan kitap / dergi
  - `packaging` → dönen kutu
  - `identity` → kör kabartmalı kart (logolar için)
  - `social` → çerçevesiz ekran (sosyal medya işleri için)
- **client** satırını müşteri yoksa tamamen sil.
- **sample** her zaman `false` olsun; `true` sadece örnek işler içindir.
- **order** diye bir satır eklersen (`"order": 1`) işler o sıraya göre dizilir.
  Yoksa yıla göre yeniden eskiye sıralanır.

Sonra kaydet, yayınla. Başka hiçbir şey gerekmez: site klasörleri kendisi okur.

## 2. Örnek işleri kaldırmak

Adı `ornek-` ile başlayan altı klasör örnek işlerdir; hepsinin sağ üstünde
küçük "Örnek" etiketi görünür. Kendi işlerini eklediğinde bu klasörleri
silmen yeterli. Sildiğin örnekler bir daha kendiliğinden geri gelmez
(örnekler yalnızca `content/works` tamamen boşken üretilir).

## 3. Bir işi düzenlemek veya silmek

- Düzenlemek: klasördeki `meta.json` metnini ya da görselleri değiştir.
- Silmek: klasörü sil.

## 4. Adını, unvanını, hakkımda metnini değiştirmek

`content/site.ts` dosyasını aç. Her satırın ne olduğu yanında yazıyor.
Tırnak içindeki metni değiştir, tırnakları koru. Örnek:

```ts
title: { tr: "Grafik Tasarımcı", en: "Graphic Designer" },
bio: {
  tr: "Buraya Türkçe metin.\n\nBoş satır için \\n\\n yaz.",
  en: "The English text here.",
},
```

- **email**: tırnak içine e-postanı yaz. Boş bırakırsan "E-postayı kopyala"
  düğmesi ve iletişim formu görünmez (uydurma bir adres asla gösterilmez).
- **social**: yalnızca gerçekten var olan hesaplar. Örnek:
  ```ts
  social: [
    { id: "behance", url: "https://www.behance.net/elifgezgin" },
    { id: "instagram", url: "https://www.instagram.com/elifgezgin" },
  ],
  ```
  `id` şunlardan biri olabilir: `behance`, `instagram`, `linkedin`, `dribbble`.
- **skills**: beceriler listesi. Her becerinin `name` (adı) ve `description`
  (bir cümlelik açıklama) var. İstersen `level: { tr: "İleri", en: "Advanced" }`
  ekleyebilirsin; yoksa seviye hiç gösterilmez, yüzde ya da çubuk yoktur.
- **tools**: kullandığın programlar, virgülle ayrılmış.
- **process**: süreç adımları; katlanan sayfadaki altı panel.
- **availability**: sitenin son cümlesi.
- **url**: sitenin adresi (arama motorları için).

## 5. Rengi değiştirmek

Sitede tek bir vurgu rengi var: başlığın altındaki çizgi, ray, kartelanın
tonları, kartvizit. `content/site.ts` içinde:

```ts
spotColor: "#1F4BFF",
```

Tırnak içine istediğin rengin kodunu yaz (ör. `#C8102E`). Kod, her tasarım
programının renk panelinde "Hex" olarak görünür.

## 6. Fotoğrafını koymak

`content/` klasörüne **`portrait.jpg`** adında bir fotoğraf koy (dikey,
en az 1200 piksel). Hakkımda bölümünde basılı bir fotoğraf gibi, noktalı
baskıyla görünür. Fotoğraf yoksa yerinde tipografik monogram durur.

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
