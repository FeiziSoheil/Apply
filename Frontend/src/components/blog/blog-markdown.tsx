import { parseMarkdown } from "@/lib/markdown";
import { cn } from "@/lib/utils";

type BlogMarkdownProps = {
  content: string;
  className?: string;
};

export function BlogMarkdown({ content, className }: BlogMarkdownProps) {
  const { html } = parseMarkdown(content);

  return (
    <div
      className={cn("flex flex-col gap-5", className)}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

export function getMarkdownHeadings(content: string) {
  return parseMarkdown(content).headings;
}
