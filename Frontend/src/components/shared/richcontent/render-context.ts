import type { ResolveFileUrl } from "@/lib/files/resolve-file-url";
import type { EntityReferenceCardModel } from "@/services/entity-reference";
import type { EntityReferenceType } from "@/contracts/richcontent";

export type RichRenderContext = {
  headingId: (text: string) => string;
  resolveFileUrl: ResolveFileUrl;
  /**
   * Optional sync resolver for tests / client preview.
   * When omitted on the server, `EntityReferenceCard` fetches via services.
   */
  resolveEntity?: (
    entityType: EntityReferenceType,
    entityId: string,
  ) => EntityReferenceCardModel | null | undefined;
  /** When true, unknown nodes log a console.warn (development). */
  warnUnknown?: boolean;
};
