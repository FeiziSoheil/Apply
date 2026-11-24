import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { richContentSchema } from "@/contracts/richcontent";
import { blogPostCreateSchema, countryUpdateSchema } from "@/contracts/content";
import type { MockUser } from "@/mocks/types";
import { getDb, resetDb } from "@/mocks/db";
import { contentHandlers } from "./content";

const admin = {
  id: "00000000-0000-4000-8000-000000000001",
  name: "تست ادمین",
  role: "admin",
  permissions: ["content:read", "content:write", "content:delete"],
  createdAt: "2026-01-01T00:00:00.000Z",
} as MockUser;

function deepBlockquotes(depth: number): unknown {
  let node: unknown = {
    type: "paragraph",
    content: [{ type: "text", text: "عمیق" }],
  };
  for (let i = 0; i < depth; i += 1) {
    node = { type: "blockquote", content: [node] };
  }
  return { type: "doc", content: [node] };
}

describe("RichContent security (contract + public visibility)", () => {
  beforeEach(() => {
    resetDb();
  });

  afterEach(() => {
    resetDb();
  });

  it("rejects illegal node types at the contract boundary", () => {
    const result = richContentSchema.safeParse({
      type: "doc",
      content: [{ type: "codeBlock", content: [] }],
    });
    expect(result.success).toBe(false);
  });

  it("rejects javascript: links", () => {
    const result = richContentSchema.safeParse({
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: "بد",
              marks: [
                {
                  type: "link",
                  attrs: { href: "javascript:alert(1)" },
                },
              ],
            },
          ],
        },
      ],
    });
    expect(result.success).toBe(false);
  });

  it("rejects excessive nesting depth", () => {
    const result = richContentSchema.safeParse(deepBlockquotes(5));
    expect(result.success).toBe(false);
  });

  it("rejects create blog payload that embeds illegal RichContent", () => {
    const result = blogPostCreateSchema.safeParse({
      slug: "evil-post",
      title: "مقاله مخرب",
      excerpt: "خلاصه کوتاه برای تست امنیت.",
      content: {
        type: "doc",
        content: [{ type: "script", content: [] }],
      },
      category: "ویزا",
      tags: [],
      author: "تست",
      readingTime: 1,
      coverImage: "/images/covers/blog-01.svg",
      status: "draft",
    });
    expect(result.success).toBe(false);
  });

  it("rejects country update with javascript: link in a section", () => {
    const result = countryUpdateSchema.safeParse({
      sections: [
        {
          title: "ویزا",
          anchor: "visa",
          visible: true,
          content: {
            type: "doc",
            content: [
              {
                type: "paragraph",
                content: [
                  {
                    type: "text",
                    text: "لینک",
                    marks: [
                      {
                        type: "link",
                        attrs: { href: "javascript:void(0)" },
                      },
                    ],
                  },
                ],
              },
            ],
          },
        },
      ],
    });
    expect(result.success).toBe(false);
  });

  it("hides draft and future-scheduled posts from anonymous list/get", async () => {
    const list = await contentHandlers.listBlogPosts.run({
      params: undefined,
      query: { page: 1, pageSize: 100, order: "desc" },
      body: undefined,
      user: null,
      request: new Request("http://mock.test"),
      url: new URL("http://mock.test"),
      origin: "http://mock.test",
    });
    expect(list.status).toBe(200);
    const items = list.data as Array<{ slug: string; status: string }>;
    expect(items.some((item) => item.slug === "draft-visa-interview-guide")).toBe(
      false,
    );
    expect(items.some((item) => item.slug === "scheduled-tuition-update")).toBe(
      false,
    );
    expect(items.some((item) => item.slug === "how-to-choose-country")).toBe(true);

    for (const slug of [
      "draft-visa-interview-guide",
      "scheduled-tuition-update",
    ] as const) {
      let caught: unknown;
      try {
        await contentHandlers.getBlogPostBySlug.run({
          params: { slug },
          query: undefined,
          body: undefined,
          user: null,
          request: new Request("http://mock.test"),
          url: new URL("http://mock.test"),
          origin: "http://mock.test",
        });
      } catch (error) {
        caught = error;
      }
      expect(caught).toMatchObject({ code: "NOT_FOUND" });
    }
  });

  it("hides draft countries from anonymous callers", async () => {
    const list = await contentHandlers.listCountries.run({
      params: undefined,
      query: { page: 1, pageSize: 100, order: "asc" },
      body: undefined,
      user: null,
      request: new Request("http://mock.test"),
      url: new URL("http://mock.test"),
      origin: "http://mock.test",
    });
    const items = list.data as Array<{ slug: string }>;
    expect(items.some((item) => item.slug === "draft-sample-country")).toBe(false);

    const staffList = await contentHandlers.listCountries.run({
      params: undefined,
      query: { page: 1, pageSize: 100, order: "asc" },
      body: undefined,
      user: admin,
      request: new Request("http://mock.test"),
      url: new URL("http://mock.test"),
      origin: "http://mock.test",
    });
    const staffItems = staffList.data as Array<{ slug: string }>;
    expect(staffItems.some((item) => item.slug === "draft-sample-country")).toBe(
      true,
    );

    // Ensure seed still has at least one published country after reset
    expect(getDb().countries.all().some((c) => c.status === "published")).toBe(
      true,
    );
  });
});
