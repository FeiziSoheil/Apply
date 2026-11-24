import type { QueryKey } from "@tanstack/react-query";
import { createEntityKeys } from "@/lib/api/query-keys";
import type {
  DocumentListQuery,
  StudentCaseListQuery,
} from "@/contracts/students";

const base = createEntityKeys<Partial<StudentCaseListQuery>>(["cases"]);

export const caseKeys = {
  ...base,
  /** Cases of the logged-in student (`GET /me/cases`) */
  mine: (): QueryKey => ["cases", "mine"],
} as const;

export const documentKeys = {
  all: ["documents"] as QueryKey,
  /** Documents of one case */
  list: (caseId: string, filters?: Partial<DocumentListQuery>): QueryKey =>
    ["documents", "case", caseId, filters ?? {}],
  byCase: (caseId: string): QueryKey => ["documents", "case", caseId],
  detail: (id: string): QueryKey => ["documents", "detail", id],
} as const;

export const checklistKeys = {
  all: ["checklists"] as QueryKey,
  detail: (caseId: string): QueryKey => ["checklists", caseId],
} as const;
