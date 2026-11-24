"use client";

import { Fragment } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import type { AuthArea } from "@/lib/auth/routes";
import { buildBreadcrumbs } from "./nav-config";

/**
 * Breadcrumb of the current route, derived from `NAV_CONFIG`. On small
 * screens only the current page is shown to keep the top bar on one line.
 */
export function PanelBreadcrumb({ area }: { area: AuthArea }) {
  const pathname = usePathname();
  const trail = buildBreadcrumbs(area, pathname);
  const lastIndex = trail.length - 1;

  return (
    <Breadcrumb className="min-w-0">
      <BreadcrumbList className="flex-nowrap">
        {trail.map((crumb, index) => {
          const isLast = index === lastIndex;
          return (
            <Fragment key={`${index}-${crumb.label}`}>
              <BreadcrumbItem
                className={isLast ? "min-w-0" : "hidden sm:inline-flex"}
              >
                {isLast || !crumb.href ? (
                  <BreadcrumbPage className="truncate font-medium">
                    {crumb.label}
                  </BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link href={crumb.href}>{crumb.label}</Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
              {isLast ? null : (
                <BreadcrumbSeparator className="hidden sm:inline-flex" />
              )}
            </Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
