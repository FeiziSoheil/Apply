"use client";

import type { ReactNode } from "react";
import { AlertCircle, Inbox, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { getApiErrorMessage } from "@/lib/api/errors";
import { PageContainer } from "@/components/panel/page-container";
import { cn } from "@/lib/utils";

export function StudentPanelSkeleton({
  className,
  rows = 4,
}: {
  className?: string;
  rows?: number;
}) {
  return (
    <PageContainer
      role="status"
      aria-busy="true"
      aria-label="در حال بارگذاری"
      className={className}
    >
      <Skeleton className="h-10 w-48 max-w-full" />
      <Skeleton className="h-24 w-full" />
      {Array.from({ length: rows }, (_, index) => (
        <Skeleton key={index} className="h-20 w-full" />
      ))}
    </PageContainer>
  );
}

export function StudentPanelError({
  error,
  onRetry,
  title = "مشکلی پیش آمد",
}: {
  error: unknown;
  onRetry?: () => void;
  title?: string;
}) {
  return (
    <PageContainer className="justify-center">
      <Empty className="mx-auto max-w-md flex-none border bg-card py-10">
        <EmptyHeader>
          <EmptyMedia variant="icon" className="bg-destructive/10 text-destructive">
            <AlertCircle aria-hidden />
          </EmptyMedia>
          <EmptyTitle role="alert">{title}</EmptyTitle>
          <EmptyDescription>
            {getApiErrorMessage(error, "لطفاً دوباره تلاش کنید.")}
          </EmptyDescription>
        </EmptyHeader>
        {onRetry ? (
          <EmptyContent>
            <Button
              type="button"
              variant="outline"
              className="min-h-11"
              onClick={onRetry}
            >
              <RefreshCw data-icon="inline-start" aria-hidden />
              تلاش دوباره
            </Button>
          </EmptyContent>
        ) : null}
      </Empty>
    </PageContainer>
  );
}

export function StudentPanelEmpty({
  title,
  description,
  icon: Icon = Inbox,
  children,
  className,
}: {
  title: string;
  description: string;
  icon?: typeof Inbox;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <Empty
      className={cn(
        "mx-auto max-w-md flex-none border bg-card py-10",
        className,
      )}
    >
      <EmptyHeader>
        <EmptyMedia variant="icon" className="bg-primary/10 text-primary">
          <Icon aria-hidden />
        </EmptyMedia>
        <EmptyTitle>{title}</EmptyTitle>
        <EmptyDescription>{description}</EmptyDescription>
      </EmptyHeader>
      {children ? <EmptyContent>{children}</EmptyContent> : null}
    </Empty>
  );
}
