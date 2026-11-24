import type { Metadata } from "next";
import { createPageMetadata } from "@/lib/seo";
import { Suspense } from "react";
import { BlogCard } from "@/components/blog/blog-card";
import { BlogFeatured } from "@/components/blog/blog-featured";
import { BlogFilters } from "@/components/blog/blog-filters";
import { BlogPagination } from "@/components/blog/blog-pagination";
import { AssessmentCta } from "@/components/shared/assessment-cta";
import { PageBreadcrumb } from "@/components/shared/page-breadcrumb";
import { PageHero } from "@/components/shared/page-hero";
import { Section } from "@/components/shared/section";
import { Skeleton } from "@/components/ui/skeleton";
import {
  blogSearchParamsCache,
  toBlogPostParams,
} from "@/lib/blog-search-params";
import {
  getBlogCategories,
  getBlogPosts,
  getFeaturedBlogPost,
} from "@/services/blog";
import type { SearchParams } from "nuqs/server";

export const metadata: Metadata = createPageMetadata({
  title: "وبلاگ",
  description:
    "راهنماها و مقالات کاربردی درباره انتخاب کشور، بورسیه، ویزا و آمادگی زبان برای تحصیل در خارج.",
  path: "/blog",
});

type PageProps = {
  searchParams: Promise<SearchParams>;
};

async function BlogContent({ searchParams }: PageProps) {
  const params = await blogSearchParamsCache.parse(searchParams);
  const filters = toBlogPostParams(params);

  const [result, categories, featured] = await Promise.all([
    getBlogPosts(filters),
    getBlogCategories(),
    getFeaturedBlogPost(),
  ]);

  const showFeatured =
    featured &&
    !params.q &&
    !params.category &&
    params.page === 1;

  const listItems = showFeatured
    ? result.items.filter((p) => p.slug !== featured.slug)
    : result.items;

  return (
    <div className="flex flex-col gap-10">
      {showFeatured ? <BlogFeatured post={featured} /> : null}

      <BlogFilters categories={categories} resultCount={result.total} />

      {listItems.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          مقاله‌ای با این فیلتر یافت نشد.
        </p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {listItems.map((post) => (
            <li key={post.id}>
              <BlogCard post={post} />
            </li>
          ))}
        </ul>
      )}

      <BlogPagination
        page={result.page}
        totalPages={result.totalPages}
        params={params}
      />
    </div>
  );
}

export default function BlogPage({ searchParams }: PageProps) {
  return (
    <div className="flex flex-col gap-8 pb-12">
      <PageBreadcrumb
        items={[{ label: "وبلاگ" }]}
      />

      <PageHero
        title="وبلاگ اِپلای"
        description="راهنماهای عملی برای انتخاب مسیر، بورسیه، ویزا و آمادگی زبان"
        primaryCta={{ label: "ارزیابی رایگان", href: "/assessment" }}
        secondaryCta={{ label: "اخبار و رویدادها", href: "/news" }}
      />

      <Section padding="none">
        <Suspense fallback={<Skeleton className="h-96 w-full" />}>
          <BlogContent searchParams={searchParams} />
        </Suspense>
      </Section>

      <AssessmentCta
        title="آماده شروع مسیر هستید؟"
        description="با ارزیابی رایگان، نقطه شروع مناسب را پیدا کنید."
      />
    </div>
  );
}
