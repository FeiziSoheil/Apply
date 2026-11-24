import Image from "next/image";
import Link from "next/link";
import type { BlogPost } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatJalaliDate, toPersianDigits } from "@/lib/format";

type BlogFeaturedProps = {
  post: BlogPost;
};

export function BlogFeatured({ post }: BlogFeaturedProps) {
  return (
    <article className="grid overflow-hidden rounded-2xl border border-border bg-card md:grid-cols-2">
      <div className="relative aspect-[16/10] bg-muted md:aspect-auto md:min-h-72">
        <Image
          src={post.coverImage}
          alt={post.title}
          fill
          priority
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 50vw"
        />
      </div>
      <div className="flex flex-col justify-center gap-4 p-6 sm:p-8">
        <div className="flex flex-wrap items-center gap-2">
          <Badge>ویژه</Badge>
          <Badge variant="secondary">{post.category}</Badge>
        </div>
        <h2 className="text-balance text-2xl font-bold tracking-tight sm:text-3xl">
          <Link
            href={`/blog/${post.slug}`}
            className="hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {post.title}
          </Link>
        </h2>
        <p className="text-pretty text-muted-foreground">{post.excerpt}</p>
        <p className="text-sm text-muted-foreground">
          {post.author}
          {post.publishedAt ? ` · ${formatJalaliDate(post.publishedAt)}` : ""} ·{" "}
          {toPersianDigits(post.readingTime)} دقیقه مطالعه
        </p>
        <div>
          <Button asChild>
            <Link href={`/blog/${post.slug}`}>خواندن مقاله</Link>
          </Button>
        </div>
      </div>
    </article>
  );
}
