import type { InstituteSettings, SmsTemplate } from "@/contracts/settings";
import { CONTACT, INSTITUTE } from "@/lib/constants";
import { uuidFromKey } from "../utils";
import { iso, type SeedClock } from "./helpers";

export const INSTITUTE_SETTINGS_ID = uuidFromKey("settings:institute");

const SMS_TEMPLATES: readonly SmsTemplate[] = [
  {
    key: "booking_confirm",
    label: "تأیید رزرو",
    body: "سلام {name}؛ رزرو مشاوره شما برای {date} تأیید شد.",
    variables: ["name", "date"],
  },
  {
    key: "booking_reminder",
    label: "یادآوری رزرو",
    body: "یادآوری: جلسه مشاوره {name} فردا {date} برگزار می‌شود.",
    variables: ["name", "date"],
  },
  {
    key: "welcome",
    label: "خوش‌آمدگویی",
    body: "سلام {name}؛ به {institute} خوش آمدید.",
    variables: ["name", "institute"],
  },
  {
    key: "password_reset",
    label: "بازنشانی رمز",
    body: "سلام {name}؛ رمز موقت شما: {password}",
    variables: ["name", "password"],
  },
];

export function buildInstituteSettings(clock: SeedClock): InstituteSettings {
  return {
    id: INSTITUTE_SETTINGS_ID,
    info: {
      name: INSTITUTE.name,
      nameEn: INSTITUTE.nameEn,
      tagline: INSTITUTE.tagline,
      description: INSTITUTE.about,
      logoFileId: null,
      foundingYear: 2012,
      homepageStats: [
        { label: "دانشجوی اعزام‌شده", value: 3200, suffix: "+" },
        { label: "کشور مقصد", value: 12, suffix: "+" },
        { label: "دانشگاه همکار", value: 180, suffix: "+" },
        { label: "سال تجربه", value: 14, suffix: "" },
      ],
    },
    contact: {
      phones: [
        {
          label: "دفتر مرکزی",
          number: CONTACT.phone,
          href: CONTACT.phoneHref,
        },
      ],
      email: CONTACT.email,
      address: CONTACT.address,
      workingHours: CONTACT.hours,
      coordinates: { lat: CONTACT.lat, lng: CONTACT.lng },
    },
    social: {
      instagram: "https://instagram.com/",
      telegram: "https://t.me/",
      linkedin: "https://linkedin.com/",
      whatsapp: CONTACT.whatsappHref,
      website: "",
    },
    licenses: [
      {
        id: uuidFromKey("license:enamad"),
        title: "نماد اعتماد الکترونیکی",
        imageFileId: uuidFromKey("file:license-badge"),
        href: "#",
        order: 0,
      },
      {
        id: uuidFromKey("license:msrt"),
        title: "مجوز وزارت علوم",
        imageFileId: uuidFromKey("file:license-badge"),
        href: "#",
        order: 1,
      },
    ],
    seo: {
      defaultTitle: INSTITUTE.name,
      titleTemplate: `%s | ${INSTITUTE.name}`,
      defaultDescription: INSTITUTE.about.slice(0, 160),
      ogImageFileId: null,
    },
    smsTemplates: [...SMS_TEMPLATES],
    paymentAccount: {
      cardNumber: "6037991234567890",
      accountHolder: "مؤسسه اعزام دانشجو",
      bankName: "ملی",
    },
    updatedAt: iso(clock.now - 30 * 86_400_000),
  };
}
