import type { Metadata } from "next";
import Image from "next/image";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { BlogShareButton } from "@/components/blog/blog-share-button";
import { BlogToc } from "@/components/blog/blog-toc";
import { RichContentRenderer } from "@/components/shared/richcontent/rich-content-renderer";
import { extractFaqs, extractHeadings } from "@/lib/richcontent";
import { AssessmentCta } from "@/components/shared/assessment-cta";
import { Container } from "@/components/shared/container";
import { JsonLd } from "@/components/shared/json-ld";
import { PageBreadcrumb } from "@/components/shared/page-breadcrumb";
import {
  RelatedContent,
  blogPostsToRelated,
} from "@/components/shared/related-content";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatJalaliDate, toPersianDigits } from "@/lib/format";
import {
  buildArticleJsonLd,
  buildFaqPageJsonLd,
  createPageMetadata,
} from "@/lib/seo";
import { resolveMetaDescription, resolveOgImage } from "@/lib/seo-content";
import {
  getBlogPostBySlug,
  getBlogPosts,
  getRelatedBlogPosts,
} from "@/services/blog";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  const { items } = await getBlogPosts();
  return items.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);

  if (!post) {
    return createPageMetadata({
      title: "مقاله یافت نشد",
      description: "مقاله مورد نظر یافت نشد.",
      path: `/blog/${slug}`,
      noIndex: true,
    });
  }

  const description = resolveMetaDescription({
    seo: post.seo,
    fallbacks: [post.excerpt, post.content],
  });

  return createPageMetadata({
    title: post.seo?.metaTitle ?? post.title,
    description: description || post.excerpt,
    path: `/blog/${post.slug}`,
    keywords: post.tags,
    image: resolveOgImage(post.seo, post.coverImage),
    type: "article",
    publishedTime: post.publishedAt,
    authors: [post.author],
    noIndex: post.seo?.noindex,
  });
}

async function BlogPostContent({ params }: PageProps) {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);

  if (!post) {
    notFound();
  }

  const [related, headings] = await Promise.all([
    getRelatedBlogPosts(post, 3),
    Promise.resolve(
      extractHeadings(post.content).map((h) => ({
        id: h.id,
        text: h.text,
        level: h.level,
      })),
    ),
  ]);

  const jsonLd = buildArticleJsonLd(post);
  const accordionFaqs = extractFaqs(post.content);
  const faqJsonLd =
    accordionFaqs.length > 0
      ? buildFaqPageJsonLd(
          accordionFaqs.map((faq, index) => ({
            id: `blog-faq-${index}`,
            question: faq.question,
            answer: faq.answer,
          })),
        )
      : null;

  return (
    <article className="flex flex-col gap-8 pb-12">
      <JsonLd data={jsonLd} />
      {faqJsonLd ? <JsonLd data={faqJsonLd} /> : null}

      <PageBreadcrumb
        items={[
          { label: "وبلاگ", href: "/blog" },
          { label: post.title },
        ]}
      />

      <Container className="flex flex-col gap-8">
        <header className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">{post.category}</Badge>
            {post.publishedAt ? (
              <time
                dateTime={post.publishedAt}
                className="text-sm text-muted-foreground"
              >
                {formatJalaliDate(post.publishedAt, "d MMMM yyyy")}
              </time>
            ) : null}
            <span className="text-sm text-muted-foreground">
              {toPersianDigits(post.readingTime)} دقیقه مطالعه
            </span>
          </div>
          <h1 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl">
            {post.title}
          </h1>
          <p className="max-w-2xl text-pretty text-lg text-muted-foreground">
            {post.excerpt}
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-sm text-muted-foreground">نویسنده: {post.author}</p>
            <BlogShareButton title={post.title} />
          </div>
        </header>

        <div className="relative aspect-[21/9] w-full overflow-hidden rounded-2xl bg-muted">
          <Image
            src={post.coverImage}
            alt={post.title}
            fill
            priority
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 1152px"
          />
        </div>

        {headings.length > 0 ? (
          <div className="lg:hidden">
            <BlogToc headings={headings} className="static" />
          </div>
        ) : null}

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_14rem] lg:items-start">
          <RichContentRenderer doc={post.content} />
          <aside className="hidden lg:block">
            <BlogToc headings={headings} />
          </aside>
        </div>
      </Container>

      <RelatedContent
        title="مقالات مرتبط"
        items={blogPostsToRelated(related)}
      />

      <AssessmentCta
        title="از این مطلب به برنامه عملی برسید"
        description="با ارزیابی رایگان، مسیر پذیرش مناسب وضعیت خود را پیدا کنید."
      />
    </article>
  );
}

export default function BlogPostPage({ params }: PageProps) {
  return (
    <Suspense fallback={<Skeleton className="h-96 w-full" />}>
      <BlogPostContent params={params} />
    </Suspense>
  );
}
