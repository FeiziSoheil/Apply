import Link from "next/link";
import type { BlogPost } from "@/types";
import { Section } from "@/components/shared/section";
import { FadeIn } from "@/components/home/fade-in";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatJalaliDate, toPersianDigits } from "@/lib/format";

type LatestArticlesProps = {
  posts: BlogPost[];
};

export function LatestArticles({ posts }: LatestArticlesProps) {
  return (
    <Section title="آخرین مقالات"
      subtitle="راهنما و نکات کاربردی برای مسیر تحصیل در خارج"
      className="bg-muted/40"
      headerAction={
        <Button asChild variant="outline" size="sm">
          <Link href="/blog">وبلاگ</Link>
        </Button>
      }
    >
      <FadeIn>
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <li key={post.id}>
              <Card className="h-full">
                <CardHeader>
                  <p className="text-xs text-muted-foreground">
                    {post.publishedAt
                      ? `${formatJalaliDate(post.publishedAt)} · `
                      : ""}
                    {toPersianDigits(post.readingTime)} دقیقه مطالعه
                  </p>
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
                <CardContent>
                  <p className="text-xs text-muted-foreground">
                    {post.category} · {post.author}
                  </p>
                </CardContent>
                <CardFooter>
                  <Button asChild variant="outline" size="sm" className="w-full">
                    <Link href={`/blog/${post.slug}`}>ادامه مطلب</Link>
                  </Button>
                </CardFooter>
              </Card>
            </li>
          ))}
        </ul>
      </FadeIn>
    </Section>
  );
}
