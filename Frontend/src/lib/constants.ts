/**
 * Institute info, contact, socials, and navigation menus.
 *
 * TODO(settings-api): When the real backend is connected, replace these
 * constants with data from `GET /settings/institute` (see
 * `docs/settings-binding.md` for the consumer file list). Until then the
 * public site reads this module only.
 */

export const INSTITUTE = {
  name: "اِپلای",
  nameEn: "Apply",
  tagline: "همراه مطمئن شما برای تحصیل در خارج از کشور",
  about:
    "موسسه اِپلای با تیمی از مشاوران مجرب، مسیر پذیرش دانشگاه، ویزای تحصیلی و آمادگی زبان را از شروع تا رسیدن به مقصد همراهی می‌کند.",
} as const;

export const CONTACT = {
  phone: "۰۲۱-۹۱۰۰۰۰۰۰",
  phoneHref: "tel:+982191000000",
  email: "info@apply.example",
  emailHref: "mailto:info@apply.example",
  whatsappHref: "https://wa.me/989120000000",
  address: "تهران، خیابان ولیعصر، بالاتر از پارک‌وی، پلاک ۱۲",
  hours: "شنبه تا چهارشنبه ۹ تا ۱۸ | پنجشنبه ۹ تا ۱۳",
  /** Approximate office coordinates for map deep-links (no embed) */
  lat: 35.781,
  lng: 51.418,
  neshanHref: "https://neshan.org/maps/@35.7810,51.4180,17z",
  baladHref: "https://balad.ir/location?latitude=35.781&longitude=51.418",
} as const;

export type SocialLink = {
  title: string;
  href: string;
  /** Lucide icon key used by footer (brand icons removed from lucide) */
  icon: "camera" | "send" | "link-2" | "message-circle";
};

export const SOCIAL_LINKS: readonly SocialLink[] = [
  {
    title: "اینستاگرام",
    href: "https://instagram.com/",
    icon: "camera",
  },
  {
    title: "تلگرام",
    href: "https://t.me/",
    icon: "send",
  },
  {
    title: "لینکدین",
    href: "https://linkedin.com/",
    icon: "link-2",
  },
  {
    title: "واتساپ",
    href: CONTACT.whatsappHref,
    icon: "message-circle",
  },
] as const;

export type NavLink = {
  title: string;
  href: string;
  description?: string;
};

export type NavItem =
  | {
      type: "link";
      title: string;
      href: string;
    }
  | {
      type: "dropdown";
      title: string;
      items: readonly NavLink[];
    }
  | {
      type: "countries";
      title: string;
      /** Overview / fallback href when no country is selected */
      href: string;
    };

/** Desktop + mobile main navigation — labels/hrefs only; countries filled via services */
export const MAIN_NAV: readonly NavItem[] = [
  { type: "link", title: "خانه", href: "/" },
  {
    type: "dropdown",
    title: "خدمات",
    items: [
      {
        title: "همه خدمات",
        href: "/services",
        description: "فهرست کامل خدمات موسسه",
      },
      {
        title: "اپلای دانشگاه",
        href: "/services/admission-consulting",
        description: "انتخاب رشته، دانشگاه و کشور",
      },
      {
        title: "ویزای تحصیلی",
        href: "/services/visa-support",
        description: "آماده‌سازی مدارک تا دریافت ویزا",
      },
      {
        title: "آمادگی مدرک زبان",
        href: "/services/language-prep",
        description: "برنامه‌ریزی آزمون‌های زبان",
      },
    ],
  },
  {
    type: "countries",
    title: "کشورها",
    href: "/countries",
  },
  {
    type: "link",
    title: "برنامه‌ها",
    href: "/programs",
  },
  {
    type: "link",
    title: "دانشگاه‌ها",
    href: "/universities",
  },
  {
    type: "link",
    title: "وبلاگ",
    href: "/blog",
  },
  {
    type: "dropdown",
    title: "ابزارها",
    items: [
      {
        title: "ماشین‌حساب هزینه",
        href: "/tools/cost-calculator",
        description: "برآورد شهریه و هزینه زندگی",
      },
      {
        title: "شمارش معکوس ددلاین",
        href: "/tools/deadline-countdown",
        description: "زمان باقی‌مانده تا مهلت پذیرش",
      },
      {
        title: "همه ابزارها",
        href: "/tools",
        description: "فهرست ابزارهای کاربردی",
      },
    ],
  },
  {
    type: "dropdown",
    title: "درباره ما",
    items: [
      { title: "درباره ما", href: "/about" },
      { title: "تیم مشاوران", href: "/team" },
      { title: "داستان موفقیت", href: "/success-stories" },
      { title: "سوالات متداول", href: "/faq" },
    ],
  },
  { type: "link", title: "تماس با ما", href: "/contact" },
] as const;

export type HeaderAction = {
  title: string;
  href: string;
  variant: "outline" | "default";
};

export const HEADER_ACTIONS: readonly HeaderAction[] = [
  { title: "ورود دانشجو", href: "/login", variant: "outline" },
  { title: "ارزیابی رایگان", href: "/assessment", variant: "default" },
] as const;

export const FOOTER_QUICK_LINKS: readonly NavLink[] = [
  { title: "خانه", href: "/" },
  { title: "خدمات", href: "/services" },
  { title: "برنامه‌های تحصیلی", href: "/programs" },
  { title: "دانشگاه‌ها", href: "/universities" },
  { title: "فرآیند پذیرش", href: "/process" },
  { title: "تعرفه‌ها", href: "/pricing" },
  { title: "رزرو مشاوره", href: "/booking" },
  { title: "ارزیابی رایگان", href: "/assessment" },
  { title: "ماشین‌حساب هزینه", href: "/tools/cost-calculator" },
  { title: "وبلاگ", href: "/blog" },
  { title: "اخبار", href: "/news" },
] as const;

export const FOOTER_LEGAL_LINKS: readonly NavLink[] = [
  { title: "حریم خصوصی", href: "/privacy" },
  { title: "شرایط استفاده", href: "/terms" },
] as const;

export const FOOTER_CTA = {
  title: "مسیر تحصیل در خارج را همین امروز شروع کنید",
  description:
    "با ارزیابی رایگان وضعیت خود را بسنجید یا همین حالا وقت مشاوره رزرو کنید.",
  primary: { title: "ارزیابی رایگان", href: "/assessment" },
  secondary: { title: "رزرو مشاوره", href: "/booking" },
} as const;

export const FLOATING_CONTACT = {
  call: { title: "تماس", href: CONTACT.phoneHref },
  whatsapp: { title: "واتساپ", href: CONTACT.whatsappHref },
  booking: { title: "رزرو مشاوره", href: "/booking" },
} as const;

/** Popular destinations for 404 and empty states */
export const POPULAR_LINKS: readonly NavLink[] = [
  { title: "خانه", href: "/" },
  { title: "ارزیابی رایگان", href: "/assessment" },
  { title: "رزرو مشاوره", href: "/booking" },
  { title: "خدمات", href: "/services" },
  { title: "تحصیل در آلمان", href: "/countries/germany" },
  { title: "سوالات متداول", href: "/faq" },
] as const;

/** @deprecated Prefer FOOTER_QUICK_LINKS / FOOTER_LEGAL_LINKS */
export const FOOTER_NAV: NavLink[] = [
  ...FOOTER_QUICK_LINKS.slice(0, 2),
  ...FOOTER_LEGAL_LINKS,
];

/** Trust badge placeholders (enamad / licenses) */
export const TRUST_BADGES: readonly { title: string; href: string }[] = [
  { title: "نماد اعتماد الکترونیکی", href: "#" },
  { title: "مجوز وزارت علوم", href: "#" },
] as const;

/**
 * Approximate FX rates: 1 unit of foreign currency → تومان.
 * Editable mock constants — replace with live rates when API is available.
 */
export const FX_RATES = {
  EUR: 68_000,
  CAD: 46_000,
  USD: 63_000,
  AUD: 41_000,
  MYR: 14_000,
  TRY: 1_900,
  HUF: 170,
} as const;

export type FxCurrency = keyof typeof FX_RATES;

export const CURRENCY_LABELS_FA: Record<FxCurrency, string> = {
  EUR: "یورو",
  CAD: "دلار کانادا",
  USD: "دلار",
  AUD: "دلار استرالیا",
  MYR: "رینگیت",
  TRY: "لیر ترکیه",
  HUF: "فورینت مجارستان",
};

/** Lifestyle multipliers applied to monthly living costs */
export const LIFESTYLE_MULTIPLIERS = {
  economic: 0.75,
  medium: 1,
  comfortable: 1.35,
} as const;

/** Degree-level multipliers applied to annual tuition */
export const DEGREE_TUITION_MULTIPLIERS = {
  bachelor: 1,
  master: 1.15,
  phd: 0.95,
  language: 0.45,
  foundation: 0.55,
} as const;

export const LIFESTYLE_LABELS_FA = {
  economic: "اقتصادی",
  medium: "متوسط",
  comfortable: "راحت",
} as const;

export const NEWS_EVENT_TYPE_LABELS = {
  webinar: "وبینار",
  exhibition: "نمایشگاه",
  visa: "قوانین ویزا",
  deadline: "مهلت پذیرش",
  general: "عمومی",
} as const;
