import {
  PageBreadcrumb,
  type PageBreadcrumbItem,
} from "@/components/shared/page-breadcrumb";
import { Container } from "@/components/shared/container";

type PageHeaderProps = {
  title: string;
  description?: string;
  breadcrumbs?: PageBreadcrumbItem[];
};

export function PageHeader({
  title,
  description,
  breadcrumbs,
}: PageHeaderProps) {
  return (
    <Container>
      <header className="flex flex-col gap-2 py-10">
        {breadcrumbs && breadcrumbs.length > 0 ? (
          <PageBreadcrumb
            items={breadcrumbs}
            contained={false}
            className="py-0 pb-2"
          />
        ) : null}
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          {title}
        </h1>
        {description ? (
          <p className="max-w-2xl text-muted-foreground">{description}</p>
        ) : null}
      </header>
    </Container>
  );
}
