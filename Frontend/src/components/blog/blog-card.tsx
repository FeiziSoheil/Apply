import Image from "next/image";
import Link from "next/link";
import type { BlogPost } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatJalaliDate, toPersianDigits } from "@/lib/format";

type BlogCardProps = {
  post: BlogPost;
};

export function BlogCard({ post }: BlogCardProps) {
  return (
    <Card className="h-full overflow-hidden py-0">
      <div className="relative aspect-[16/9] w-full bg-muted">
        <Image
          src={post.coverImage}
          alt={post.title}
          fill
          className="object-cover"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />
      </div>
      <CardHeader className="gap-2 pt-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">{post.category}</Badge>
          <span className="text-xs text-muted-foreground">
            {post.publishedAt ? `${formatJalaliDate(post.publishedAt)} · ` : ""}
            {toPersianDigits(post.readingTime)} دقیقه
          </span>
        </div>
        <CardTitle className="text-base leading-snug">
          <Link
            href={`/blog/${post.slug}`}
            className="hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {post.title}
          </Link>
        </CardTitle>
        <CardDescription className="line-clamp-2">
          {post.excerpt}
        </CardDescription>
      </CardHeader>
      <CardFooter className="pb-4">
        <Button asChild variant="outline" size="sm" className="w-full">
          <Link href={`/blog/${post.slug}`}>ادامه مطلب</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
