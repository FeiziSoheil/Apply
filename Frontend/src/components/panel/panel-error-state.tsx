import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { cn } from "@/lib/utils";
import { PageContainer } from "./page-container";

type PanelErrorStateProps = {
  /** Persian status label, e.g. «خطای ۴۰۳» */
  code: string;
  title: string;
  description: string;
  icon: LucideIcon;
  tone?: "destructive" | "primary";
  /** Buttons / links */
  children?: ReactNode;
};

/**
 * Full-height status screen (403 / 404) rendered inside the panel shell, so
 * the sidebar and top bar stay available. Server-renderable.
 */
export function PanelErrorState({
  code,
  title,
  description,
  icon: Icon,
  tone = "primary",
  children,
}: PanelErrorStateProps) {
  return (
    <PageContainer className="justify-center">
      <Empty className="mx-auto max-w-xl flex-none border bg-card py-12 shadow-sm">
        <EmptyHeader className="max-w-md gap-3">
          <EmptyMedia
            variant="icon"
            className={cn(
              "size-16 rounded-2xl [&_svg:not([class*='size-'])]:size-8",
              tone === "destructive"
                ? "bg-destructive/10 text-destructive"
                : "bg-primary/10 text-primary",
            )}
          >
            <Icon aria-hidden />
          </EmptyMedia>
          <Badge
            variant={tone === "destructive" ? "destructive" : "secondary"}
            className="tabular-nums"
          >
            {code}
          </Badge>
          <EmptyTitle role="alert" className="text-xl font-bold">
            {title}
          </EmptyTitle>
          <EmptyDescription className="leading-7">{description}</EmptyDescription>
        </EmptyHeader>
        {children ? (
          <EmptyContent className="max-w-md flex-col gap-3 sm:flex-row sm:justify-center">
            {children}
          </EmptyContent>
        ) : null}
      </Empty>
    </PageContainer>
  );
}
