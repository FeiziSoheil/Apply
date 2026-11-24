import type { Metadata } from "next";
import { CONTACT, INSTITUTE, SOCIAL_LINKS } from "@/lib/constants";
import type { BlogPost, Faq, University } from "@/types";

export type SeoBreadcrumbItem = {
  label: string;
  href?: string;
};

const DEFAULT_SITE_URL = "https://apply.example";

/** Public site origin from env, without trailing slash */
export function getSiteUrl(): string {
  const raw =
    process.env.NEXT_PUBLIC_SITE_URL?.trim() || DEFAULT_SITE_URL;
  return raw.replace(/\/+$/, "");
}

export function absoluteUrl(path = "/"): string {
  if (/^https?:\/\//i.test(path)) return path;
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${getSiteUrl()}${normalized === "/" ? "" : normalized}` || getSiteUrl();
}

const DEFAULT_DESCRIPTION =
  "موسسه اعزام دانشجو به خارج از کشور — مشاوره تحصیلی، پذیرش دانشگاه، ویزا و همراهی تا شروع تحصیل.";

export type CreatePageMetadataInput = {
  title: string;
  description: string;
  /** Path starting with `/` (used for canonical + OG url) */
  path: string;
  keywords?: string[];
  image?: string;
  type?: "website" | "article";
  robots?: Metadata["robots"];
  publishedTime?: string;
  authors?: string[];
  noIndex?: boolean;
  /** Skip layout title template (e.g. home page) */
  absoluteTitle?: boolean;
};

/** Shared metadata builder: title, description, canonical, openGraph */
export function createPageMetadata({
  title,
  description,
  path,
  keywords,
  image,
  type = "website",
  robots,
  publishedTime,
  authors,
  noIndex,
  absoluteTitle = false,
}: CreatePageMetadataInput): Metadata {
  const url = absoluteUrl(path);
  const ogImage = image ? absoluteUrl(image) : undefined;

  return {
    title: absoluteTitle ? { absolute: title } : title,
    description,
    keywords,
    alternates: { canonical: url },
    robots: noIndex
      ? { index: false, follow: false }
      : robots,
    openGraph: {
      title,
      description,
      url,
      siteName: INSTITUTE.name,
      locale: "fa_IR",
      type,
      ...(ogImage ? { images: [{ url: ogImage }] } : {}),
      ...(publishedTime ? { publishedTime } : {}),
      ...(authors?.length ? { authors } : {}),
    },
    twitter: {
      card: ogImage ? "summary_large_image" : "summary",
      title,
      description,
      ...(ogImage ? { images: [ogImage] } : {}),
    },
  };
}

export function buildOrganizationJsonLd() {
  const url = getSiteUrl();
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: INSTITUTE.name,
    alternateName: INSTITUTE.nameEn,
    description: INSTITUTE.about,
    url,
    email: CONTACT.email,
    telephone: CONTACT.phoneHref.replace("tel:", ""),
    address: {
      "@type": "PostalAddress",
      streetAddress: CONTACT.address,
      addressCountry: "IR",
    },
    sameAs: SOCIAL_LINKS.map((s) => s.href),
  };
}

export function buildWebSiteJsonLd() {
  const url = getSiteUrl();
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: INSTITUTE.name,
    alternateName: INSTITUTE.nameEn,
    url,
    description: DEFAULT_DESCRIPTION,
    inLanguage: "fa-IR",
    publisher: {
      "@type": "Organization",
      name: INSTITUTE.name,
      url,
    },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${url}/programs?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

export function buildBreadcrumbJsonLd(items: SeoBreadcrumbItem[]) {
  const trail: SeoBreadcrumbItem[] = [
    { label: "خانه", href: "/" },
    ...items,
  ];

  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: trail.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.label,
      ...(item.href
        ? { item: absoluteUrl(item.href) }
        : index === trail.length - 1
          ? {}
          : {}),
    })),
  };
}

export function buildFaqPageJsonLd(faqs: Faq[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
}

export function buildArticleJsonLd(post: BlogPost) {
  const baseUrl = getSiteUrl();
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.excerpt,
    image: [absoluteUrl(post.coverImage)],
    datePublished: post.publishedAt,
    author: {
      "@type": "Person",
      name: post.author,
    },
    publisher: {
      "@type": "Organization",
      name: INSTITUTE.name,
      url: baseUrl,
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": absoluteUrl(`/blog/${post.slug}`),
    },
    articleSection: post.category,
    keywords: post.tags.join(", "),
    wordCount: Math.max(post.readingTime * 200, 100),
    inLanguage: "fa-IR",
  };
}

export function buildEducationalOrganizationJsonLd(
  university: University,
  options?: { countryNameFa?: string },
) {
  return {
    "@context": "https://schema.org",
    "@type": "EducationalOrganization",
    name: university.nameFa,
    alternateName: university.nameEn,
    description: university.summary,
    url: absoluteUrl(`/universities/${university.slug}`),
    address: {
      "@type": "PostalAddress",
      addressLocality: university.city,
      addressCountry: options?.countryNameFa ?? university.countrySlug,
    },
    ...(university.logo
      ? { logo: absoluteUrl(university.logo) }
      : {}),
    ...(university.heroImage
      ? { image: absoluteUrl(university.heroImage) }
      : university.logo
        ? { image: absoluteUrl(university.logo) }
        : {}),
  };
}
