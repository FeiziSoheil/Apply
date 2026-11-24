import type { Country } from "@/types";
import { countrySectionsBySlug } from "./country-sections";

/** Mock countries — import only from services */
export const countries: Country[] = [
  {
    id: "country-germany",
    slug: "germany",
    nameFa: "آلمان",
    nameEn: "Germany",
    continent: "europe",
    costBand: "medium",
    flagEmoji: "🇩🇪",
    heroImage: "/images/heroes/germany.jpg",
    summary:
      "آلمان با دانشگاه‌های دولتی کم‌هزینه، اقتصاد قوی و امکان کار حین تحصیل، یکی از محبوب‌ترین مقاصد دانشجویان ایرانی است.",
    benefits: [
      "شهریه بسیار پایین یا رایگان در دانشگاه‌های دولتی",
      "بازار کار قوی پس از فارغ‌التحصیلی",
      "اجازه کار دانشجویی شفاف و منظم",
      "اقامت ۱۸ ماهه برای جستجوی کار",
    ],
    language: "آلمانی / انگلیسی",
    visaDuration: "۶ تا ۱۲ هفته",
    costOfLiving: 950,
    tuitionRange: "۰–۳٬۰۰۰ یورو در سال",
    currency: "EUR",
    costBreakdown: [
      {
        id: "tuition",
        label: "شهریه سالانه",
        amount: "۰–۳٬۰۰۰ یورو",
        note: "بیشتر دانشگاه‌های دولتی فقط هزینه ترم دارند",
      },
      {
        id: "living",
        label: "هزینه زندگی ماهانه",
        amount: "حدود ۹۵۰ یورو",
        note: "شامل اجاره، خوراک و حمل‌ونقل",
      },
      {
        id: "insurance",
        label: "بیمه درمانی",
        amount: "۱۱۰–۱۴۰ یورو در ماه",
      },
      {
        id: "visa",
        label: "هزینه ویزا",
        amount: "حدود ۷۵ یورو",
      },
    ],
    requirements: [
      "مدرک تحصیلی معادل‌سازی‌شده",
      "مدرک زبان آلمانی یا انگلیسی (بسته به رشته)",
      "تمکن مالی حدود ۱۱٬۲۰۸ یورو در سال",
      "بیمه درمانی معتبر",
    ],
    popularFields: [
      "مهندسی",
      "علوم کامپیوتر",
      "مدیریت",
      "پزشکی و علوم زیستی",
    ],
    faqs: [
      {
        id: "de-faq-1",
        question: "آیا تحصیل در آلمان رایگان است؟",
        answer:
          "در بیشتر ایالت‌ها دانشگاه‌های دولتی شهریه ندارند یا فقط هزینه ترم اندک دریافت می‌کنند؛ هزینه زندگی جداگانه است.",
      },
      {
        id: "de-faq-2",
        question: "آیا بدون مدرک آلمانی می‌توان پذیرش گرفت؟",
        answer:
          "بله، بسیاری از دوره‌های کارشناسی ارشد به زبان انگلیسی ارائه می‌شوند؛ برای کارشناسی معمولاً آلمانی لازم است.",
      },
    ],
    sections: countrySectionsBySlug["germany"]!,
    seo: {
      metaTitle: "تحصیل در آلمان | پذیرش دانشگاه و ویزا",
      metaDescription: "راهنمای کامل تحصیل در آلمان برای دانشجویان ایرانی: هزینه، ویزا، کار دانشجویی و دانشگاه‌های برتر.",
    },
  },
  {
    id: "country-canada",
    slug: "canada",
    nameFa: "کانادا",
    nameEn: "Canada",
    continent: "north-america",
    costBand: "high",
    flagEmoji: "🇨🇦",
    heroImage: "/images/heroes/canada.jpg",
    summary:
      "کانادا با کیفیت بالای آموزش، مسیرهای اقامت پس از تحصیل و جامعه چندفرهنگی، مقصدی ایده‌آل برای ادامه تحصیل و آینده شغلی است.",
    benefits: [
      "مسیر روشن اقامت پس از تحصیل (PGWP)",
      "کیفیت بالای دانشگاه‌ها و زندگی",
      "جامعه چندفرهنگی و پذیرنده",
      "فرصت کار حین تحصیل تا ۲۰ ساعت در هفته",
    ],
    language: "انگلیسی / فرانسوی",
    visaDuration: "۴ تا ۱۲ هفته",
    costOfLiving: 1200,
    tuitionRange: "۱۵٬۰۰۰–۳۵٬۰۰۰ دلار کانادا در سال",
    currency: "CAD",
    costBreakdown: [
      {
        id: "tuition",
        label: "شهریه سالانه",
        amount: "۱۵٬۰۰۰–۳۵٬۰۰۰ دلار کانادا",
      },
      {
        id: "living",
        label: "هزینه زندگی ماهانه",
        amount: "حدود ۱٬۲۰۰ دلار کانادا",
      },
      {
        id: "insurance",
        label: "بیمه درمانی",
        amount: "۶۰۰–۱٬۰۰۰ دلار در سال",
        note: "بسته به استان متفاوت است",
      },
      {
        id: "visa",
        label: "هزینه Study Permit",
        amount: "حدود ۱۵۰ دلار کانادا",
      },
    ],
    requirements: [
      "پذیرش از مؤسسه دارای DLI",
      "تمکن مالی کافی برای شهریه و زندگی",
      "مدرک زبان IELTS یا معادل",
      "معاینه پزشکی در صورت نیاز",
    ],
    popularFields: ["فناوری اطلاعات", "مدیریت کسب‌وکار", "مهندسی", "پرستاری"],
    faqs: [
      {
        id: "ca-faq-1",
        question: "آیا بعد از تحصیل در کانادا می‌توان اقامت گرفت؟",
        answer:
          "بسیاری از فارغ‌التحصیلان از طریق PGWP و سپس برنامه‌های اسکیل‌ورکر استانی یا فدرال مسیر اقامت را طی می‌کنند.",
      },
      {
        id: "ca-faq-2",
        question: "حداقل نمره زبان برای کانادا چقدر است؟",
        answer:
          "بسته به دانشگاه و مقطع متفاوت است؛ معمولاً IELTS ۶٫۵ یا معادل برای کارشناسی ارشد رایج است.",
      },
    ],
    sections: countrySectionsBySlug["canada"]!,
    seo: {
      metaTitle: "تحصیل در کانادا | Study Permit و دانشگاه‌ها",
      metaDescription: "همه‌چیز درباره تحصیل در کانادا: شهریه، ویزا، کار دانشجویی و اقامت پس از تحصیل.",
    },
  },
  {
    id: "country-italy",
    slug: "italy",
    nameFa: "ایتالیا",
    nameEn: "Italy",
    continent: "europe",
    costBand: "medium",
    flagEmoji: "🇮🇹",
    heroImage: "/images/heroes/italy.jpg",
    summary:
      "ایتالیا با شهریه نسبتاً پایین دانشگاه‌های دولتی، بورسیه‌های منطقه‌ای و برنامه‌های انگلیسی‌زبان، گزینه جذابی برای اروپا است.",
    benefits: [
      "بورسیه منطقه‌ای DSU برای دانشجویان واجد شرایط",
      "شهریه مناسب دانشگاه‌های دولتی",
      "برنامه‌های انگلیسی‌زبان در مقاطع مختلف",
      "زندگی فرهنگی غنی و موقعیت مرکزی در اروپا",
    ],
    language: "ایتالیایی / انگلیسی",
    visaDuration: "۴ تا ۸ هفته",
    costOfLiving: 850,
    tuitionRange: "۵۰۰–۴٬۰۰۰ یورو در سال",
    currency: "EUR",
    costBreakdown: [
      {
        id: "tuition",
        label: "شهریه سالانه",
        amount: "۵۰۰–۴٬۰۰۰ یورو",
        note: "بورسیه DSU می‌تواند شهریه را کاهش دهد",
      },
      {
        id: "living",
        label: "هزینه زندگی ماهانه",
        amount: "حدود ۸۵۰ یورو",
      },
      {
        id: "insurance",
        label: "بیمه درمانی",
        amount: "حدود ۱۵۰ یورو در سال",
      },
      {
        id: "visa",
        label: "هزینه ویزا",
        amount: "حدود ۵۰ یورو",
      },
    ],
    requirements: [
      "دیپلم و ریزنمرات ترجمه‌شده",
      "مدرک زبان (ایتالیایی یا انگلیسی)",
      "تمکن مالی و بیمه درمانی",
      "پیش‌ثبت‌نام از طریق دانشگاه یا Universitaly",
    ],
    popularFields: ["طراحی و مد", "معماری", "مهندسی", "اقتصاد"],
    faqs: [
      {
        id: "it-faq-1",
        question: "بورسیه DSU چیست؟",
        answer:
          "کمک‌هزینه منطقه‌ای برای دانشجویان کم‌برخوردار که می‌تواند شهریه، خوابگاه و هزینه زندگی را پوشش دهد.",
      },
    ],
    sections: countrySectionsBySlug["italy"]!,
    seo: {
      metaTitle: "تحصیل در ایتالیا | بورسیه و پذیرش",
      metaDescription: "راهنمای تحصیل در ایتالیا برای ایرانیان: هزینه، بورسیه DSU، ویزا و رشته‌های محبوب.",
    },
  },
  {
    id: "country-turkey",
    slug: "turkey",
    nameFa: "ترکیه",
    nameEn: "Turkey",
    continent: "asia",
    costBand: "low",
    flagEmoji: "🇹🇷",
    heroImage: "/images/heroes/turkey.jpg",
    summary:
      "ترکیه با فاصله جغرافیایی کم، هزینه مناسب و دانشگاه‌های معتبر دولتی و خصوصی، گزینه‌ای مقرون‌به‌صرفه برای شروع مسیر بین‌المللی است.",
    benefits: [
      "نزدیکی جغرافیایی و هزینه سفر پایین",
      "شهریه و زندگی مقرون‌به‌صرفه",
      "دوره‌های انگلیسی در دانشگاه‌های برتر",
      "فرآیند پذیرش نسبتاً ساده‌تر",
    ],
    language: "ترکی / انگلیسی",
    visaDuration: "۲ تا ۶ هفته",
    costOfLiving: 18000,
    tuitionRange: "۱۵٬۰۰۰–۲۶۵٬۰۰۰ لیر ترکیه در سال",
    currency: "TRY",
    costBreakdown: [
      {
        id: "tuition",
        label: "شهریه سالانه",
        amount: "۱۵٬۰۰۰–۲۶۵٬۰۰۰ لیر ترکیه",
      },
      {
        id: "living",
        label: "هزینه زندگی ماهانه",
        amount: "حدود ۱۸٬۰۰۰ لیر ترکیه",
      },
      {
        id: "insurance",
        label: "بیمه درمانی",
        amount: "۳٬۰۰۰–۱۰٬۰۰۰ لیر ترکیه در سال",
      },
      {
        id: "visa",
        label: "هزینه ویزا",
        amount: "حدود ۱٬۵۰۰–۳٬۰۰۰ لیر ترکیه",
      },
    ],
    requirements: [
      "دیپلم و ریزنمرات",
      "آزمون زبان یا دوره آمادگی",
      "تمکن مالی متناسب با شهریه",
      "بیمه درمانی دانشجویی",
    ],
    popularFields: ["پزشکی", "مهندسی", "روابط بین‌الملل", "بازرگانی"],
    faqs: [
      {
        id: "tr-faq-1",
        question: "آیا دوره‌های انگلیسی در ترکیه زیاد است؟",
        answer:
          "بله، به‌ویژه در دانشگاه‌های دولتی برتر و بسیاری از دانشگاه‌های خصوصی برنامه‌های انگلیسی ارائه می‌شود.",
      },
    ],
    sections: countrySectionsBySlug["turkey"]!,
    seo: {
      metaTitle: "تحصیل در ترکیه | هزینه و پذیرش",
      metaDescription: "تحصیل مقرون‌به‌صرفه در ترکیه: دانشگاه‌های برتر، شهریه، ویزا و شرایط پذیرش.",
    },
  },
  {
    id: "country-hungary",
    slug: "hungary",
    nameFa: "مجارستان",
    nameEn: "Hungary",
    continent: "europe",
    costBand: "medium",
    flagEmoji: "🇭🇺",
    heroImage: "/images/heroes/hungary.jpg",
    summary:
      "مجارستان با برنامه‌های پزشکی و مهندسی انگلیسی‌زبان، هزینه زندگی متوسط و موقعیت مرکزی در اروپا شناخته می‌شود.",
    benefits: [
      "برنامه‌های پزشکی و دندان‌پزشکی انگلیسی‌زبان",
      "بورسیه Stipendium Hungaricum",
      "هزینه زندگی مناسب‌تر نسبت به اروپای غربی",
      "موقعیت مرکزی برای سفر در شنگن",
    ],
    language: "انگلیسی / مجاری",
    visaDuration: "۴ تا ۱۰ هفته",
    costOfLiving: 280000,
    tuitionRange: "۱٬۶۰۰٬۰۰۰–۶٬۴۰۰٬۰۰۰ فورینت مجارستان در سال",
    currency: "HUF",
    costBreakdown: [
      {
        id: "tuition",
        label: "شهریه سالانه",
        amount: "۱٬۶۰۰٬۰۰۰–۶٬۴۰۰٬۰۰۰ فورینت مجارستان",
        note: "رشته‌های پزشکی در بازه بالاتر قرار می‌گیرند",
      },
      {
        id: "living",
        label: "هزینه زندگی ماهانه",
        amount: "حدود ۲۸۰٬۰۰۰ فورینت مجارستان",
      },
      {
        id: "insurance",
        label: "بیمه درمانی",
        amount: "حدود ۴۰٬۰۰۰–۶۰٬۰۰۰ فورینت مجارستان در سال",
      },
      {
        id: "visa",
        label: "هزینه ویزا",
        amount: "حدود ۲۴٬۰۰۰ فورینت مجارستان",
      },
    ],
    requirements: [
      "مدارک تحصیلی ترجمه‌شده",
      "مدرک زبان انگلیسی",
      "تمکن مالی و بیمه",
      "مصاحبه یا آزمون ورودی برای برخی رشته‌ها",
    ],
    popularFields: ["پزشکی", "دندان‌پزشکی", "مهندسی", "علوم کامپیوتر"],
    faqs: [
      {
        id: "hu-faq-1",
        question: "بورسیه Stipendium Hungaricum چیست؟",
        answer:
          "بورسیه دولتی مجارستان که شهریه، کمک‌هزینه ماهانه و گاهی خوابگاه را پوشش می‌دهد و رقابتی است.",
      },
    ],
    sections: countrySectionsBySlug["hungary"]!,
    seo: {
      metaTitle: "تحصیل در مجارستان | پزشکی و مهندسی",
      metaDescription: "راهنمای تحصیل در مجارستان: شهریه، ویزای شنگن، بورسیه و رشته‌های انگلیسی‌زبان.",
    },
  },
  {
    id: "country-malaysia",
    slug: "malaysia",
    nameFa: "مالزی",
    nameEn: "Malaysia",
    continent: "asia",
    costBand: "low",
    flagEmoji: "🇲🇾",
    heroImage: "/images/heroes/malaysia.jpg",
    summary:
      "مالزی با شهریه و هزینه زندگی مناسب، پردیس‌های بین‌المللی و آب‌وهوای گرم، مقصدی محبوب در آسیای جنوب‌شرقی است.",
    benefits: [
      "هزینه تحصیل و زندگی پایین",
      "پردیس‌های بین‌المللی دانشگاه‌های معتبر",
      "محیط انگلیسی‌زبان در بسیاری از دانشگاه‌ها",
      "فرآیند پذیرش نسبتاً سریع",
    ],
    language: "انگلیسی / مالایی",
    visaDuration: "۲ تا ۸ هفته",
    costOfLiving: 2250,
    tuitionRange: "۱۳٬۵۰۰–۵۴٬۰۰۰ رینگیت مالزی در سال",
    currency: "MYR",
    costBreakdown: [
      {
        id: "tuition",
        label: "شهریه سالانه",
        amount: "۱۳٬۵۰۰–۵۴٬۰۰۰ رینگیت مالزی",
      },
      {
        id: "living",
        label: "هزینه زندگی ماهانه",
        amount: "حدود ۲٬۲۵۰ رینگیت مالزی",
      },
      {
        id: "insurance",
        label: "بیمه درمانی",
        amount: "۴۵۰–۱٬۱۲۵ رینگیت مالزی در سال",
      },
      {
        id: "visa",
        label: "هزینه Student Pass",
        amount: "حدود ۲۷۰–۵۴۰ رینگیت مالزی",
      },
    ],
    requirements: [
      "مدارک تحصیلی و ترجمه انگلیسی",
      "مدرک زبان یا آزمون داخلی دانشگاه",
      "گواهی سلامت",
      "تمکن مالی",
    ],
    popularFields: ["مهندسی", "فناوری اطلاعات", "مهمان‌داری", "بازرگانی"],
    faqs: [
      {
        id: "my-faq-1",
        question: "آیا مدرک دانشگاه‌های مالزی معتبر است؟",
        answer:
          "دانشگاه‌های دولتی برتر و بسیاری از پردیس‌های بین‌المللی اعتبار جهانی دارند؛ پیش از انتخاب، رتبه‌بندی و اعتبار رشته را بررسی کنید.",
      },
    ],
    sections: countrySectionsBySlug["malaysia"]!,
    seo: {
      metaTitle: "تحصیل در مالزی | هزینه پایین و پذیرش",
      metaDescription: "تحصیل در مالزی برای دانشجویان ایرانی: شهریه، ویزا، زندگی دانشجویی و دانشگاه‌ها.",
    },
  },
  {
    id: "country-australia",
    slug: "australia",
    nameFa: "استرالیا",
    nameEn: "Australia",
    continent: "oceania",
    costBand: "high",
    flagEmoji: "🇦🇺",
    heroImage: "/images/heroes/australia.jpg",
    summary:
      "استرالیا با دانشگاه‌های تراز اول جهان، کیفیت زندگی بالا و فرصت‌های کار پس از تحصیل، مقصدی رقابتی اما پرطرفدار است.",
    benefits: [
      "دانشگاه‌های تراز اول جهانی",
      "فرصت کار پس از تحصیل (ویزای ۴۸۵)",
      "کیفیت بالای زندگی و امنیت",
      "بازار کار متنوع برای فارغ‌التحصیلان",
    ],
    language: "انگلیسی",
    visaDuration: "۴ تا ۱۲ هفته",
    costOfLiving: 1400,
    tuitionRange: "۲۰٬۰۰۰–۴۵٬۰۰۰ دلار استرالیا در سال",
    currency: "AUD",
    costBreakdown: [
      {
        id: "tuition",
        label: "شهریه سالانه",
        amount: "۲۰٬۰۰۰–۴۵٬۰۰۰ دلار استرالیا",
      },
      {
        id: "living",
        label: "هزینه زندگی ماهانه",
        amount: "حدود ۱٬۴۰۰ دلار استرالیا",
      },
      {
        id: "insurance",
        label: "بیمه OSHC",
        amount: "۵۰۰–۷۰۰ دلار در سال",
      },
      {
        id: "visa",
        label: "هزینه ویزای ۵۰۰",
        amount: "حدود ۶۵۰ دلار استرالیا",
      },
    ],
    requirements: [
      "پذیرش از مؤسسه معتبر CRICOS",
      "IELTS یا معادل",
      "بیمه OSHC",
      "تمکن مالی و مدارک هویتی",
    ],
    popularFields: ["مهندسی", "علوم داده", "پرستاری", "مدیریت"],
    faqs: [
      {
        id: "au-faq-1",
        question: "هزینه تحصیل در استرالیا چقدر است؟",
        answer:
          "شهریه سالانه اغلب بین ۲۰ تا ۴۵ هزار دلار استرالیا است؛ هزینه زندگی جداگانه محاسبه می‌شود.",
      },
    ],
    sections: countrySectionsBySlug["australia"]!,
    seo: {
      metaTitle: "تحصیل در استرالیا | ویزای ۵۰۰ و دانشگاه‌ها",
      metaDescription: "راهنمای تحصیل در استرالیا: شهریه، ویزا، کار دانشجویی و اقامت پس از فارغ‌التحصیلی.",
    },
  },
  {
    id: "country-netherlands",
    slug: "netherlands",
    nameFa: "هلند",
    nameEn: "Netherlands",
    continent: "europe",
    costBand: "high",
    flagEmoji: "🇳🇱",
    heroImage: "/images/heroes/netherlands.jpg",
    summary:
      "هلند با صدها برنامه انگلیسی‌زبان، نوآوری در آموزش و موقعیت عالی در اروپا، مقصدی محبوب برای کارشناسی و کارشناسی ارشد است.",
    benefits: [
      "تعداد بالای دوره‌های انگلیسی‌زبان",
      "ویزای یک‌ساله Orientation Year پس از تحصیل",
      "محیط نوآورانه و بین‌المللی",
      "موقعیت عالی برای کار در اروپا",
    ],
    language: "انگلیسی / هلندی",
    visaDuration: "۴ تا ۸ هفته",
    costOfLiving: 1100,
    tuitionRange: "۶٬۰۰۰–۲۰٬۰۰۰ یورو در سال",
    currency: "EUR",
    costBreakdown: [
      {
        id: "tuition",
        label: "شهریه سالانه",
        amount: "۶٬۰۰۰–۲۰٬۰۰۰ یورو",
        note: "شهریه دانشجویان غیراروپایی معمولاً بالاتر است",
      },
      {
        id: "living",
        label: "هزینه زندگی ماهانه",
        amount: "حدود ۱٬۱۰۰ یورو",
      },
      {
        id: "insurance",
        label: "بیمه درمانی",
        amount: "حدود ۱۲۰–۱۴۰ یورو در ماه",
      },
      {
        id: "visa",
        label: "هزینه MVV / اقامت",
        amount: "حدود ۲۱۰ یورو",
      },
    ],
    requirements: [
      "مدارک تحصیلی و انگیزه‌نامه قوی",
      "مدرک زبان انگلیسی",
      "تمکن مالی مطابق اعلام IND",
      "بیمه درمانی هلند",
    ],
    popularFields: [
      "مهندسی و فناوری",
      "علوم اجتماعی",
      "طراحی",
      "مدیریت و اقتصاد",
    ],
    faqs: [
      {
        id: "nl-faq-1",
        question: "آیا برنامه‌های انگلیسی در هلند زیاد است؟",
        answer:
          "بله، هلند یکی از بالاترین تعداد دوره‌های انگلیسی‌زبان را در اروپا دارد.",
      },
    ],
    sections: countrySectionsBySlug["netherlands"]!,
    seo: {
      metaTitle: "تحصیل در هلند | برنامه‌های انگلیسی‌زبان",
      metaDescription: "تحصیل در هلند برای ایرانیان: شهریه، ویزا، کار دانشجویی و دانشگاه‌های برتر.",
    },
  },
];
