import type { EntityReferenceType } from "@/contracts/richcontent";
import {
  resolveEntityReference,
  type EntityReferenceCardModel,
} from "@/services/entity-reference";
import { EntityReferenceCardView } from "./entity-reference-card-view";

type EntityReferenceCardProps = {
  entityType: EntityReferenceType;
  entityId: string;
  /** Injected for tests; when set, skips service lookup. */
  resolved?: EntityReferenceCardModel | null;
  className?: string;
};

/**
 * Public entity card. Missing entities render nothing (no error UI).
 * Async Server Component — fetch via services.
 */
export async function EntityReferenceCard({
  entityType,
  entityId,
  resolved,
  className,
}: EntityReferenceCardProps) {
  const model =
    resolved !== undefined
      ? resolved
      : await resolveEntityReference(entityType, entityId);

  if (!model) return null;

  return <EntityReferenceCardView model={model} className={className} />;
}

export { EntityReferenceCardView } from "./entity-reference-card-view";
