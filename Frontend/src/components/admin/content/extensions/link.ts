import Link from "@tiptap/extension-link";

const ALLOWED_PROTOCOLS = new Set(["http:", "https:", "mailto:", "tel:"]);

export function isAllowedEditorHref(href: string): boolean {
  try {
    if (href.startsWith("mailto:") || href.startsWith("tel:")) {
      return href.length > 7;
    }
    return ALLOWED_PROTOCOLS.has(new URL(href).protocol);
  } catch {
    return false;
  }
}

export function isExternalHref(href: string): boolean {
  try {
    const protocol = new URL(href).protocol;
    return protocol === "http:" || protocol === "https:";
  } catch {
    return false;
  }
}

export function createLinkExtension() {
  return Link.extend({
    renderHTML({ HTMLAttributes }) {
      const href = typeof HTMLAttributes.href === "string" ? HTMLAttributes.href : "";
      const external = isExternalHref(href);
      const classes = [
        "text-primary",
        "underline",
        "underline-offset-4",
        external ? "content-editor-external-link" : "",
      ]
        .filter(Boolean)
        .join(" ");

      return [
        "a",
        {
          ...HTMLAttributes,
          class: classes,
          ...(external
            ? {
                "data-external": "true",
                target: HTMLAttributes.target ?? "_blank",
                rel: HTMLAttributes.rel ?? "noopener noreferrer",
              }
            : {}),
        },
        0,
      ];
    },
  }).configure({
    openOnClick: false,
    autolink: true,
    defaultProtocol: "https",
    protocols: ["http", "https", "mailto", "tel"],
    HTMLAttributes: {
      rel: "noopener noreferrer",
    },
    isAllowedUri: (url) => isAllowedEditorHref(url),
    shouldAutoLink: (url) => isAllowedEditorHref(url),
  });
}
