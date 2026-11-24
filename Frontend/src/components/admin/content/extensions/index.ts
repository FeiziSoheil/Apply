import type { AnyExtension } from "@tiptap/core";
import { createAccordionExtension } from "./accordion";
import { createCalloutExtension } from "./callout";
import { createCtaButtonExtension } from "./cta-button";
import { createEntityReferenceExtension } from "./entity-reference";
import { createHighlightExtension } from "./highlight";
import { createImageExtension } from "./image";
import { createLinkExtension } from "./link";
import { createNodeRangeExtension } from "./node-range";
import { createPasteSanitizeExtension } from "./paste-sanitize";
import { createPlaceholderExtension } from "./placeholder";
import { createSlashCommandExtension } from "./slash-command";
import { createStarterKitExtension } from "./starter";
import { createStepsExtension } from "./steps";
import { createTableExtension } from "./table";
import { createUnderlineExtension } from "./underline";
import { createVideoLinkExtension } from "./video-link";

export type CreateContentEditorExtensionsOptions = {
  placeholder?: string;
};

/**
 * TipTap extensions for RichContent (core + custom contract blocks).
 * Add new blocks by dropping a file in this folder and registering here.
 */
export function createContentEditorExtensions(
  options: CreateContentEditorExtensionsOptions = {},
): AnyExtension[] {
  return [
    createStarterKitExtension(),
    createUnderlineExtension(),
    createHighlightExtension(),
    createLinkExtension(),
    createTableExtension(),
    createImageExtension(),
    createCalloutExtension(),
    createAccordionExtension(),
    createStepsExtension(),
    createCtaButtonExtension(),
    createVideoLinkExtension(),
    createEntityReferenceExtension(),
    createPlaceholderExtension(options.placeholder ?? "متن را بنویسید یا / را بزنید…"),
    createPasteSanitizeExtension(),
    createSlashCommandExtension(),
    createNodeRangeExtension(),
  ];
}

export {
  createAccordionExtension,
  createCalloutExtension,
  createCtaButtonExtension,
  createEntityReferenceExtension,
  createHighlightExtension,
  createImageExtension,
  createLinkExtension,
  createNodeRangeExtension,
  createPasteSanitizeExtension,
  createPlaceholderExtension,
  createSlashCommandExtension,
  createStarterKitExtension,
  createStepsExtension,
  createTableExtension,
  createUnderlineExtension,
  createVideoLinkExtension,
};
