import type { z } from "zod";
import type {
  FileAsset,
  Pagination,
  responseMetaSchema,
} from "@/contracts/common";
import type { CurrentUser } from "@/contracts/auth";
import type { Invoice, PaymentPlan } from "@/contracts/payments";
import type { StudentEducation } from "@/contracts/student-panel";
import type { UserStatus } from "@/contracts/users";
import type { CrmDefaultsData, CrmSettingsTab } from "@/contracts/crm-settings";
import type { InstituteSettings } from "@/contracts/settings";

export type { Pagination };
export type ResponseMeta = z.infer<typeof responseMetaSchema>;

/** Account stored by the mock auth service (never serialized as-is) */
export type MockUser = CurrentUser & {
  /** Plain text — mock only. Students log in with OTP and have none. */
  password?: string;
  status: UserStatus;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
  city?: string | null;
  birthDate?: string | null;
  education?: StudentEducation;
  /** Selected case when multiple matches exist after OTP */
  activeCaseId?: string | null;
  onboardingCompleted?: boolean;
  version?: number;
};

/** Shortlist document keyed by student user id (`id === userId`) */
export type StoredShortlist = {
  id: string;
  items: Array<{
    id: string;
    programId: string | null;
    universityId: string | null;
    countrySlug?: string | null;
    addedAt: string;
  }>;
  updatedAt: string;
};

/** Payment plans stored without nested installments (joined on read) */
export type StoredPaymentPlan = Omit<PaymentPlan, "installments">;

/** Singleton institute settings document (id is fixed in seed) */
export type StoredInstituteSettings = InstituteSettings;

/** Singleton CRM settings meta (versions per tab + defaults payload) */
export type StoredCrmSettings = {
  id: string;
  versions: Record<CrmSettingsTab, number>;
  updatedAtByTab: Record<CrmSettingsTab, string>;
  defaults: CrmDefaultsData;
};

/** Invoices are stored without installments; they are joined on read */
export type StoredInvoice = Omit<Invoice, "installments">;

export type NewsletterSubscription = {
  id: string;
  mobile?: string;
  email?: string;
  createdAt: string;
};

export type StoredFile = FileAsset & { ownerId: string | null };
