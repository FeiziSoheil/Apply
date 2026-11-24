import { factory, primaryKey } from "@mswjs/data";

/**
 * Thin typed repository layer over `@mswjs/data`.
 *
 * Contract entities contain nested objects / arrays of objects, which
 * `@mswjs/data` model definitions cannot type. Every model is therefore
 * `{ id, doc }` where `doc` is the JSON of the contract entity — `@mswjs/data`
 * is the in-memory store (primary keys, queries, deletes), and the repository
 * gives callers fully typed contract entities.
 */

const model = () => ({
  id: primaryKey(String),
  doc: String,
});

export function createModels() {
  return factory({
    user: model(),
    country: model(),
    university: model(),
    program: model(),
    service: model(),
    consultant: model(),
    successStory: model(),
    blogCategory: model(),
    blogPost: model(),
    newsItem: model(),
    faq: model(),
    lead: model(),
    activity: model(),
    booking: model(),
    bookingChange: model(),
    consultantAvailability: model(),
    globalHoliday: model(),
    studentCase: model(),
    document: model(),
    checklistItem: model(),
    file: model(),
    ticket: model(),
    ticketMessage: model(),
    invoice: model(),
    installment: model(),
    paymentPlan: model(),
    paymentAttempt: model(),
    announcement: model(),
    shortlist: model(),
    newsletter: model(),
    instituteSettings: model(),
    pipelineStage: model(),
    lostReason: model(),
    tag: model(),
    task: model(),
    assignmentRule: model(),
    messageTemplate: model(),
    caseTemplate: model(),
    campaignCost: model(),
    crmSettings: model(),
    savedView: model(),
    notification: model(),
    notificationPreferences: model(),
    auditLog: model(),
    privacyRequest: model(),
  });
}

type Models = ReturnType<typeof createModels>;
export type ModelName = keyof Models;

type Row = { id: string; doc: string };

/** Structural subset of the `@mswjs/data` model API that the repository uses */
type RowModel = {
  create(values: Row): unknown;
  getAll(): Row[];
  findFirst(query: { where: { id: { equals: string } } }): Row | null;
  update(query: {
    where: { id: { equals: string } };
    data: { doc: string };
  }): unknown;
  delete(query: { where: { id: { equals: string } } }): unknown;
  deleteMany(query: { where: { id: { in: string[] } } }): unknown;
  count(): number;
};

export type Repo<T extends { id: string }> = {
  all(): T[];
  get(id: string): T | undefined;
  find(predicate: (item: T) => boolean): T | undefined;
  filter(predicate: (item: T) => boolean): T[];
  has(id: string): boolean;
  count(): number;
  insert(entity: T): T;
  insertMany(entities: readonly T[]): void;
  /** Merge `patch` into the stored entity; throws when the id is unknown */
  update(id: string, patch: Partial<T>): T;
  remove(id: string): boolean;
  removeWhere(predicate: (item: T) => boolean): number;
  clear(): void;
  /** Plain entities for persistence snapshots */
  dump(): T[];
};

function byId(id: string) {
  return { where: { id: { equals: id } } };
}

export function createRepo<T extends { id: string }>(
  models: Models,
  name: ModelName,
): Repo<T> {
  const rows = models[name] as unknown as RowModel;
  const parse = (row: Row): T => JSON.parse(row.doc) as T;
  /** Avoid re-parsing every JSON doc on each list/filter call (CRM 5k+ leads). */
  let allCache: T[] | null = null;
  const invalidate = () => {
    allCache = null;
  };

  const repo: Repo<T> = {
    all: () => {
      if (!allCache) allCache = rows.getAll().map(parse);
      return allCache;
    },
    get(id) {
      const row = rows.findFirst(byId(id));
      return row ? parse(row) : undefined;
    },
    find: (predicate) => repo.all().find(predicate),
    filter: (predicate) => repo.all().filter(predicate),
    has: (id) => rows.findFirst(byId(id)) !== null,
    count: () => rows.count(),
    insert(entity) {
      if (rows.findFirst(byId(entity.id))) {
        throw new Error(`[mock] duplicate id in "${String(name)}": ${entity.id}`);
      }
      rows.create({ id: entity.id, doc: JSON.stringify(entity) });
      invalidate();
      return entity;
    },
    insertMany(entities) {
      if (!Array.isArray(entities)) {
        throw new Error(
          `[mock] insertMany("${String(name)}") expected an array, got ${entities === null ? "null" : typeof entities}`,
        );
      }
      for (const entity of entities) {
        if (rows.findFirst(byId(entity.id))) {
          throw new Error(
            `[mock] duplicate id in "${String(name)}": ${entity.id}`,
          );
        }
        rows.create({ id: entity.id, doc: JSON.stringify(entity) });
      }
      invalidate();
    },
    update(id, patch) {
      const current = repo.get(id);
      if (!current) {
        throw new Error(`[mock] "${String(name)}" ${id} does not exist`);
      }
      const next: T = { ...current, ...patch, id };
      rows.update({ where: { id: { equals: id } }, data: { doc: JSON.stringify(next) } });
      invalidate();
      return next;
    },
    remove(id) {
      if (!rows.findFirst(byId(id))) return false;
      rows.delete(byId(id));
      invalidate();
      return true;
    },
    removeWhere(predicate) {
      const ids = repo.filter(predicate).map((item) => item.id);
      if (ids.length > 0) {
        rows.deleteMany({ where: { id: { in: ids } } });
        invalidate();
      }
      return ids.length;
    },
    clear() {
      const ids = rows.getAll().map((row) => row.id);
      if (ids.length > 0) rows.deleteMany({ where: { id: { in: ids } } });
      invalidate();
    },
    dump: () => repo.all(),
  };
  return repo;
}
