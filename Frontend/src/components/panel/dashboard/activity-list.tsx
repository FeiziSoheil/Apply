import { Fragment } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { DashboardActivity } from "@/data/panel-dashboard";

/** «آخرین فعالیت‌ها» card */
export function ActivityList({
  items,
}: {
  items: readonly DashboardActivity[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>آخرین فعالیت‌ها</CardTitle>
        <CardDescription>رویدادهای اخیر مرتبط با شما</CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="flex flex-col gap-3">
          {items.map((item, index) => {
            const Icon = item.icon;
            return (
              <Fragment key={item.id}>
                {index > 0 ? <Separator /> : null}
                <li className="flex items-start gap-3">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                    <Icon className="size-4" aria-hidden />
                  </span>
                  <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <p className="text-sm leading-6 font-medium">{item.title}</p>
                    <p className="text-xs leading-5 text-muted-foreground">
                      {item.description}
                    </p>
                  </div>
                  <time className="shrink-0 text-xs text-muted-foreground">
                    {item.time}
                  </time>
                </li>
              </Fragment>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}
