import type { RichContent, RichNode } from "@/contracts/richcontent";
import { extractHeadings, richContentToPlainText } from "@/lib/richcontent";

export type ContentQualityIssue = {
  id: string;
  severity: "warning" | "error";
  message: string;
};

const META_TITLE_SOFT = 60;
const META_TITLE_MAX = 70;
const META_DESC_SOFT = 140;
const META_DESC_MAX = 160;

function countImagesMissingAlt(nodes: readonly RichNode[] | undefined): number {
  if (!nodes) return 0;
  let count = 0;
  for (const node of nodes) {
    if (node.type === "image") {
      const alt = typeof node.attrs.alt === "string" ? node.attrs.alt.trim() : "";
      if (!alt) count += 1;
    }
    if ("content" in node && Array.isArray(node.content)) {
      count += countImagesMissingAlt(node.content as RichNode[]);
    }
    if (node.type === "accordion") {
      for (const item of node.attrs.items) {
        count += countImagesMissingAlt(item.answer.content);
      }
    }
  }
  return count;
}

function hasCtaButton(nodes: readonly RichNode[] | undefined): boolean {
  if (!nodes) return false;
  for (const node of nodes) {
    if (node.type === "ctaButton") return true;
    if ("content" in node && Array.isArray(node.content)) {
      if (hasCtaButton(node.content as RichNode[])) return true;
    }
    if (node.type === "accordion") {
      for (const item of node.attrs.items) {
        if (hasCtaButton(item.answer.content)) return true;
      }
    }
  }
  return false;
}

function hasHeadingLevelSkip(doc: RichContent): boolean {
  const headings = extractHeadings(doc);
  for (let i = 1; i < headings.length; i += 1) {
    const prev = headings[i - 1]!;
    const curr = headings[i]!;
    if (curr.level > prev.level + 1) return true;
  }
  return false;
}

export type ContentQualityInput = {
  content: RichContent;
  excerpt?: string | null;
  coverImageAlt?: string | null;
  metaTitle?: string | null;
  metaDescription?: string | null;
  /** When false, skip the “no CTA” check (e.g. short news) */
  requireCta?: boolean;
};

/** Editorial quality checks for blog / news RichContent editors. */
export function analyzeContentQuality(
  input: ContentQualityInput,
): ContentQualityIssue[] {
  const issues: ContentQualityIssue[] = [];
  const missingAlt = countImagesMissingAlt(input.content.content);
  if (missingAlt > 0) {
    issues.push({
      id: "images-missing-alt",
      severity: "warning",
      message: `${missingAlt} تصویر در محتوا بدون متن جایگزین (alt) است.`,
    });
  }

  if (input.coverImageAlt !== undefined && !input.coverImageAlt?.trim()) {
    issues.push({
      id: "cover-missing-alt",
      severity: "warning",
      message: "تصویر شاخص بدون متن جایگزین است.",
    });
  }

  if (hasHeadingLevelSkip(input.content)) {
    issues.push({
      id: "heading-skip",
      severity: "warning",
      message: "ترتیب سرفصل‌ها پرش دارد (مثلاً H2 سپس H4).",
    });
  }

  if (!input.excerpt?.trim()) {
    issues.push({
      id: "missing-excerpt",
      severity: "error",
      message: "خلاصهٔ مطلب خالی است.",
    });
  }

  const metaTitle = input.metaTitle?.trim() ?? "";
  if (metaTitle.length === 0) {
    issues.push({
      id: "meta-title-missing",
      severity: "warning",
      message: "عنوان متا خالی است.",
    });
  } else if (metaTitle.length > META_TITLE_MAX) {
    issues.push({
      id: "meta-title-long",
      severity: "error",
      message: `عنوان متا بیش از ${META_TITLE_MAX} کاراکتر است.`,
    });
  } else if (metaTitle.length > META_TITLE_SOFT) {
    issues.push({
      id: "meta-title-soft",
      severity: "warning",
      message: `عنوان متا بهتر است زیر ${META_TITLE_SOFT} کاراکتر بماند.`,
    });
  }

  const metaDescription = input.metaDescription?.trim() ?? "";
  if (metaDescription.length === 0) {
    issues.push({
      id: "meta-desc-missing",
      severity: "warning",
      message: "توضیحات متا خالی است.",
    });
  } else if (metaDescription.length > META_DESC_MAX) {
    issues.push({
      id: "meta-desc-long",
      severity: "error",
      message: `توضیحات متا بیش از ${META_DESC_MAX} کاراکتر است.`,
    });
  } else if (metaDescription.length > META_DESC_SOFT) {
    issues.push({
      id: "meta-desc-soft",
      severity: "warning",
      message: `توضیحات متا بهتر است زیر ${META_DESC_SOFT} کاراکتر بماند.`,
    });
  }

  const requireCta = input.requireCta !== false;
  if (requireCta && richContentToPlainText(input.content).trim().length > 0) {
    if (!hasCtaButton(input.content.content)) {
      issues.push({
        id: "missing-cta",
        severity: "warning",
        message: "مقاله دکمهٔ فراخوان (CTA) ندارد.",
      });
    }
  }

  return issues;
}
