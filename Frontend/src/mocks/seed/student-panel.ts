import type { Program, University } from "@/contracts/content";
import type { Announcement } from "@/contracts/student-panel";
import type { Installment, PaymentAttempt } from "@/contracts/payments";
import type { StudentCase } from "@/contracts/students";
import type { MockUser, StoredInvoice, StoredShortlist } from "../types";
import { newId, uuidFromKey } from "../utils";
import { chance, iso, pick, type SeedClock } from "./helpers";

export function buildAnnouncementSeed(
  clock: SeedClock,
  countrySlugs: readonly string[],
): Announcement[] {
  const now = clock.now;
  return [
    {
      id: uuidFromKey("announcement:all"),
      title: "ساعات پاسخگویی پشتیبانی در تعطیلات",
      body: "از شنبه تا چهارشنبه، پاسخگویی از ساعت ۹ تا ۱۸ انجام می‌شود. جمعه‌ها فقط پیام اضطراری.",
      audience: { allStudents: true, countrySlugs: [] },
      status: "published",
      publishedAt: iso(now - 3 * 86_400_000),
      createdAt: iso(now - 4 * 86_400_000),
      updatedAt: iso(now - 3 * 86_400_000),
    },
    {
      id: uuidFromKey("announcement:de"),
      title: "یادآوری ددلاین ویزای تحصیلی آلمان",
      body: "اگر مقصدتان آلمان است، مدارک ترجمه را حداقل چهار هفته قبل از وقت سفارت آماده کنید.",
      audience: {
        allStudents: false,
        countrySlugs: countrySlugs.filter((slug) => slug.includes("german")).length
          ? countrySlugs.filter((slug) => slug.includes("german") || slug === "germany")
          : countrySlugs.slice(0, 2),
      },
      status: "published",
      publishedAt: iso(now - 1 * 86_400_000),
      createdAt: iso(now - 2 * 86_400_000),
      updatedAt: iso(now - 1 * 86_400_000),
    },
    {
      id: uuidFromKey("announcement:draft"),
      title: "پیش‌نویس اعلان داخلی",
      body: "این متن هنوز منتشر نشده است.",
      audience: { allStudents: true, countrySlugs: [] },
      status: "draft",
      publishedAt: null,
      createdAt: iso(now - 5 * 86_400_000),
      updatedAt: iso(now - 5 * 86_400_000),
    },
  ];
}

export function buildShortlistSeed(
  students: readonly MockUser[],
  programs: readonly Program[],
  universities: readonly University[],
): StoredShortlist[] {
  return students.slice(0, 20).map((student, index) => {
    const program = programs[index % programs.length];
    const university = universities[(index + 1) % universities.length];
    const items: StoredShortlist["items"] = [
      {
        id: uuidFromKey(`shortlist:${student.id}:p`),
        programId: program.id,
        universityId: null,
        addedAt: student.createdAt,
      },
    ];
    if (chance(0.5)) {
      items.push({
        id: uuidFromKey(`shortlist:${student.id}:u`),
        programId: null,
        universityId: university.id,
        addedAt: student.updatedAt,
      });
    }
    return {
      id: student.id,
      items,
      updatedAt: student.updatedAt,
    };
  });
}

export function buildPaymentAttemptSeed(
  installments: readonly Installment[],
  invoices: readonly StoredInvoice[],
  cases: readonly StudentCase[],
): PaymentAttempt[] {
  const awaiting = installments.filter(
    (item) => item.status === "awaiting_verification",
  );
  return awaiting.slice(0, 8).map((item, index) => {
    const invoice = item.invoiceId
      ? invoices.find((row) => row.id === item.invoiceId)
      : undefined;
    const linkedCase =
      (invoice ? cases.find((row) => row.id === invoice.caseId) : undefined) ??
      cases[index % cases.length];
    return {
      id: uuidFromKey(`payment-attempt:${index}`),
      installmentId: item.id,
      caseId: linkedCase.id,
      studentId: linkedCase.studentId,
      method: "card_to_card" as const,
      status: "awaiting_verification" as const,
      gatewayRef: null,
      receiptFileId: null,
      amount: item.amount,
      createdAt: item.updatedAt,
      updatedAt: item.updatedAt,
    };
  });
}

void newId;
void pick;
