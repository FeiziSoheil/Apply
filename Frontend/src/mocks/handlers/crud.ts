import type { PublicationStatus, ReorderBody } from "@/contracts/content";
import { defineRoute, type HandlerContext, type RouteImplementation } from "../contract";
import type { MockDb } from "../db";
import { getDb } from "../db";
import { hasPermission } from "../domain/users";
import { apiError } from "../errors";
import type { Repo } from "../store";
import {
  compact,
  created,
  matchesQuery,
  newId,
  noContent,
  nowIso,
  ok,
  pageResult,
  resolveSort,
  sortItems,
  type SortAccessors,
} from "../utils";

type ListQueryBase = {
  page: number;
  pageSize: number;
  q?: string;
  sort?: string;
  order: "asc" | "desc";
};

type ContentEntity = { id: string; createdAt: string; updatedAt: string };

type Publishable = {
  status: PublicationStatus;
  publishedAt?: string;
  scheduledAt?: string;
};

/**
 * On read: `scheduled` becomes `published` when `scheduledAt` is due.
 * Persists the transition so subsequent reads stay consistent.
 */
export function resolvePublicationStatus<T extends Publishable>(
  item: T,
  persist?: (next: T) => void,
): T {
  if (item.status !== "scheduled" || !item.scheduledAt) return item;
  if (Date.parse(item.scheduledAt) > Date.now()) return item;
  const next = {
    ...item,
    status: "published" as const,
    publishedAt: item.publishedAt ?? item.scheduledAt,
  };
  persist?.(next);
  return next;
}

export type ContentResource<
  E extends ContentEntity,
  C extends object,
  U extends object,
  Q extends ListQueryBase,
> = {
  /** PascalCase names used in operationIds: `list${plural}`, `create${singular}` … */
  singular: string;
  plural: string;
  /** Persian noun for error messages */
  label: string;
  repo: (db: MockDb) => Repo<E>;
  bySlug?: boolean;
  slugOf?: (item: E) => string | undefined;
  /** Publication status of editorial content (public callers see `published` only) */
  statusOf?: (item: E) => PublicationStatus;
  /** When set, scheduled→published is computed on read */
  publishable?: boolean;
  /** `staff` is true for admin / consultant callers (publication `status` filters only apply to them) */
  filter?: (item: E, query: Q, staff: boolean) => boolean;
  searchText: (item: E) => ReadonlyArray<string | null | undefined>;
  sorters: SortAccessors<E>;
  defaultSort?: { sort: string; order: "asc" | "desc" };
  /** Replaces the generic sort (e.g. program presets) */
  order?: (items: E[], query: Q) => E[];
  create: (
    input: C,
    base: { id: string; now: string },
    ctx: { user: HandlerContext["user"] },
  ) => E;
  merge: (
    current: E,
    patch: U,
    now: string,
    ctx: { user: HandlerContext["user"] },
  ) => E;
  /** Decorate an entity on the way out (computed fields) */
  present?: (item: E, db: MockDb) => E;
  beforeDelete?: (item: E, db: MockDb) => void;
  /** Side-effects after a successful update (e.g. cascade slug to dependents) */
  afterUpdate?: (args: {
    previous: E;
    next: E;
    db: MockDb;
    now: string;
  }) => void;
  /** Enable `reorder${plural}` when the entity has an `order` field */
  reorderable?: boolean;
};

/** `{ question, answer }[]` → same with fresh ids (embedded Faq / CostBreakdownItem) */
export function withIds<T extends object>(items: readonly T[]): Array<T & { id: string }> {
  return items.map((item) => ({ ...item, id: newId() }));
}

/** Build the six standard CRUD implementations of a content resource */
export function contentResource<
  E extends ContentEntity,
  C extends object,
  U extends object,
  Q extends ListQueryBase,
>(config: ContentResource<E, C, U, Q>): Record<string, RouteImplementation> {
  const { singular, plural, label } = config;

  const canSeeUnpublished = (ctx: { user: HandlerContext["user"] }) =>
    ctx.user !== null && hasPermission(ctx.user, "content:read");

  const materialize = (item: E, repo: Repo<E>): E => {
    if (!config.publishable) return item;
    return resolvePublicationStatus(
      item as E & Publishable,
      (next) => {
        repo.update(next.id, next as E);
      },
    ) as E;
  };

  const visible = (item: E, ctx: { user: HandlerContext["user"] }) =>
    !config.statusOf ||
    canSeeUnpublished(ctx) ||
    config.statusOf(item) === "published";
  const present = (item: E, db: MockDb) =>
    config.present ? config.present(item, db) : item;

  const requireVisible = (item: E | undefined, ctx: { user: HandlerContext["user"] }): E => {
    if (!item || !visible(item, ctx)) throw apiError.notFound(label);
    return item;
  };

  const assertSlugFree = (
    repo: Repo<E>,
    slug: string | undefined,
    exceptId?: string,
  ) => {
    if (!slug || !config.slugOf) return;
    const clash = repo.find(
      (item) => item.id !== exceptId && config.slugOf?.(item) === slug,
    );
    if (clash) {
      throw apiError.conflict("این اسلاگ قبلاً استفاده شده است", {
        slug: ["این اسلاگ قبلاً استفاده شده است"],
      });
    }
  };

  const implementations: Record<string, RouteImplementation> = {
    [`list${plural}`]: defineRoute<{ query: Q }>((ctx) => {
      const db = getDb();
      const repo = config.repo(db);
      const { query } = ctx;
      let items = repo
        .all()
        .map((item) => materialize(item, repo))
        .filter((item) => visible(item, ctx))
        .filter((item) => matchesQuery(query.q, config.searchText(item)))
        .filter((item) =>
          config.filter ? config.filter(item, query, canSeeUnpublished(ctx)) : true,
        );

      items = config.order
        ? config.order(items, query)
        : sortItems(
            items,
            config.defaultSort ? resolveSort(query, config.defaultSort).sort : query.sort,
            config.defaultSort ? resolveSort(query, config.defaultSort).order : query.order,
            config.sorters,
          );
      return pageResult(
        items.map((item) => present(item, db)),
        query,
      );
    }),

    [`create${singular}`]: defineRoute<{ body: C }>((ctx) => {
      const db = getDb();
      const repo = config.repo(db);
      const entity = config.create(
        ctx.body,
        { id: newId(), now: nowIso() },
        { user: ctx.user },
      );
      assertSlugFree(repo, config.slugOf?.(entity));
      return created(present(repo.insert(entity), db));
    }),

    [`get${singular}`]: defineRoute<{ params: { id: string } }>((ctx) => {
      const db = getDb();
      const repo = config.repo(db);
      const raw = repo.get(ctx.params.id);
      if (!raw) throw apiError.notFound(label);
      const item = materialize(raw, repo);
      return ok(present(requireVisible(item, ctx), db));
    }),

    [`update${singular}`]: defineRoute<{ params: { id: string }; body: U }>(
      (ctx) => {
        const db = getDb();
        const repo = config.repo(db);
        const current = repo.get(ctx.params.id);
        if (!current) throw apiError.notFound(label);
        const now = nowIso();
        const next = config.merge(current, ctx.body, now, {
          user: ctx.user,
        });
        assertSlugFree(repo, config.slugOf?.(next), current.id);
        repo.update(current.id, next);
        config.afterUpdate?.({ previous: current, next, db, now });
        return ok(present(next, db));
      },
    ),

    [`delete${singular}`]: defineRoute<{ params: { id: string } }>(({ params }) => {
      const db = getDb();
      const repo = config.repo(db);
      const current = repo.get(params.id);
      if (!current) throw apiError.notFound(label);
      config.beforeDelete?.(current, db);
      repo.remove(current.id);
      return noContent();
    }),
  };

  if (config.bySlug && config.slugOf) {
    const slugOf = config.slugOf;
    implementations[`get${singular}BySlug`] = defineRoute<{ params: { slug: string } }>(
      (ctx) => {
        const db = getDb();
        const repo = config.repo(db);
        const found = repo.find((item) => slugOf(item) === ctx.params.slug);
        if (!found) throw apiError.notFound(label);
        const item = materialize(found, repo);
        return ok(present(requireVisible(item, ctx), db));
      },
    );

    implementations[`check${singular}SlugAvailable`] = defineRoute<{
      query: { slug: string; excludeId?: string };
    }>((ctx) => {
      const db = getDb();
      const { slug, excludeId } = ctx.query;
      const clash = config.repo(db).find(
        (item) => item.id !== excludeId && slugOf(item) === slug,
      );
      return ok({ slug, available: !clash });
    });
  }

  if (config.reorderable) {
    implementations[`reorder${plural}`] = defineRoute<{ body: ReorderBody }>((ctx) => {
      const db = getDb();
      const repo = config.repo(db);
      let updated = 0;
      for (const entry of ctx.body.items) {
        const current = repo.get(entry.id);
        if (!current) continue;
        repo.update(entry.id, {
          ...current,
          order: entry.order,
          updatedAt: nowIso(),
        } as E);
        updated += 1;
      }
      return ok({ updated });
    });
  }

  return implementations;
}

export { compact };
