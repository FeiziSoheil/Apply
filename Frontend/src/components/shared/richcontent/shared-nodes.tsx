import type { ReactNode } from "react";
import Link from "next/link";
import { Video } from "lucide-react";
import type {
  RichContent,
  RichNode,
  RichTextNode,
} from "@/contracts/richcontent";
import { toPersianDigits } from "@/lib/format";
import { cn } from "@/lib/utils";
import { AccordionBlock } from "./accordion-block";
import { ImageBlock } from "./image-block";
import type { RichRenderContext } from "./render-context";

function renderMarks(node: RichTextNode, key: number): ReactNode {
  let el: ReactNode = node.text;
  for (const mark of node.marks ?? []) {
    switch (mark.type) {
      case "bold":
        el = <strong key={`b-${key}`}>{el}</strong>;
        break;
      case "italic":
        el = <em key={`i-${key}`}>{el}</em>;
        break;
      case "underline":
        el = (
          <span className="underline" key={`u-${key}`}>
            {el}
          </span>
        );
        break;
      case "highlight":
        el = (
          <mark className="bg-warning/30 text-foreground" key={`h-${key}`}>
            {el}
          </mark>
        );
        break;
      case "link": {
        const href = mark.attrs.href;
        const external =
          href.startsWith("http://") || href.startsWith("https://");
        const rel =
          mark.attrs.rel ??
          (external || mark.attrs.target === "_blank"
            ? "noopener noreferrer"
            : undefined);
        el = (
          <a
            key={`a-${key}`}
            href={href}
            className="text-primary underline-offset-4 hover:underline"
            rel={rel}
            target={mark.attrs.target ?? (external ? "_blank" : undefined)}
          >
            {el}
          </a>
        );
        break;
      }
      default:
        break;
    }
  }
  return <span key={key}>{el}</span>;
}

function Inline({ nodes }: { nodes?: RichTextNode[] }) {
  if (!nodes?.length) return null;
  return <>{nodes.map((n, i) => renderMarks(n, i))}</>;
}

function calloutTone(type: string): string {
  switch (type) {
    case "danger":
      return "border-destructive/40 bg-destructive/5 text-foreground";
    case "warning":
      return "border-warning/40 bg-warning/10 text-foreground";
    case "success":
      return "border-success/40 bg-success/5 text-foreground";
    default:
      return "border-info/40 bg-info/5 text-foreground";
  }
}

function ctaHref(attrs: {
  type: "assessment" | "booking" | "link";
  href?: string;
}): string {
  if (attrs.type === "assessment") return "/assessment";
  if (attrs.type === "booking") return "/booking";
  return attrs.href?.trim() || "#";
}

export type RenderEntityFn = (attrs: {
  entityType: import("@/contracts/richcontent").EntityReferenceType;
  entityId: string;
}) => ReactNode;

type SharedNodesProps = {
  nodes?: RichNode[];
  ctx: RichRenderContext;
  renderEntity: RenderEntityFn;
  /** Nested RichContent (accordion answers) */
  renderDoc: (doc: RichContent) => ReactNode;
};

/** Sync whitelist node tree — entity nodes delegated via `renderEntity`. */
export function SharedRichNodes({
  nodes,
  ctx,
  renderEntity,
  renderDoc,
}: SharedNodesProps) {
  if (!nodes?.length) return null;

  return (
    <>
      {nodes.map((node, index) => (
        <SharedRichNode
          key={`${node.type}-${index}`}
          node={node}
          ctx={ctx}
          renderEntity={renderEntity}
          renderDoc={renderDoc}
        />
      ))}
    </>
  );
}

function SharedRichNode({
  node,
  ctx,
  renderEntity,
  renderDoc,
}: {
  node: RichNode;
  ctx: RichRenderContext;
  renderEntity: RenderEntityFn;
  renderDoc: (doc: RichContent) => ReactNode;
}) {
  switch (node.type) {
    case "paragraph":
      return (
        <p className="leading-8 text-foreground">
          <Inline nodes={node.content} />
        </p>
      );
    case "heading": {
      const Tag = (`h${node.attrs.level}` as "h2" | "h3" | "h4");
      const text =
        node.content?.map((n) => n.text).join("") ?? "";
      const id = text.trim() ? ctx.headingId(text.trim()) : undefined;
      const sizes =
        node.attrs.level === 2
          ? "text-2xl"
          : node.attrs.level === 3
            ? "text-xl"
            : "text-lg";
      return (
        <Tag
          id={id}
          className={cn(
            "mt-8 scroll-mt-28 font-semibold tracking-tight text-foreground first:mt-0",
            sizes,
          )}
        >
          <Inline nodes={node.content} />
        </Tag>
      );
    }
    case "bulletList":
      return (
        <ul className="list-disc space-y-2 pe-1 ps-5 text-foreground">
          <SharedRichNodes
            nodes={node.content}
            ctx={ctx}
            renderEntity={renderEntity}
            renderDoc={renderDoc}
          />
        </ul>
      );
    case "orderedList":
      return (
        <ol className="list-decimal space-y-2 pe-1 ps-5 text-foreground">
          <SharedRichNodes
            nodes={node.content}
            ctx={ctx}
            renderEntity={renderEntity}
            renderDoc={renderDoc}
          />
        </ol>
      );
    case "listItem":
      return (
        <li>
          <SharedRichNodes
            nodes={node.content}
            ctx={ctx}
            renderEntity={renderEntity}
            renderDoc={renderDoc}
          />
        </li>
      );
    case "blockquote":
      return (
        <blockquote className="border-s-4 border-primary/40 ps-4 text-muted-foreground">
          <SharedRichNodes
            nodes={node.content}
            ctx={ctx}
            renderEntity={renderEntity}
            renderDoc={renderDoc}
          />
        </blockquote>
      );
    case "horizontalRule":
      return <hr className="my-6 border-border" />;
    case "table":
      return (
        <div className="-mx-1 overflow-x-auto">
          <table className="w-full min-w-[28rem] border-collapse text-sm">
            <tbody>
              <SharedRichNodes
                nodes={node.content}
                ctx={ctx}
                renderEntity={renderEntity}
                renderDoc={renderDoc}
              />
            </tbody>
          </table>
        </div>
      );
    case "tableRow":
      return (
        <tr className="border-b border-border">
          <SharedRichNodes
            nodes={node.content}
            ctx={ctx}
            renderEntity={renderEntity}
            renderDoc={renderDoc}
          />
        </tr>
      );
    case "tableHeader":
      return (
        <th className="bg-muted/50 px-3 py-2 text-start font-medium">
          <SharedRichNodes
            nodes={node.content}
            ctx={ctx}
            renderEntity={renderEntity}
            renderDoc={renderDoc}
          />
        </th>
      );
    case "tableCell":
      return (
        <td className="px-3 py-2 align-top">
          <SharedRichNodes
            nodes={node.content}
            ctx={ctx}
            renderEntity={renderEntity}
            renderDoc={renderDoc}
          />
        </td>
      );
    case "image":
      return (
        <ImageBlock
          fileId={node.attrs.fileId}
          alt={node.attrs.alt}
          caption={node.attrs.caption}
          resolveFileUrl={ctx.resolveFileUrl}
        />
      );
    case "callout":
      return (
        <aside
          className={cn(
            "rounded-lg border p-4 leading-7",
            calloutTone(node.attrs.type),
          )}
          role="note"
        >
          <SharedRichNodes
            nodes={node.content}
            ctx={ctx}
            renderEntity={renderEntity}
            renderDoc={renderDoc}
          />
        </aside>
      );
    case "accordion":
      return (
        <AccordionBlock
          items={node.attrs.items.map((item, i) => ({
            id: `faq-${i}-${item.question.slice(0, 40)}`,
            question: item.question,
            answer: renderDoc(item.answer),
          }))}
        />
      );
    case "steps":
      return (
        <ol className="relative flex flex-col gap-6 border-s border-border ps-6">
          {node.attrs.items.map((step, i) => (
            <li key={`${step.title}-${i}`} className="relative">
              <span className="absolute -start-[1.9rem] flex size-8 items-center justify-center rounded-full bg-primary text-sm font-medium text-primary-foreground">
                {toPersianDigits(i + 1)}
              </span>
              <div className="pt-1">
                <p className="font-medium text-foreground">{step.title}</p>
                <p className="mt-1 text-sm leading-7 text-muted-foreground">
                  {step.description}
                </p>
              </div>
            </li>
          ))}
        </ol>
      );
    case "ctaButton": {
      const href = ctaHref(node.attrs);
      const external = href.startsWith("http");
      const className =
        "inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90";
      if (external) {
        return (
          <p>
            <a
              href={href}
              className={className}
              rel="noopener noreferrer"
              target="_blank"
            >
              {node.attrs.text}
            </a>
          </p>
        );
      }
      return (
        <p>
          <Link href={href} className={className}>
            {node.attrs.text}
          </Link>
        </p>
      );
    }
    case "videoLink": {
      let host = "ویدیو";
      try {
        host = new URL(node.attrs.href).hostname.replace(/^www\./, "") || host;
      } catch {
        /* keep fallback */
      }
      return (
        <a
          href={node.attrs.href}
          className="flex items-center gap-3 rounded-lg border border-border bg-muted/20 p-3 text-foreground no-underline transition-colors hover:bg-muted/40"
          rel="noopener noreferrer"
          target="_blank"
        >
          <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
            <Video aria-hidden className="size-5" />
          </span>
          <span className="min-w-0">
            <span className="block text-sm font-medium">{host}</span>
            <span className="block text-xs text-primary underline-offset-4">
              مشاهده ویدیو
            </span>
          </span>
        </a>
      );
    }
    case "entityReference":
      return (
        <>
          {renderEntity({
            entityType: node.attrs.entityType,
            entityId: node.attrs.entityId,
          })}
        </>
      );
    default: {
      const unknownType = (node as { type: string }).type;
      if (
        ctx.warnUnknown !== false &&
        process.env.NODE_ENV !== "production"
      ) {
        console.warn(`[RichContent] Unknown node type skipped: ${unknownType}`);
      }
      return null;
    }
  }
}

export const proseClassName =
  "flex flex-col gap-4 text-base leading-8 text-foreground [&_strong]:font-semibold";
