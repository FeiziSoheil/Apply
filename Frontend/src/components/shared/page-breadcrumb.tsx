import { Fragment } from "react";
import Link from "next/link";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Container } from "@/components/shared/container";
import { JsonLd } from "@/components/shared/json-ld";
import { buildBreadcrumbJsonLd } from "@/lib/seo";
import { cn } from "@/lib/utils";

export type PageBreadcrumbItem = {
  label: string;
  href?: string;
};

type PageBreadcrumbProps = {
  items: PageBreadcrumbItem[];
  /** Prepend «خانه» automatically (default true) */
  includeHome?: boolean;
  /** Wrap in Container (default true) */
  contained?: boolean;
  /** Emit BreadcrumbList JSON-LD (default true when includeHome) */
  withJsonLd?: boolean;
  className?: string;
};

export function PageBreadcrumb({
  items,
  includeHome = true,
  contained = true,
  withJsonLd = true,
  className,
}: PageBreadcrumbProps) {
  const trail: PageBreadcrumbItem[] = includeHome
    ? [{ label: "خانه", href: "/" }, ...items]
    : items;

  if (trail.length === 0) {
    return null;
  }

  const jsonLd =
    withJsonLd && includeHome ? buildBreadcrumbJsonLd(items) : null;

  const content = (
    <>
      {jsonLd ? <JsonLd data={jsonLd} /> : null}
      <Breadcrumb className={cn("pt-6 pb-4", className)}>
        <BreadcrumbList>
          {trail.map((item, index) => {
            const isLast = index === trail.length - 1;

            return (
              <Fragment key={`${item.label}-${index}`}>
                <BreadcrumbItem>
                  {isLast || !item.href ? (
                    <BreadcrumbPage>{item.label}</BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink asChild>
                      <Link href={item.href}>{item.label}</Link>
                    </BreadcrumbLink>
                  )}
                </BreadcrumbItem>
                {!isLast ? <BreadcrumbSeparator /> : null}
              </Fragment>
            );
          })}
        </BreadcrumbList>
      </Breadcrumb>
    </>
  );

  if (!contained) {
    return content;
  }

  return <Container>{content}</Container>;
}
