import type { Consultant, Program } from "@/contracts/content";
import type { Lead } from "@/contracts/leads";
import {
  CASE_STAGES,
  type ChecklistItem,
  type StudentCase,
  type StudentDocument,
} from "@/contracts/students";
import { DEMO_ACCOUNTS, getMockOrigin } from "../config";
import {
  DOCUMENT_TYPE_LABELS,
  buildDefaultChecklist,
  caseCode,
  deriveCurrentStage,
  emptyStages,
} from "../domain/cases";
import type { MockUser, StoredFile } from "../types";
import { DAY_MS, uuidFromKey } from "../utils";
import {
  afterHours,
  asciiEmail,
  chance,
  clampToNow,
  faker,
  iso,
  pick,
  weighted,
  type SeedClock,
} from "./helpers";

export type StudentSeed = {
  users: MockUser[];
  cases: StudentCase[];
  checklistItems: ChecklistItem[];
  documents: StudentDocument[];
  files: StoredFile[];
};

const FILE_TYPES = [
  { mimeType: "application/pdf", ext: "pdf" },
  { mimeType: "image/jpeg", ext: "jpg" },
  { mimeType: "image/png", ext: "png" },
] as const;

export function fileUrl(fileId: string, name: string): string {
  return `${getMockOrigin()}/mock-files/${fileId}/${encodeURIComponent(name)}`;
}

export function buildFileAsset(
  key: string,
  baseName: string,
  ownerId: string | null,
  createdAt: string,
): StoredFile {
  const type = baseName.endsWith("photo") ? FILE_TYPES[1] : pick(FILE_TYPES);
  const id = uuidFromKey(`file:${key}`);
  const name = `${baseName}.${type.ext}`;
  return {
    id,
    url: fileUrl(id, name),
    name,
    size: faker.number.int({ min: 80_000, max: 4_000_000 }),
    mimeType: type.mimeType,
    createdAt,
    ownerId,
  };
}

export function buildStudentSeed(input: {
  clock: SeedClock;
  leads: readonly Lead[];
  convertedCaseIds: ReadonlyMap<string, string>;
  consultants: readonly Consultant[];
  programs: readonly Program[];
  countrySlugs: readonly string[];
}): StudentSeed {
  const { clock, consultants, programs, countrySlugs } = input;
  const won = input.leads.filter((lead) => lead.stageKind === "won");

  const users: MockUser[] = [];
  const cases: StudentCase[] = [];
  const checklistItems: ChecklistItem[] = [];
  const documents: StudentDocument[] = [];
  const files: StoredFile[] = [];

  won.forEach((lead, index) => {
    const caseId = input.convertedCaseIds.get(lead.id);
    if (!caseId) return;

    const studentId = uuidFromKey(`user:student:${index}`);
    const createdMs = new Date(lead.updatedAt).getTime();
    const consultantId = lead.assignedTo ?? pick(consultants).id;
    const targetCountry =
      lead.interestCountry ?? lead.assessment?.targetCountries[0] ?? pick(countrySlugs);
    const targetDegree = lead.assessment?.targetDegree ?? lead.interestDegree ?? "master";

    // The very first student is the documented demo account
    const mobile = index === 0 ? DEMO_ACCOUNTS.student.mobile : lead.mobile;
    users.push({
      id: studentId,
      name: lead.name,
      role: "student",
      permissions: [],
      mobile,
      ...(chance(0.6) ? { email: lead.email ?? asciiEmail("student") } : {}),
      status: "active",
      onboardingCompleted: true,
      lastLoginAt: null,
      createdAt: iso(createdMs),
      updatedAt: iso(createdMs),
      city: chance(0.5) ? faker.location.city() : null,
      birthDate: chance(0.4)
        ? iso(createdMs - faker.number.int({ min: 20, max: 35 }) * 365 * DAY_MS).slice(
            0,
            10,
          )
        : null,
      education: {
        highestDegree: lead.assessment?.targetDegree ?? lead.interestDegree ?? null,
        fieldOfStudy: chance(0.5) ? "مهندسی کامپیوتر" : null,
        gpa: chance(0.4) ? faker.number.float({ min: 14, max: 19, fractionDigits: 2 }) : null,
        universityName: chance(0.4) ? "دانشگاه تهران" : null,
      },
      activeCaseId: caseId,
    });

    /* ----- stages: completed < progress, in_progress at progress ----- */
    // Demo student (index 0): always on «مدارک» with mixed doc statuses for e2e
    const progress =
      index === 0
        ? 1
        : weighted([
            { value: 0, weight: 3 },
            { value: 1, weight: 6 },
            { value: 2, weight: 5 },
            { value: 3, weight: 3 },
            { value: 4, weight: 2 },
            { value: 5, weight: 1 },
            { value: 6, weight: 1 },
          ]);
    const stages = emptyStages();
    let cursor = createdMs;
    CASE_STAGES.forEach((stage, stageIndex) => {
      const entry = stages[stageIndex];
      if (stageIndex < progress) {
        const startedAt = afterHours(clock, cursor, 2, 48);
        cursor = afterHours(clock, startedAt, 24, 24 * 12);
        entry.status = "completed";
        entry.startedAt = iso(startedAt);
        entry.completedAt = iso(cursor);
      } else if (stageIndex === progress) {
        entry.status =
          index === 0 ? "in_progress" : chance(0.1) ? "blocked" : "in_progress";
        entry.startedAt = iso(afterHours(clock, cursor, 2, 48));
        if (entry.status === "blocked") entry.note = "منتظر ارسال مدارک از سمت دانشجو";
      }
    });

    const caseStatus =
      progress === 6 ? "closed" : chance(0.08) ? "on_hold" : "active";
    const countryPrograms = programs.filter((program) => program.countrySlug === targetCountry);

    const currentStage = deriveCurrentStage(stages);
    const stageHistory = stages
      .filter((entry) => entry.startedAt)
      .map((entry) => ({
        stageKey: entry.stage,
        enteredAt: entry.startedAt!,
        exitedAt: entry.completedAt,
        actorId: consultantId,
        note: entry.note,
      }));

    cases.push({
      id: caseId,
      code: caseCode(index + 1),
      status: caseStatus,
      studentId,
      studentName: lead.name,
      consultantId,
      leadId: lead.id,
      targetCountry,
      targetDegree,
      programIds: faker.helpers
        .arrayElements(countryPrograms, { min: 0, max: Math.min(3, countryPrograms.length) })
        .map((program) => program.id),
      currentStage,
      stageKey: currentStage,
      stages,
      stageHistory,
      templateId: null,
      version: 1,
      createdAt: iso(createdMs),
      updatedAt: iso(clampToNow(clock, cursor + DAY_MS / 2)),
    });

    /* ----- checklist + documents ----- */
    const items = buildDefaultChecklist(caseId, iso(createdMs), `case:${index}`);
    const demoDocStatus = (documentType: string): StudentDocument["status"] | "skip" => {
      if (index !== 0) return "skip";
      if (documentType === "passport") return "rejected";
      if (documentType === "national_id") return "uploaded";
      if (documentType === "photo") return "not_uploaded";
      if (documentType === "transcript") return "approved";
      if (documentType === "degree_certificate") return "approved";
      if (documentType === "language_certificate") return "approved";
      if (documentType === "cv") return "approved";
      if (documentType === "motivation_letter") return "not_uploaded";
      return "skip";
    };

    items.forEach((item, itemIndex) => {
      const stageIndex = CASE_STAGES.indexOf(item.stage);
      const inPast = stageIndex < progress;
      const inCurrent = stageIndex === progress;
      const demoStatus =
        item.documentType != null ? demoDocStatus(item.documentType) : "skip";

      let done: boolean;
      if (index === 0 && item.documentType) {
        done =
          demoStatus === "approved" ||
          demoStatus === "uploaded" ||
          demoStatus === "pending" ||
          demoStatus === "rejected";
      } else {
        done = inPast || (inCurrent && chance(0.5));
      }

      if (!done || demoStatus === "not_uploaded") {
        if (inCurrent && item.required && (index === 0 || chance(0.4))) {
          const daysAhead = faker.number.int({ min: 1, max: 10 });
          item.dueDate = iso(clock.now + daysAhead * DAY_MS).slice(0, 10);
        }
        checklistItems.push(item);
        return;
      }

      item.done = true;
      if (item.documentType) {
        const documentId = uuidFromKey(`case:${index}:doc:${itemIndex}`);
        const uploadedAt = afterHours(clock, createdMs, 4, 24 * 20);
        const file = buildFileAsset(
          `case:${index}:${itemIndex}`,
          `${item.documentType.replaceAll("_", "-")}-${caseCode(index + 1).toLowerCase()}`,
          studentId,
          iso(uploadedAt),
        );
        files.push(file);

        const status: StudentDocument["status"] =
          demoStatus === "approved" ||
          demoStatus === "uploaded" ||
          demoStatus === "pending" ||
          demoStatus === "rejected"
            ? demoStatus
            : inPast
              ? "approved"
              : weighted<StudentDocument["status"]>([
                  { value: "approved", weight: 5 },
                  { value: "pending", weight: 4 },
                  { value: "rejected", weight: 2 },
                ]);
        const reviewed = status === "approved" || status === "rejected";
        const reviewedAt = reviewed ? afterHours(clock, uploadedAt, 2, 72) : null;
        const rejectReason =
          status === "rejected" ? "تصویر مدرک خوانا نیست؛ لطفاً دوباره آپلود کنید." : null;
        documents.push({
          id: documentId,
          caseId,
          type: item.documentType,
          title: DOCUMENT_TYPE_LABELS[item.documentType],
          status,
          custom: false,
          checklistItemId: item.id,
          rejectionReason: rejectReason,
          rejectReason,
          fileId: file.id,
          fileUrl: file.url,
          fileName: file.name,
          fileSize: file.size,
          mimeType: file.mimeType,
          uploadedBy: studentId,
          reviewedBy: reviewed ? consultantId : null,
          reviewedAt: reviewedAt === null ? null : iso(reviewedAt),
          versions: [],
          version: 1,
          createdAt: iso(uploadedAt),
          updatedAt: iso(reviewedAt ?? uploadedAt),
        });
        item.documentId = documentId;
        if (status === "rejected") item.done = false;
      }
      checklistItems.push(item);
    });
  });

  return { users, cases, checklistItems, documents, files };
}
