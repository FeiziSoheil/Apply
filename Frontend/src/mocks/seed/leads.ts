import type {
  Activity,
  AssessmentProfile,
  Lead,
  LeadSource,
} from "@/contracts/leads";
import type { Consultant } from "@/contracts/content";
import type { PipelineStageKind } from "@/contracts/crm";
import { uuidFromKey } from "../utils";
import {
  LOST_REASONS,
  MESSAGE_POOL,
  NOTE_POOL,
  afterHours,
  asciiEmail,
  chance,
  clampToNow,
  daysAgoBetween,
  faker,
  iso,
  persianMobile,
  persianName,
  pick,
  weighted,
  type SeedClock,
} from "./helpers";
import type { CrmSeed } from "./crm";

export const LEAD_COUNT = 150;
export const STUDENT_COUNT = 40;

const FUNNEL_KEYS = [
  "new",
  "first_contact",
  "consultation_done",
  "evaluation_proposal",
  "contract",
  "converted",
] as const;

const DEGREES = ["bachelor", "master", "phd", "language", "foundation"] as const;

export type LeadSeed = {
  leads: Lead[];
  activities: Activity[];
  /** Case id reserved for each converted (won) lead, keyed by lead id */
  convertedCaseIds: Map<string, string>;
};

function buildAssessment(countrySlugs: readonly string[]): AssessmentProfile {
  const languageStatus = pick(["none", "ielts", "toefl", "duolingo", "other"] as const);
  const profile: AssessmentProfile = {
    currentDegree: pick(["bachelor", "master"] as const),
    targetDegree: pick(["master", "phd", "bachelor"] as const),
    fieldOfStudy: pick([
      "مهندسی کامپیوتر",
      "مهندسی مکانیک",
      "مدیریت کسب‌وکار",
      "علوم داده",
      "معماری",
      "پزشکی",
      "حقوق",
    ]),
    gpa: faker.number.float({ min: 12, max: 19.5, fractionDigits: 1 }),
    languageStatus,
    targetCountries: faker.helpers.arrayElements(countrySlugs, { min: 1, max: 3 }),
    annualBudget: faker.number.int({ min: 0, max: 15_000 }),
    currency: "EUR",
    startTime: pick(["nearest", "six_months", "one_year", "undecided"] as const),
    needsScholarship: chance(0.45),
  };
  if (languageStatus === "ielts") {
    profile.languageScore = faker.number.float({ min: 5, max: 8, multipleOf: 0.5 });
  } else if (languageStatus === "toefl") {
    profile.languageScore = faker.number.int({ min: 60, max: 110 });
  } else if (languageStatus === "duolingo") {
    profile.languageScore = faker.number.int({ min: 90, max: 145 });
  } else if (languageStatus === "other") {
    profile.languageOther = "Goethe B2";
  }
  return profile;
}

function kindOfKey(key: string): PipelineStageKind {
  if (key === "new") return "new";
  if (key === "converted") return "won";
  if (key === "churned") return "lost";
  return "open";
}

function stagePath(finalKey: string): string[] {
  if (finalKey === "churned") {
    const reachedIndex = faker.number.int({ min: 0, max: 3 });
    return [...FUNNEL_KEYS.slice(0, reachedIndex + 1), "churned"];
  }
  const index = FUNNEL_KEYS.indexOf(finalKey as (typeof FUNNEL_KEYS)[number]);
  return FUNNEL_KEYS.slice(0, Math.max(index, 0) + 1);
}

export function buildLeadSeed(
  clock: SeedClock,
  consultants: readonly Consultant[],
  countrySlugs: readonly string[],
  crm: CrmSeed,
): LeadSeed {
  const leads: Lead[] = [];
  const activities: Activity[] = [];
  const convertedCaseIds = new Map<string, string>();
  const { stageIdsByKey, lostReasonIds, tagIds } = crm;

  const finalKeys: string[] = [
    ...Array<string>(STUDENT_COUNT).fill("converted"),
    ...Array<string>(30).fill("new"),
    ...Array<string>(22).fill("first_contact"),
    ...Array<string>(18).fill("consultation_done"),
    ...Array<string>(14).fill("evaluation_proposal"),
    ...Array<string>(10).fill("contract"),
    ...Array<string>(LEAD_COUNT - STUDENT_COUNT - 94).fill("churned"),
  ];

  // A few intentional duplicate pairs (same mobile / email)
  const duplicateMobile = persianMobile();
  const duplicateEmail = asciiEmail("dup");

  finalKeys.forEach((finalKey, index) => {
    const id = uuidFromKey(`lead:${index}`);
    const source: LeadSource = weighted<LeadSource>([
      { value: "assessment", weight: 40 },
      { value: "hero_assessment", weight: 10 },
      { value: "callback", weight: 20 },
      { value: "contact", weight: 15 },
      { value: "newsletter", weight: 5 },
      { value: "booking", weight: 5 },
      { value: "manual", weight: 5 },
    ]);
    const createdMs =
      finalKey === "converted"
        ? daysAgoBetween(clock, 150, 70)
        : daysAgoBetween(clock, 120, 0);

    const assignedTo =
      finalKey === "new" && chance(0.7)
        ? null
        : finalKey === "converted" || chance(0.8)
          ? pick(consultants).id
          : null;

    const path = stagePath(finalKey);
    const transitions: Activity[] = [];
    let cursor = createdMs;
    const staffAuthor = assignedTo ?? consultants[0].id;
    let lostReasonId: string | null = null;

    for (let step = 1; step < path.length; step += 1) {
      cursor = afterHours(clock, cursor, 6, 96);
      const fromKey = path[step - 1];
      const toKey = path[step];
      const fromStageId = stageIdsByKey.get(fromKey)!;
      const toStageId = stageIdsByKey.get(toKey)!;
      let body: string | null = null;
      if (toKey === "churned") {
        lostReasonId = pick(lostReasonIds);
        body = pick(LOST_REASONS);
      }
      transitions.push({
        id: uuidFromKey(`lead:${index}:stage:${step}`),
        entityType: "lead",
        entityId: id,
        leadId: id,
        actorId: staffAuthor,
        authorId: staffAuthor,
        createdAt: iso(cursor),
        type: "stage_change",
        fromStageId,
        toStageId,
        lostReasonId: toKey === "churned" ? lostReasonId : null,
        body,
      });
    }

    const extraCount =
      finalKey === "new"
        ? faker.number.int({ min: 0, max: 1 })
        : faker.number.int({ min: 1, max: 4 });
    const extras: Activity[] = [];
    for (let n = 0; n < extraCount; n += 1) {
      const at = clampToNow(
        clock,
        createdMs + faker.number.int({ min: 1, max: 48 }) * 3_600_000 * (n + 1),
      );
      const base = {
        id: uuidFromKey(`lead:${index}:extra:${n}`),
        entityType: "lead" as const,
        entityId: id,
        leadId: id,
        actorId: staffAuthor,
        authorId: staffAuthor,
        createdAt: iso(at),
      };
      if (chance(0.5)) {
        extras.push({
          ...base,
          type: "note",
          body: pick(NOTE_POOL),
          pinned: chance(0.1),
        });
      } else {
        extras.push({
          ...base,
          type: "call",
          direction: pick(["inbound", "outbound"] as const),
          outcome: pick([
            "answered",
            "no_answer",
            "busy",
            "wrong_number",
            "callback_requested",
          ] as const),
          durationSeconds: chance(0.7)
            ? faker.number.int({ min: 20, max: 900 })
            : null,
          body: chance(0.5) ? pick(NOTE_POOL) : null,
        });
      }
    }

    const leadActivities = [...transitions, ...extras].sort((a, b) =>
      a.createdAt.localeCompare(b.createdAt),
    );
    activities.push(...leadActivities);

    const lastActivityAt = leadActivities.length
      ? leadActivities[leadActivities.length - 1].createdAt
      : iso(createdMs);
    const updatedMs = new Date(lastActivityAt).getTime();

    const hasAssessment = source === "assessment";
    const assessment = hasAssessment ? buildAssessment(countrySlugs) : null;
    const email =
      index === 1 || index === 2
        ? duplicateEmail
        : hasAssessment || source === "contact" || chance(0.25)
          ? asciiEmail("lead")
          : null;
    const mobile =
      index === 3 || index === 4 ? duplicateMobile : persianMobile();

    const preferredContact =
      hasAssessment || source === "contact"
        ? pick(["phone", "whatsapp", "email"] as const)
        : chance(0.3)
          ? "phone"
          : null;

    const targetCountries =
      assessment?.targetCountries ??
      (source === "hero_assessment" || source === "callback"
        ? [pick(countrySlugs)]
        : chance(0.4)
          ? faker.helpers.arrayElements(countrySlugs, { min: 1, max: 2 })
          : []);

    const stageId = stageIdsByKey.get(finalKey)!;
    const stageKind = kindOfKey(finalKey);

    const lead: Lead = {
      id,
      source,
      stageId,
      stageKind,
      lostReasonId: stageKind === "lost" ? lostReasonId : null,
      name: persianName(),
      mobile,
      email,
      preferredContact,
      contactPreference: preferredContact,
      message:
        source === "contact" ||
        source === "manual" ||
        (source === "callback" && chance(0.4))
          ? pick(MESSAGE_POOL)
          : null,
      interestDegree:
        assessment?.targetDegree ??
        (source === "hero_assessment" || source === "callback"
          ? pick(DEGREES)
          : null),
      interestCountry:
        targetCountries[0] ??
        (source === "hero_assessment" || source === "callback"
          ? pick(countrySlugs)
          : null),
      targetCountries,
      tagIds: faker.helpers.arrayElements(tagIds, { min: 0, max: 3 }),
      assessment,
      utm: chance(0.4)
        ? {
            source: pick(["google", "instagram", "telegram", "aparat"]),
            medium: pick(["cpc", "social", "referral"]),
            campaign: pick(["study-germany", "scholarship-2026", "ielts-offer"]),
          }
        : null,
      assignedTo,
      nextFollowUpAt:
        stageKind === "open" && chance(0.5)
          ? iso(daysAgoBetween(clock, 0, -7))
          : null,
      lastActivityAt,
      priority: pick(["low", "normal", "normal", "high"] as const),
      value:
        stageKind === "won" || chance(0.3)
          ? faker.number.int({ min: 50_000_000, max: 800_000_000 })
          : null,
      convertedCaseId: null,
      importId: null,
      archived: false,
      version: 1,
      createdAt: iso(createdMs),
      updatedAt: iso(Math.min(updatedMs, clock.now)),
    };

    if (finalKey === "converted") {
      const caseId = uuidFromKey(`case:${index}`);
      lead.convertedCaseId = caseId;
      convertedCaseIds.set(id, caseId);
    }
    leads.push(lead);
  });

  leads.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  return { leads, activities, convertedCaseIds };
}
