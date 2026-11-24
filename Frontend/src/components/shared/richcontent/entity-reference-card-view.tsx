import Image from "next/image";
import Link from "next/link";
import type { EntityReferenceType } from "@/contracts/richcontent";
import type { EntityReferenceCardModel } from "@/services/entity-reference";
import { cn } from "@/lib/utils";

export const ENTITY_TYPE_LABELS: Record<EntityReferenceType, string> = {
  country: "کشور",
  university: "دانشگاه",
  program: "رشته",
  service: "خدمت",
  "blog-post": "مقاله",
};

/** Presentational entity card (safe for client + server). */
export function EntityReferenceCardView({
  model,
  className,
}: {
  model: EntityReferenceCardModel;
  className?: string;
}) {
  return (
    <div className={className}>
      <Link
        href={model.href}
        className={cn(
          "flex gap-3 overflow-hidden rounded-lg border border-border bg-card text-card-foreground no-underline transition-colors hover:bg-muted/40",
        )}
      >
        {model.imageSrc ? (
          <div className="relative hidden w-28 shrink-0 bg-muted sm:block">
            <Image
              src={model.imageSrc}
              alt=""
              fill
              className="object-cover"
              sizes="7rem"
            />
          </div>
        ) : null}
        <div className="flex min-w-0 flex-1 flex-col gap-1 p-3">
          <p className="text-xs text-muted-foreground">
            {ENTITY_TYPE_LABELS[model.entityType]}
          </p>
          <p className="font-medium text-foreground">{model.title}</p>
          {model.meta ? (
            <p className="text-xs text-muted-foreground">{model.meta}</p>
          ) : null}
          {model.description ? (
            <p className="line-clamp-2 text-sm text-muted-foreground">
              {model.description}
            </p>
          ) : null}
        </div>
      </Link>
    </div>
  );
}
