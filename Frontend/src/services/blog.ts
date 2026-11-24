import { blogPosts } from "@/data/blog";
import { mockDelay } from "@/lib/mock-delay";
import { paginate } from "@/lib/pagination";
import type { BlogPost, BlogPostParams, PaginatedResult } from "@/types";

function sortByPublishedDesc(posts: BlogPost[]): BlogPost[] {
  return [...posts].sort(
    (a, b) =>
      new Date(b.publishedAt ?? 0).getTime() -
      new Date(a.publishedAt ?? 0).getTime(),
  );
}

function filterBlogPosts(params: BlogPostParams = {}): BlogPost[] {
  const search = params.search?.trim().toLowerCase();
  const tag = params.tag?.trim().toLowerCase();

  return sortByPublishedDesc(
    blogPosts.filter((post) => {
      if (params.category && post.category !== params.category) {
        return false;
      }
      if (tag && !post.tags.some((t) => t.toLowerCase() === tag)) {
        return false;
      }
      if (search) {
        const haystack =
          `${post.title} ${post.excerpt} ${post.tags.join(" ")}`.toLowerCase();
        if (!haystack.includes(search)) {
          return false;
        }
      }
      return true;
    }),
  );
}

export async function getBlogPosts(
  params: BlogPostParams = {},
): Promise<PaginatedResult<BlogPost>> {
  "use cache";
  await mockDelay();
  return paginate(filterBlogPosts(params), params);
}

export async function getBlogPostBySlug(
  slug: string,
): Promise<BlogPost | null> {
  "use cache";
  await mockDelay();
  return blogPosts.find((p) => p.slug === slug) ?? null;
}

export async function getBlogCategories(): Promise<string[]> {
  "use cache";
  await mockDelay();
  return [...new Set(blogPosts.map((p) => p.category))].sort((a, b) =>
    a.localeCompare(b, "fa"),
  );
}

/** Featured post, or newest if none flagged */
export async function getFeaturedBlogPost(): Promise<BlogPost | null> {
  "use cache";
  await mockDelay();
  const featured = blogPosts.find((p) => p.featured);
  if (featured) return featured;
  const sorted = sortByPublishedDesc(blogPosts);
  return sorted[0] ?? null;
}

export async function getRelatedBlogPosts(
  post: BlogPost,
  limit = 3,
): Promise<BlogPost[]> {
  "use cache";
  await mockDelay();

  const scored = blogPosts
    .filter((p) => p.slug !== post.slug)
    .map((p) => {
      let score = 0;
      if (p.category === post.category) score += 3;
      const sharedTags = p.tags.filter((t) => post.tags.includes(t));
      score += sharedTags.length;
      return { post: p, score };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((item) => item.post);

  if (scored.length >= limit) return scored;

  const extras = sortByPublishedDesc(blogPosts)
    .filter(
      (p) =>
        p.slug !== post.slug && !scored.some((s) => s.slug === p.slug),
    )
    .slice(0, limit - scored.length);

  return [...scored, ...extras];
}
