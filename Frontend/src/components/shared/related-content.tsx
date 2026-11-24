import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Container } from "@/components/shared/container";
import { formatJalaliDate, toPersianDigits } from "@/lib/format";
import { cn } from "@/lib/utils";

export type RelatedContentItem = {
  id: string;
  href: string;
  title: string;
  description?: string;
  meta?: string;
  imageSrc?: string;
  imageAlt?: string;
};

type RelatedContentProps = {
  items: RelatedContentItem[];
  title?: string;
  emptyMessage?: string;
  className?: string;
};

export function RelatedContent({
  items,
  title = "محتوای مرتبط",
  emptyMessage = "مطلب مرتبطی یافت نشد.",
  className,
}: RelatedContentProps) {
  return (
    <Container>
      <section className={cn("flex flex-col gap-6", className)}>
        <h2 className="text-xl font-semibold text-foreground sm:text-2xl">
          {title}
        </h2>
        {items.length === 0 ? (
          <p className="text-muted-foreground">{emptyMessage}</p>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => (
              <li key={item.id}>
                <Card className="h-full overflow-hidden py-0">
                  {item.imageSrc ? (
                    <div className="relative aspect-[16/9] w-full bg-muted">
                      <Image
                        src={item.imageSrc}
                        alt={item.imageAlt ?? item.title}
                        fill
                        className="object-cover"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      />
                    </div>
                  ) : null}
                  <CardHeader className="pt-4">
                    {item.meta ? (
                      <p className="text-xs text-muted-foreground">{item.meta}</p>
                    ) : null}
                    <CardTitle className="text-base leading-snug">
                      <Link
                        href={item.href}
                        className="hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        {item.title}
                      </Link>
                    </CardTitle>
                    {item.description ? (
                      <CardDescription className="line-clamp-2">
                        {item.description}
                      </CardDescription>
                    ) : null}
                  </CardHeader>
                  <CardFooter className="pb-4">
                    <Button asChild variant="outline" size="sm" className="w-full">
                      <Link href={item.href}>ادامه مطلب</Link>
                    </Button>
                  </CardFooter>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>
    </Container>
  );
}

/** Map blog posts to RelatedContent items */
export function blogPostsToRelated(
  posts: {
    id: string;
    slug: string;
    title: string;
    excerpt: string;
    publishedAt?: string;
    readingTime: number;
    coverImage: string;
  }[],
): RelatedContentItem[] {
  return posts.map((post) => ({
    id: post.id,
    href: `/blog/${post.slug}`,
    title: post.title,
    description: post.excerpt,
    meta: post.publishedAt
      ? `${formatJalaliDate(post.publishedAt)} · ${toPersianDigits(post.readingTime)} دقیقه مطالعه`
      : `${toPersianDigits(post.readingTime)} دقیقه مطالعه`,
    imageSrc: post.coverImage,
    imageAlt: post.title,
  }));
}
