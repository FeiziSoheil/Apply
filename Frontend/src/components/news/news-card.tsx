import Image from "next/image";
import type { NewsItem } from "@/types";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { NEWS_EVENT_TYPE_LABELS } from "@/lib/constants";
import { formatJalaliDate } from "@/lib/format";

type NewsCardProps = {
  item: NewsItem;
};

export function NewsCard({ item }: NewsCardProps) {
  return (
    <Card className="h-full overflow-hidden py-0">
      {item.coverImage ? (
        <div className="relative aspect-[16/9] w-full bg-muted">
          <Image
            src={item.coverImage}
            alt={item.title}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        </div>
      ) : null}
      <CardHeader className="gap-2 pt-4 pb-5">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">
            {NEWS_EVENT_TYPE_LABELS[item.eventType]}
          </Badge>
          {item.publishedAt ? (
            <time
              dateTime={item.publishedAt}
              className="text-xs text-muted-foreground"
            >
              {formatJalaliDate(item.publishedAt)}
            </time>
          ) : null}
        </div>
        <CardTitle className="text-base leading-snug">{item.title}</CardTitle>
        <CardDescription className="line-clamp-3">
          {item.excerpt}
        </CardDescription>
      </CardHeader>
    </Card>
  );
}
