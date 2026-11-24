import StarterKit from "@tiptap/starter-kit";

/** Core document structure — code/strike disabled (not in RichContent whitelist). */
export function createStarterKitExtension() {
  return StarterKit.configure({
    heading: { levels: [2, 3, 4] },
    code: false,
    codeBlock: false,
    strike: false,
    link: false, // configured in link.ts with protocol checks
    underline: false, // configured in underline.ts
  });
}
