import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/seo";
import { getBlogPosts } from "@/services/blog";
import { getCountries } from "@/services/countries";
import { getPrograms } from "@/services/programs";
import { getServices } from "@/services/services";
import { getUniversities } from "@/services/universities";

const STATIC_ROUTES: {
  path: string;
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
  priority: number;
}[] = [
  { path: "", changeFrequency: "weekly", priority: 1 },
  { path: "/about", changeFrequency: "monthly", priority: 0.7 },
  { path: "/team", changeFrequency: "monthly", priority: 0.6 },
  { path: "/contact", changeFrequency: "monthly", priority: 0.7 },
  { path: "/faq", changeFrequency: "weekly", priority: 0.7 },
  { path: "/process", changeFrequency: "monthly", priority: 0.6 },
  { path: "/pricing", changeFrequency: "monthly", priority: 0.7 },
  { path: "/success-stories", changeFrequency: "weekly", priority: 0.6 },
  { path: "/news", changeFrequency: "daily", priority: 0.7 },
  { path: "/blog", changeFrequency: "daily", priority: 0.8 },
  { path: "/programs", changeFrequency: "weekly", priority: 0.9 },
  { path: "/universities", changeFrequency: "weekly", priority: 0.9 },
  { path: "/countries", changeFrequency: "weekly", priority: 0.9 },
  { path: "/services", changeFrequency: "weekly", priority: 0.8 },
  { path: "/assessment", changeFrequency: "monthly", priority: 0.8 },
  { path: "/booking", changeFrequency: "monthly", priority: 0.8 },
  { path: "/privacy", changeFrequency: "yearly", priority: 0.3 },
  { path: "/terms", changeFrequency: "yearly", priority: 0.3 },
  { path: "/tools", changeFrequency: "monthly", priority: 0.6 },
  { path: "/tools/cost-calculator", changeFrequency: "monthly", priority: 0.6 },
  {
    path: "/tools/deadline-countdown",
    changeFrequency: "weekly",
    priority: 0.5,
  },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getSiteUrl();
  const now = new Date();

  const [countries, universities, programs, blog, services] = await Promise.all([
    getCountries(),
    getUniversities(),
    getPrograms(),
    getBlogPosts(),
    getServices(),
  ]);

  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map((route) => ({
    url: `${baseUrl}${route.path}`,
    lastModified: now,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));

  const countryEntries: MetadataRoute.Sitemap = countries.map((c) => ({
    url: `${baseUrl}/countries/${c.slug}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  const universityEntries: MetadataRoute.Sitemap = universities.items.map(
    (u) => ({
      url: `${baseUrl}/universities/${u.slug}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.75,
    }),
  );

  const programEntries: MetadataRoute.Sitemap = programs.items.map((p) => ({
    url: `${baseUrl}/programs/${p.slug}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  const blogEntries: MetadataRoute.Sitemap = blog.items.map((post) => ({
    url: `${baseUrl}/blog/${post.slug}`,
    lastModified: new Date(post.publishedAt ?? now),
    changeFrequency: "monthly" as const,
    priority: 0.65,
  }));

  const serviceEntries: MetadataRoute.Sitemap = services.map((s) => ({
    url: `${baseUrl}/services/${s.slug}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.75,
  }));

  return [
    ...staticEntries,
    ...countryEntries,
    ...universityEntries,
    ...programEntries,
    ...blogEntries,
    ...serviceEntries,
  ];
}
