import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";

const ALLOWED_TAGS = new Set([
  "P",
  "H1",
  "H2",
  "H3",
  "H4",
  "H5",
  "H6",
  "UL",
  "OL",
  "LI",
  "BLOCKQUOTE",
  "HR",
  "BR",
  "STRONG",
  "B",
  "EM",
  "I",
  "U",
  "A",
  "MARK",
  "TABLE",
  "THEAD",
  "TBODY",
  "TR",
  "TH",
  "TD",
]);

const INLINE_WRAPPERS = new Set(["SPAN", "FONT", "DIV", "SECTION", "ARTICLE"]);

function unwrapElement(el: Element): void {
  const parent = el.parentNode;
  if (!parent) return;
  while (el.firstChild) {
    parent.insertBefore(el.firstChild, el);
  }
  parent.removeChild(el);
}

function mapHeading(el: HTMLElement): void {
  const tag = el.tagName;
  if (tag === "H1" || tag === "H5" || tag === "H6") {
    const h2 = document.createElement("h2");
    h2.innerHTML = el.innerHTML;
    el.replaceWith(h2);
  }
}

function cleanAttributes(el: Element): void {
  const keep =
    el.tagName === "A"
      ? ["href"]
      : el.tagName === "TD" || el.tagName === "TH"
        ? ["colspan", "rowspan"]
        : [];
  for (const attr of [...el.attributes]) {
    if (!keep.includes(attr.name.toLowerCase())) {
      el.removeAttribute(attr.name);
    }
  }
}

/**
 * Strip Word/Google Docs paste noise: styles, fonts, colors, sizes;
 * keep structure (headings, lists, tables, basic marks).
 */
export function sanitizePastedHtml(html: string): string {
  if (typeof document === "undefined") return html;
  const template = document.createElement("template");
  template.innerHTML = html;

  const walk = (root: ParentNode) => {
    const children = [...root.childNodes];
    for (const child of children) {
      if (child.nodeType === Node.COMMENT_NODE) {
        child.parentNode?.removeChild(child);
        continue;
      }
      if (child.nodeType !== Node.ELEMENT_NODE) continue;
      const el = child as HTMLElement;
      const tag = el.tagName;

      if (tag === "STYLE" || tag === "META" || tag === "LINK" || tag === "SCRIPT") {
        el.remove();
        continue;
      }

      // Google Docs wraps content in <b style="font-weight:normal">
      if (tag === "B" && el.getAttribute("style")?.includes("font-weight:normal")) {
        unwrapElement(el);
        walk(root);
        continue;
      }

      if (INLINE_WRAPPERS.has(tag) || !ALLOWED_TAGS.has(tag)) {
        walk(el);
        unwrapElement(el);
        continue;
      }

      mapHeading(el);
      cleanAttributes(el);
      el.removeAttribute("style");
      el.removeAttribute("class");
      walk(el);
    }
  };

  walk(template.content);
  return template.innerHTML;
}

/**
 * Editor extension: sanitize clipboard HTML from Word / Docs before schema parse.
 */
export function createPasteSanitizeExtension() {
  return Extension.create({
    name: "pasteSanitize",
    addProseMirrorPlugins() {
      return [
        new Plugin({
          key: new PluginKey("pasteSanitize"),
          props: {
            transformPastedHTML(html) {
              return sanitizePastedHtml(html);
            },
          },
        }),
      ];
    },
  });
}
