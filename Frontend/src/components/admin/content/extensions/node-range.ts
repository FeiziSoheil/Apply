import { NodeRange } from "@tiptap/extension-node-range";

/** Required by TipTap DragHandle for block reordering. */
export function createNodeRangeExtension() {
  return NodeRange;
}
