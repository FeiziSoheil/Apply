import type { Consultant } from "@/contracts/content";
import type { StudentCase } from "@/contracts/students";
import {
  TICKET_CATEGORIES,
  TICKET_PRIORITIES,
  type Ticket,
  type TicketMessage,
} from "@/contracts/tickets";
import type { MockUser, StoredFile } from "../types";
import { uuidFromKey } from "../utils";
import { ADMIN_USER_ID } from "./staff";
import { buildFileAsset } from "./students";
import {
  afterHours,
  chance,
  daysAgoBetween,
  faker,
  iso,
  pick,
  weighted,
  type SeedClock,
} from "./helpers";

export const TICKET_COUNT = 48;

const SUBJECTS = [
  "مشکل در آپلود مدرک تحصیلی",
  "سؤال درباره مهلت ثبت‌نام دانشگاه",
  "درخواست تغییر مشاور پرونده",
  "ابهام در مبلغ قسط دوم",
  "راهنمایی برای تکمیل فرم ویزا",
  "وضعیت بررسی انگیزه‌نامه",
  "درخواست اصلاح اطلاعات پاسپورت",
  "خطا در ورود به پنل",
] as const;

const STUDENT_MESSAGES = [
  "سلام، لطفاً وضعیت پرونده‌ام را بررسی کنید.",
  "فایل را چند بار آپلود کردم ولی خطا می‌دهد، لطفاً راهنمایی کنید.",
  "ممنون از پاسخ شما؛ یک سؤال دیگر هم دارم.",
  "آیا مدارک ارسالی تأیید شد؟",
  "لطفاً مهلت ارسال مدارک را اعلام کنید.",
] as const;

const STAFF_MESSAGES = [
  "سلام، درخواست شما بررسی شد و به‌زودی نتیجه اعلام می‌شود.",
  "لطفاً فایل را با فرمت PDF و حجم کمتر از ۱۰ مگابایت ارسال کنید.",
  "مدارک شما دریافت شد و در حال بررسی است.",
  "هماهنگی لازم انجام شد؛ اگر سؤال دیگری دارید بفرمایید.",
] as const;

const INTERNAL_NOTES = [
  "یادداشت داخلی: دانشجو قبلاً هم همین مورد را گزارش کرده بود.",
  "یادداشت داخلی: پیگیری با واحد مالی انجام شود.",
] as const;

export type TicketSeed = {
  tickets: Ticket[];
  messages: TicketMessage[];
  files: StoredFile[];
};

export function buildTicketSeed(input: {
  clock: SeedClock;
  students: readonly MockUser[];
  cases: readonly StudentCase[];
  consultants: readonly Consultant[];
}): TicketSeed {
  const { clock, students, cases, consultants } = input;
  const tickets: Ticket[] = [];
  const messages: TicketMessage[] = [];
  const files: StoredFile[] = [];
  const staffNames = new Map<string, string>([
    [ADMIN_USER_ID, "مدیر سامانه"],
    ...consultants.map((consultant): [string, string] => [consultant.id, consultant.name]),
  ]);

  for (let index = 0; index < TICKET_COUNT; index += 1) {
    const student = pick(students);
    const studentCase = cases.find((entry) => entry.studentId === student.id) ?? null;
    const staffId =
      studentCase?.consultantId && chance(0.8) ? studentCase.consultantId : ADMIN_USER_ID;
    const ticketId = uuidFromKey(`ticket:${index}`);
    const createdMs = daysAgoBetween(clock, 60, 0);

    const closed = chance(0.3);
    const thread: TicketMessage[] = [];
    const count = faker.number.int({ min: 1, max: 6 });
    let cursor = createdMs;
    for (let n = 0; n < count; n += 1) {
      cursor = n === 0 ? createdMs : afterHours(clock, cursor, 1, 36);
      const fromStudent = n % 2 === 0;
      const authorId = fromStudent ? student.id : staffId;
      const messageId = uuidFromKey(`ticket:${index}:msg:${n}`);
      const attachments = [];
      if (fromStudent && chance(0.3)) {
        const file = buildFileAsset(
          `ticket:${index}:${n}`,
          `attachment-${index + 1}-${n + 1}`,
          student.id,
          iso(cursor),
        );
        files.push(file);
        attachments.push({
          fileId: file.id,
          url: file.url,
          name: file.name,
          size: file.size,
          mimeType: file.mimeType,
        });
      }
      thread.push({
        id: messageId,
        ticketId,
        authorId,
        authorName: fromStudent ? student.name : (staffNames.get(staffId) ?? "پشتیبانی"),
        authorRole: fromStudent ? "student" : staffId === ADMIN_USER_ID ? "admin" : "consultant",
        authorType: fromStudent ? "student" : "staff",
        body: fromStudent ? pick(STUDENT_MESSAGES) : pick(STAFF_MESSAGES),
        attachments,
        attachmentIds: attachments.map((item) => item.fileId),
        internal: false,
        readAt: null,
        createdAt: iso(cursor),
      });
      if (!fromStudent && chance(0.25)) {
        cursor = afterHours(clock, cursor, 0.1, 1);
        thread.push({
          id: uuidFromKey(`ticket:${index}:note:${n}`),
          ticketId,
          authorId: staffId,
          authorName: staffNames.get(staffId) ?? "پشتیبانی",
          authorRole: staffId === ADMIN_USER_ID ? "admin" : "consultant",
          authorType: "staff",
          body: pick(INTERNAL_NOTES),
          attachments: [],
          attachmentIds: [],
          internal: true,
          readAt: null,
          createdAt: iso(cursor),
        });
      }
    }

    const lastPublic = [...thread].reverse().find((message) => !message.internal);
    const status = closed
      ? "closed"
      : lastPublic?.authorRole === "student"
        ? "waiting_staff"
        : "waiting_student";
    const lastMessageMs = new Date(thread[thread.length - 1].createdAt).getTime();
    const closedMs = closed ? afterHours(clock, lastMessageMs, 1, 48) : null;
    const firstStaff = thread.find(
      (message) => !message.internal && message.authorRole !== "student",
    );
    const caseId = studentCase && chance(0.7) ? studentCase.id : null;

    tickets.push({
      id: ticketId,
      code: `TK-${10001 + index}`,
      subject: pick(SUBJECTS),
      category: pick(TICKET_CATEGORIES),
      priority: weighted([
        { value: TICKET_PRIORITIES[0], weight: 2 },
        { value: TICKET_PRIORITIES[1], weight: 6 },
        { value: TICKET_PRIORITIES[2], weight: 2 },
        { value: TICKET_PRIORITIES[3], weight: 1 },
      ]),
      status,
      createdBy: student.id,
      createdByName: student.name,
      assignedTo: chance(0.85) ? staffId : null,
      caseId,
      relatedCaseId: caseId,
      messageCount: thread.length,
      lastMessageAt: iso(lastMessageMs),
      closedAt: closedMs === null ? null : iso(closedMs),
      firstResponseAt: firstStaff ? firstStaff.createdAt : null,
      slaDueAt: iso(createdMs + 24 * 3_600_000),
      rating: closed && chance(0.4) ? faker.number.int({ min: 3, max: 5 }) : null,
      ratingComment: null,
      createdAt: iso(createdMs),
      updatedAt: iso(closedMs ?? lastMessageMs),
    });
    messages.push(...thread);
  }

  return { tickets, messages, files };
}
