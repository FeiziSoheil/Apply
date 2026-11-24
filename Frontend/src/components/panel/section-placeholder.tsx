"use client";

import { Construction } from "lucide-react";
import { useSession } from "@/components/auth/auth-provider";
import { ForbiddenPage } from "@/components/rbac/forbidden-page";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { AREA_LABELS } from "@/lib/auth/role-labels";
import { type AuthArea } from "@/lib/auth/routes";
import { userCan } from "@/lib/rbac/can";
import { DemoAction } from "./demo-action";
import { AREA_BASE_PATH, findSection } from "./nav-config";
import { PageContainer } from "./page-container";
import { PageHeader } from "./page-header";

/**
 * Placeholder of a section that is not built yet (`/admin/[...slug]`,
 * `/panel/[...slug]`): `PageHeader` + placeholder content. Besides holding the
 * place in the menu it:
 * - refuses users who lack the section's permission (403 page — a direct URL
 *   cannot bypass the hidden menu entry), and
 * - shows the section's sensitive actions behind `<Can>` as a living example
 *   of the pattern (assign / change status / delete).
 */
export function SectionPlaceholder({
  area,
  slug,
}: {
  area: AuthArea;
  slug: string;
}) {
  const { user } = useSession();
  const section = findSection(area, slug);
  if (!section || !user) return null;

  if (!userCan(user, section.permissions ?? [])) {
    return (
      <ForbiddenPage
        areaLabel={section.label}
        homeHref={AREA_BASE_PATH[area]}
        homeLabel={`بازگشت به ${AREA_LABELS[area]}`}
      />
    );
  }

  const Icon = section.icon;
  const actions = section.actions ?? [];
  const headerAction = section.headerAction;

  return (
    <PageContainer>
      <PageHeader
        title={section.label}
        description={section.description}
        actions={
          headerAction ? (
            <DemoAction
              label={headerAction.label}
              icon={headerAction.icon}
              permission={headerAction.permission}
              tone="primary"
            />
          ) : null
        }
      />

      <Empty className="border bg-card py-16">
        <EmptyHeader>
          <EmptyMedia variant="icon" className="size-12 rounded-xl [&_svg:not([class*='size-'])]:size-6">
            <Icon aria-hidden />
          </EmptyMedia>
          <EmptyTitle className="text-base">
            بخش «{section.label}» در حال آماده‌سازی است
          </EmptyTitle>
          <EmptyDescription>
            <Construction className="me-1 inline size-4 align-text-bottom" aria-hidden />
            به‌زودی محتوای این بخش در دسترس خواهد بود.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>

      {actions.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle id={`actions-${area}-${slug}`}>
              اقدامات مجاز برای نقش شما
            </CardTitle>
            <CardDescription>
              فقط اقداماتی که دسترسی آن‌ها را دارید نمایش داده می‌شود.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div
              role="group"
              aria-labelledby={`actions-${area}-${slug}`}
              className="flex flex-wrap gap-2"
            >
              {actions.map((action) => (
                <DemoAction
                  key={action.id}
                  label={action.label}
                  permission={action.permission}
                  tone={action.tone}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      ) : null}
    </PageContainer>
  );
}
