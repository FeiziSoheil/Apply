/**
 * Lightweight markdown → HTML for blog posts.
 * Supports: ##/### headings, paragraphs, ul/ol, **bold**, [links](url).
 * No external dependencies.
 */

export type MarkdownHeading = {
  id: string;
  text: string;
  level: 2 | 3;
};

export type ParsedMarkdown = {
  html: string;
  headings: MarkdownHeading[];
};

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function slugifyHeading(text: string, used: Set<string>): string {
  const base =
    text
      .trim()
      .toLowerCase()
      .replace(/[^\u0600-\u06FFa-z0-9\s-]/gi, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "") || "section";

  let id = base;
  let n = 2;
  while (used.has(id)) {
    id = `${base}-${n}`;
    n += 1;
  }
  used.add(id);
  return id;
}

function inlineMarkdown(text: string): string {
  let result = escapeHtml(text);

  result = result.replace(
    /\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g,
    '<a href="$2" class="text-primary underline-offset-4 hover:underline" rel="noopener noreferrer" target="_blank">$1</a>',
  );

  result = result.replace(
    /\*\*([^*]+)\*\*/g,
    "<strong>$1</strong>",
  );

  return result;
}

export function parseMarkdown(markdown: string): ParsedMarkdown {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const headings: MarkdownHeading[] = [];
  const usedIds = new Set<string>();
  const parts: string[] = [];

  let i = 0;
  while (i < lines.length) {
    const line = lines[i] ?? "";
    const trimmed = line.trim();

    if (!trimmed) {
      i += 1;
      continue;
    }

    const h2 = trimmed.match(/^##\s+(.+)$/);
    if (h2) {
      const text = h2[1].trim();
      const id = slugifyHeading(text, usedIds);
      headings.push({ id, text, level: 2 });
      parts.push(
        `<h2 id="${id}" class="scroll-mt-28 text-xl font-semibold text-foreground sm:text-2xl">${inlineMarkdown(text)}</h2>`,
      );
      i += 1;
      continue;
    }

    const h3 = trimmed.match(/^###\s+(.+)$/);
    if (h3) {
      const text = h3[1].trim();
      const id = slugifyHeading(text, usedIds);
      headings.push({ id, text, level: 3 });
      parts.push(
        `<h3 id="${id}" class="scroll-mt-28 text-lg font-semibold text-foreground">${inlineMarkdown(text)}</h3>`,
      );
      i += 1;
      continue;
    }

    if (/^[-*]\s+/.test(trimmed)) {
      const items: string[] = [];
      while (i < lines.length) {
        const itemLine = (lines[i] ?? "").trim();
        if (!/^[-*]\s+/.test(itemLine)) break;
        items.push(
          `<li>${inlineMarkdown(itemLine.replace(/^[-*]\s+/, ""))}</li>`,
        );
        i += 1;
      }
      parts.push(
        `<ul class="list-disc space-y-2 ps-5 text-muted-foreground">${items.join("")}</ul>`,
      );
      continue;
    }

    if (/^\d+\.\s+/.test(trimmed)) {
      const items: string[] = [];
      while (i < lines.length) {
        const itemLine = (lines[i] ?? "").trim();
        if (!/^\d+\.\s+/.test(itemLine)) break;
        items.push(
          `<li>${inlineMarkdown(itemLine.replace(/^\d+\.\s+/, ""))}</li>`,
        );
        i += 1;
      }
      parts.push(
        `<ol class="list-decimal space-y-2 ps-5 text-muted-foreground">${items.join("")}</ol>`,
      );
      continue;
    }

    const paragraphLines: string[] = [trimmed];
    i += 1;
    while (i < lines.length) {
      const next = (lines[i] ?? "").trim();
      if (
        !next ||
        next.startsWith("##") ||
        /^[-*]\s+/.test(next) ||
        /^\d+\.\s+/.test(next)
      ) {
        break;
      }
      paragraphLines.push(next);
      i += 1;
    }
    parts.push(
      `<p class="leading-8 text-muted-foreground">${inlineMarkdown(paragraphLines.join(" "))}</p>`,
    );
  }

  return {
    html: parts.join("\n"),
    headings,
  };
}
