import type { AuthArea } from "@/lib/auth/routes";

/** Mock notifications of the panel top bar (replace with the API later) */
export type PanelNotification = {
  id: string;
  title: string;
  description: string;
  /** Pre-formatted relative time */
  time: string;
  unread: boolean;
};

export const PANEL_NOTIFICATIONS: Record<AuthArea, readonly PanelNotification[]> =
  {
    admin: [
      {
        id: "a-1",
        title: "لید جدید ثبت شد",
        description: "مریم احمدی از فرم ارزیابی رایگان درخواست مشاوره داده است.",
        time: "۵ دقیقه پیش",
        unread: true,
      },
      {
        id: "a-2",
        title: "تیکت جدید",
        description: "دانشجو درباره مهلت ارسال مدارک پذیرش آلمان پرسیده است.",
        time: "۲۰ دقیقه پیش",
        unread: true,
      },
      {
        id: "a-3",
        title: "مدرک جدید برای بررسی",
        description: "ریحانه کریمی ریزنمرات خود را بارگذاری کرد.",
        time: "۱ ساعت پیش",
        unread: true,
      },
      {
        id: "a-4",
        title: "رزرو فردا تأیید شد",
        description: "نوبت مشاوره حضوری ساعت ۱۰ صبح فردا قطعی شد.",
        time: "دیروز",
        unread: false,
      },
    ],
    panel: [
      {
        id: "p-1",
        title: "مدرک شما تأیید شد",
        description: "رونوشت مدرک زبان شما توسط مشاور بررسی و تأیید شد.",
        time: "۱۰ دقیقه پیش",
        unread: true,
      },
      {
        id: "p-2",
        title: "پاسخ جدید در تیکت",
        description: "مشاور شما به پرسش درباره ویزای تحصیلی پاسخ داده است.",
        time: "۲ ساعت پیش",
        unread: true,
      },
      {
        id: "p-3",
        title: "یادآوری قسط",
        description: "موعد پرداخت قسط بعدی تا ۵ روز دیگر است.",
        time: "دیروز",
        unread: false,
      },
    ],
  };
