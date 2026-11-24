# پرامپت‌های تولید تصویر دانشگاه‌ها

این فایل برای تولید تصویر **لوگو** و **هیرو پردیس** هر دانشگاه موجود در داده‌های mock پروژه است (`src/data/universities.ts`).

## نکات کلی قبل از تولید

- پرامپت‌ها به **انگلیسی** نوشته شده‌اند (نتیجه بهتری روی اکثر مدل‌های تصویر می‌دهند).
- نسبت تصویر پیشنهادی: **۱۶:۹** برای هیرو پردیس، **۱:۱** برای لوگو/مارک.
- در تصویر هیرو **متن، نام دانشگاه، لوگو یا واترمارک** نگذارید (مدل‌ها در خوانایی متن ضعیف‌اند).
- تصاویر الهام‌گرفته از معماری/جغرافیای منطقه هستند؛ **ادعای وابستگی رسمی یا استفاده از علامت تجاری واقعی** نکنید.
- چهره نزدیک افراد ترجیحاً نباشد؛ دانشجویان دور در منظره OK است.
- مسیرهای فعلی لوگو در دیتا: `/images/logos/{slug}.svg` (فعلاً placeholder ساده SVG). پس از تولید PNG/WebP می‌توانید فایل را جایگزین کرده و پسوند را در دیتا به‌روز کنید.
- فیلد هیرو برای دانشگاه در تایپ فعلی نیست؛ مسیر پیشنهادی هیرو: `/images/universities/{slug}-hero.jpg` (پوشه را در صورت نیاز بسازید).

**تعداد دانشگاه‌های پوشش‌داده‌شده: ۱۶**

---

## آلمان — Germany (`germany`)

### 1. دانشگاه فنی مونیخ — Technical University of Munich

| فیلد | مقدار |
|------|--------|
| slug | `tu-munich` |
| لوگو (فعلی) | `/images/logos/tu-munich.svg` |
| هیرو (پیشنهادی) | `/images/universities/tu-munich-hero.jpg` |

**یادداشت فارسی:** پردیس فنی مدرن در فضای باواریایی مونیخ؛ نمای مهندسی و شیشه‌ای.

**Campus / building hero (16:9)**

```
Photorealistic architectural photography of a modern technical university campus in Munich, Bavaria, Germany. Wide 16:9 view of contemporary glass-and-concrete research buildings with clean geometric facades, tree-lined walkways, soft autumn daylight, distant Alps-like haze on the horizon, quiet courtyards, no readable text, no logos, no watermarks, no close-up faces, distant students as tiny silhouettes only, professional editorial style, high detail, natural color grading.
```

**Logo / mark (1:1) — اختیاری (جایگزین SVG placeholder)**

```
Minimal flat vector-style university emblem, 1:1 square, abstract geometric crest suggesting engineering and technology, deep navy and white palette, simple concentric shapes and a subtle angular motif, centered on solid soft off-white background, no text, no letters, no watermarks, clean brand mark, high contrast, print-ready look.
```

---

### 2. دانشگاه هایدلبرگ — Heidelberg University

| فیلد | مقدار |
|------|--------|
| slug | `heidelberg` |
| لوگو (فعلی) | `/images/logos/heidelberg.svg` |
| هیرو (پیشنهادی) | `/images/universities/heidelberg-hero.jpg` |

**یادداشت فارسی:** حس دانشگاه تاریخی کنار رودخانه و تپه‌های هایدلبرگ؛ سنگ‌کاری کلاسیک آلمانی.

**Campus / building hero (16:9)**

```
Photorealistic wide 16:9 photograph of a historic European university campus inspired by Heidelberg, Germany. Sandstone classical academic buildings with red-tiled roofs, cobblestone paths, mature trees, soft morning light, Neckar-valley riverside atmosphere in the soft distance, scholarly and timeless mood, no readable signage, no logos, no watermarks, no close-up people, optional distant walking figures only, architectural photography, natural colors.
```

**Logo / mark (1:1)**

```
Minimal 1:1 university crest mark, classic scholarly shield silhouette in deep burgundy and cream, simple laurel or open-book abstract shapes without any letters, flat vector style, solid light background, no text, no watermarks, elegant academic brand icon.
```

---

## کانادا — Canada (`canada`)

### 3. دانشگاه تورنتو — University of Toronto

| فیلد | مقدار |
|------|--------|
| slug | `university-of-toronto` |
| لوگو (فعلی) | `/images/logos/university-of-toronto.svg` |
| هیرو (پیشنهادی) | `/images/universities/university-of-toronto-hero.jpg` |

**یادداشت فارسی:** پردیس شهری کانادایی با معماری گوتیک‌نو و فضای پاییزی تورنتو.

**Campus / building hero (16:9)**

```
Photorealistic 16:9 campus hero of a major urban Canadian university inspired by downtown Toronto. Neo-Gothic stone academic buildings with pointed arches and ivy, autumn maple leaves, soft overcast northern light, city skyline softly blurred in the far background, wide plaza and pathways, scholarly atmosphere, no readable text, no logos, no watermarks, no close-up faces, distant students only, editorial architectural photography.
```

**Logo / mark (1:1)**

```
Clean 1:1 minimal university mark, abstract maple-leaf-inspired geometric emblem combined with a simple open-book silhouette, deep blue and white, flat vector, centered, no letters, no text, no watermarks, solid light gray background.
```

---

### 4. دانشگاه بریتیش کلمبیا — University of British Columbia

| فیلد | مقدار |
|------|--------|
| slug | `ubc` |
| لوگو (فعلی) | `/images/logos/ubc.svg` |
| هیرو (پیشنهادی) | `/images/universities/ubc-hero.jpg` |

**یادداشت فارسی:** پردیس ساحلی ونکوور با جنگل همیشه‌سبز و کوه در دوردست.

**Campus / building hero (16:9)**

```
Photorealistic 16:9 wide view of a Pacific Northwest university campus inspired by Vancouver, Canada. Modern low-rise academic buildings nestled among tall evergreen trees, ocean horizon and soft mountain silhouette in the distance, crisp clear daylight, glass atriums and wooden accents, open lawns, calm coastal climate feel, no readable text, no logos, no watermarks, no close-up faces, tiny distant figures optional, nature-forward architectural photography.
```

**Logo / mark (1:1)**

```
Minimal 1:1 abstract university emblem suggesting mountains and ocean waves in teal and navy, geometric and modern, flat vector brand mark, no text, no letters, no watermarks, centered on white background.
```

---

## ایتالیا — Italy (`italy`)

### 5. دانشگاه بوکنی — Bocconi University

| فیلد | مقدار |
|------|--------|
| slug | `bocconi` |
| لوگو (فعلی) | `/images/logos/bocconi.svg` |
| هیرو (پیشنهادی) | `/images/universities/bocconi-hero.jpg` |

**یادداشت فارسی:** معماری معاصر میلانی برای دانشگاه کسب‌وکار؛ شیشه، بتن و حس شهری شیک.

**Campus / building hero (16:9)**

```
Photorealistic 16:9 architectural photo of a contemporary business-school campus in Milan, Italy. Sleek modern glass-and-stone academic complex, clean Italian urban design, sunny Mediterranean light, tree-lined boulevard, polished plaza reflections, sophisticated European city atmosphere, no readable text, no logos, no watermarks, no close-up faces, distant pedestrians only, high-end architectural magazine style.
```

**Logo / mark (1:1)**

```
Minimal 1:1 geometric university mark for a business school, abstract interlocking rectangles suggesting finance and structure, charcoal and warm ivory, flat vector, no text, no letters, no watermarks, centered on soft cream background.
```

---

### 6. دانشگاه ساپینزا رم — Sapienza University of Rome

| فیلد | مقدار |
|------|--------|
| slug | `sapienza` |
| لوگو (فعلی) | `/images/logos/sapienza.svg` |
| هیرو (پیشنهادی) | `/images/universities/sapienza-hero.jpg` |

**یادداشت فارسی:** پردیس بزرگ رمی با حس کلاسیک ایتالیایی و آسمان مدیترانه‌ای.

**Campus / building hero (16:9)**

```
Photorealistic 16:9 photograph of a grand historic university campus inspired by Rome, Italy. Large classical academic façades with columns and ochre stone, Mediterranean cypress trees, warm golden afternoon light, wide open courtyards, subtle Roman city atmosphere without famous landmarks, scholarly European mood, no readable inscriptions, no logos, no watermarks, no close-up faces, distant students as tiny figures, architectural photography.
```

**Logo / mark (1:1)**

```
Minimal 1:1 classical university seal silhouette, simple column or laurel wreath abstract shapes in deep terracotta and ivory, flat vector, no letters, no text, no watermarks, centered on light background.
```

---

## ترکیه — Turkey (`turkey`)

### 7. دانشگاه بغازیچی — Boğaziçi University

| فیلد | مقدار |
|------|--------|
| slug | `bogazici-university` |
| لوگو (فعلی) | `/images/logos/bogazici.svg` |
| هیرو (پیشنهادی) | `/images/universities/bogazici-university-hero.jpg` |

**یادداشت فارسی:** پردیس روی تپه روبه‌روی تنگه؛ حس استانبولی و معماری عثمانی‌مدرن.

**Campus / building hero (16:9)**

```
Photorealistic 16:9 campus vista inspired by a hillside university overlooking the Bosphorus in Istanbul, Turkey. Historic campus buildings with terracotta roofs among pine trees, sparkling blue strait water in the soft distance, ferry silhouettes far away, warm late-afternoon light, Mediterranean-meets-Black-Sea atmosphere, no famous branded landmarks, no readable text, no logos, no watermarks, no close-up faces, distant tiny figures OK, cinematic landscape photography.
```

**Logo / mark (1:1)**

```
Minimal 1:1 abstract university mark suggesting a bridge curve over water and a simple academic torch shape, navy and soft gold, flat vector, no text, no letters, no watermarks, centered on white background.
```

---

### 8. دانشگاه فنی خاورمیانه — Middle East Technical University

| فیلد | مقدار |
|------|--------|
| slug | `metu` |
| لوگو (فعلی) | `/images/logos/metu.svg` |
| هیرو (پیشنهادی) | `/images/universities/metu-hero.jpg` |

**یادداشت فارسی:** پردیس فنی گسترده در آنکارا؛ ساختمان‌های مدرن روی تپه با فضای نیمه‌خشک آناتولی.

**Campus / building hero (16:9)**

```
Photorealistic 16:9 view of a large technical university campus on a plateau inspired by Ankara, Turkey. Mid-century modern concrete academic blocks, wide green lawns, clear Anatolian sky, dry-climate trees and shrubs, bright midday sun with crisp shadows, engineering-campus atmosphere, no readable text, no logos, no watermarks, no close-up faces, distant students optional, documentary architectural style.
```

**Logo / mark (1:1)**

```
Minimal 1:1 geometric tech-university emblem, abstract atom or gear-inspired shapes simplified into a clean crest, red and dark charcoal, flat vector, no text, no letters, no watermarks, solid light background.
```

---

## مجارستان — Hungary (`hungary`)

### 9. دانشگاه اوتووش لوراند — Eötvös Loránd University (ELTE)

| فیلد | مقدار |
|------|--------|
| slug | `elte` |
| لوگو (فعلی) | `/images/logos/elte.svg` |
| هیرو (پیشنهادی) | `/images/universities/elte-hero.jpg` |

**یادداشت فارسی:** ساختمان دانشگاهی کنار دانوب در بوداپست؛ نمای تاریخی اروپای مرکزی.

**Campus / building hero (16:9)**

```
Photorealistic 16:9 photograph of a historic Central European university façade inspired by Budapest, Hungary. Elegant 19th-century academic building along a wide river promenade, ornate stone details, soft cloudy Danube-basin light, autumn trees, scholarly urban campus mood, no readable signs, no logos, no watermarks, no close-up faces, distant pedestrians only, architectural travel photography.
```

**Logo / mark (1:1)**

```
Minimal 1:1 academic crest mark with abstract book and star motifs, deep blue and silver-gray, flat vector, no letters, no text, no watermarks, centered on pale background.
```

---

### 10. دانشگاه دبرسن — University of Debrecen

| فیلد | مقدار |
|------|--------|
| slug | `university-of-debrecen` |
| لوگو (فعلی) | `/images/logos/university-of-debrecen.svg` |
| هیرو (پیشنهادی) | `/images/universities/university-of-debrecen-hero.jpg` |

**یادداشت فارسی:** پردیس دانشگاهی مجارستانی با حس پزشکی/علمی و فضای سبز استانی.

**Campus / building hero (16:9)**

```
Photorealistic 16:9 campus scene inspired by a large university in Debrecen, eastern Hungary. Mix of historic main building with a dome-like silhouette and modern medical-science wings, leafy park campus, gentle Central European daylight, calm academic atmosphere suited to medicine and engineering, no readable text, no logos, no watermarks, no close-up faces, distant figures only, clean architectural photography.
```

**Logo / mark (1:1)**

```
Minimal 1:1 university mark combining a simple medical staff abstract curve with a geometric shield, forest green and cream, flat vector, no text, no letters, no watermarks, centered on white.
```

---

## مالزی — Malaysia (`malaysia`)

### 11. دانشگاه مالایا — University of Malaya

| فیلد | مقدار |
|------|--------|
| slug | `university-of-malaya` |
| لوگو (فعلی) | `/images/logos/university-of-malaya.svg` |
| هیرو (پیشنهادی) | `/images/universities/university-of-malaya-hero.jpg` |

**یادداشت فارسی:** پردیس گرمسیری کوالالامپور با گیاهان سرسبز و معماری استعماری‌مدرن.

**Campus / building hero (16:9)**

```
Photorealistic 16:9 tropical university campus inspired by Kuala Lumpur, Malaysia. Lush green lawns, palm and rainforest trees, mix of colonial-era academic halls and modern twin-tower-style research buildings, humid bright daylight with soft haze, Southeast Asian scholarly atmosphere, city skyline softly distant, no readable text, no logos, no watermarks, no close-up faces, tiny distant students OK, vibrant natural color, architectural photography.
```

**Logo / mark (1:1)**

```
Minimal 1:1 abstract university emblem with a simple tiger-stripe geometric hint and open-book shape, deep blue and gold accents, flat vector, no text, no letters, no watermarks, centered on light background.
```

---

### 12. دانشگاه تکنولوژی مالزی — Universiti Teknologi Malaysia

| فیلد | مقدار |
|------|--------|
| slug | `utm` |
| لوگو (فعلی) | `/images/logos/utm.svg` |
| هیرو (پیشنهادی) | `/images/universities/utm-hero.jpg` |

**یادداشت فارسی:** پردیس مهندسی مدرن در جوهور؛ حس فناوری و فضای نیمه‌گرمسیری.

**Campus / building hero (16:9)**

```
Photorealistic 16:9 technical university campus inspired by Johor Bahru, Malaysia. Modern engineering faculty buildings with blue glass façades, wide courtyards, tropical landscaping, bright equatorial sunlight, innovation-campus feel, soft green hills in the background, no readable text, no logos, no watermarks, no close-up faces, distant students only, clean contemporary architectural photography.
```

**Logo / mark (1:1)**

```
Minimal 1:1 tech-university brand mark, abstract circuit-node hexagon or gear silhouette simplified, navy and cyan, flat vector, no text, no letters, no watermarks, white background.
```

---

## استرالیا — Australia (`australia`)

### 13. دانشگاه ملبورن — University of Melbourne

| فیلد | مقدار |
|------|--------|
| slug | `university-of-melbourne` |
| لوگو (فعلی) | `/images/logos/university-of-melbourne.svg` |
| هیرو (پیشنهادی) | `/images/universities/university-of-melbourne-hero.jpg` |

**یادداشت فارسی:** پردیس ویکتوریایی ملبورن با سنگ‌کاری کلاسیک و نور جنوبی ملایم.

**Campus / building hero (16:9)**

```
Photorealistic 16:9 university campus photo inspired by Melbourne, Australia. Victorian-era sandstone academic buildings with arched cloisters, manicured lawns and mature eucalyptus trees, soft southern-hemisphere daylight, scholarly parkland campus, calm blue sky with light clouds, no readable text, no logos, no watermarks, no close-up faces, distant students as small figures, high-quality architectural photography.
```

**Logo / mark (1:1)**

```
Minimal 1:1 classical university crest abstract, simple torch and wreath geometry without letters, deep blue and gold, flat vector, no text, no watermarks, centered on off-white background.
```

---

### 14. دانشگاه نیوساوت‌ولز — UNSW Sydney

| فیلد | مقدار |
|------|--------|
| slug | `unsw` |
| لوگو (فعلی) | `/images/logos/unsw.svg` |
| هیرو (پیشنهادی) | `/images/universities/unsw-hero.jpg` |

**یادداشت فارسی:** پردیس تحقیقاتی مدرن سیدنی؛ شیشه، فضای باز و حس ساحلی شهری.

**Campus / building hero (16:9)**

```
Photorealistic 16:9 research university campus inspired by Sydney, Australia. Contemporary glass academic towers and open plazas, bright Australian sunlight, blue sky, subtle coastal breeze feel with distant harbor mist (no famous landmarks), modern landscaping and outdoor seating areas, innovative campus mood, no readable text, no logos, no watermarks, no close-up faces, distant figures only, crisp architectural photography.
```

**Logo / mark (1:1)**

```
Minimal 1:1 modern university mark, bold abstract yellow-black geometric diamond or chevron motif without letters, flat vector, high contrast, no text, no watermarks, white background.
```

---

## هلند — Netherlands (`netherlands`)

### 15. دانشگاه صنعتی دلفت — Delft University of Technology

| فیلد | مقدار |
|------|--------|
| slug | `delft` |
| لوگو (فعلی) | `/images/logos/delft.svg` |
| هیرو (پیشنهادی) | `/images/universities/delft-hero.jpg` |

**یادداشت فارسی:** پردیس مهندسی هلندی با معماری آجری و کانال؛ حس دلفت و فناوری.

**Campus / building hero (16:9)**

```
Photorealistic 16:9 technical university campus inspired by Delft, Netherlands. Mix of historic Dutch brick academic buildings and bold modern engineering halls, flat northern European light, bicycles parked along canal-side paths, green lawns, innovative architecture campus, cloudy soft daylight typical of the Low Countries, no readable text, no logos, no watermarks, no close-up faces, distant cyclists as tiny silhouettes OK, architectural photography.
```

**Logo / mark (1:1)**

```
Minimal 1:1 tech university emblem, abstract windmill-blade or hexahedral geometric mark in cyan and black, flat vector, no text, no letters, no watermarks, centered on white.
```

---

### 16. دانشگاه آمستردام — University of Amsterdam

| فیلد | مقدار |
|------|--------|
| slug | `amsterdam` |
| لوگو (فعلی) | `/images/logos/amsterdam.svg` |
| هیرو (پیشنهادی) | `/images/universities/amsterdam-hero.jpg` |

**یادداشت فارسی:** ساختمان دانشگاهی کنار کانال آمستردام؛ آجر قرمز هلندی و حس شهری آکادمیک.

**Campus / building hero (16:9)**

```
Photorealistic 16:9 urban university campus scene inspired by Amsterdam, Netherlands. Tall historic Dutch brick academic buildings along a canal with arched bridges, bicycles, soft diffused daylight, reflective water, scholarly European city campus atmosphere, no famous tourist branding, no readable text, no logos, no watermarks, no close-up faces, distant pedestrians only, atmospheric architectural photography.
```

**Logo / mark (1:1)**

```
Minimal 1:1 university mark with abstract canal-bridge arch and open-book geometry, red and charcoal, flat vector, no text, no letters, no watermarks, light gray background.
```

---

## چک‌لیست بعد از تولید

1. هیروها را در `public/images/universities/` ذخیره کنید (مثلاً `tu-munich-hero.jpg`).
2. لوگوها را به‌جای SVGهای فعلی در `public/images/logos/` بگذارید، یا پسوند را در `src/data/universities.ts` به‌روز کنید.
3. اگر فیلد هیرو به تایپ `University` اضافه شد، مسیرهای پیشنهادی همین فایل را استفاده کنید.
4. تصاویر را برای وب فشرده کنید (WebP ترجیحاً برای هیرو).
