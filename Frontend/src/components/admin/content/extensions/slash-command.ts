import { Extension } from "@tiptap/core";
import { ReactRenderer } from "@tiptap/react";
import Suggestion, { type SuggestionOptions } from "@tiptap/suggestion";
import { PluginKey } from "@tiptap/pm/state";
import {
  SlashMenu,
  type SlashMenuHandle,
} from "../menus/slash-menu";
import { filterSlashItems, type SlashItem } from "../menus/slash-items";

const slashPluginKey = new PluginKey("slashCommand");

export function createSlashCommandExtension() {
  return Extension.create({
    name: "slashCommand",

    addOptions() {
      return {
        suggestion: {
          char: "/",
          allowSpaces: false,
          startOfLine: false,
          pluginKey: slashPluginKey,
          items: ({ query }: { query: string }) => filterSlashItems(query),
          command: ({
            editor,
            range,
            props,
          }: {
            editor: Parameters<SlashItem["command"]>[0];
            range: Parameters<SlashItem["command"]>[1];
            props: SlashItem;
          }) => {
            props.command(editor, range);
          },
          render: () => {
            let component: ReactRenderer<SlashMenuHandle> | null = null;
            let unmount: (() => void) | null = null;

            return {
              onStart: (props) => {
                component = new ReactRenderer(SlashMenu, {
                  props: {
                    editor: props.editor,
                    range: props.range,
                    query: props.query,
                    command: (item: SlashItem) => {
                      props.command(item);
                    },
                  },
                  editor: props.editor,
                  className: "z-50",
                });

                unmount = props.mount(component.element);
              },
              onUpdate: (props) => {
                component?.updateProps({
                  editor: props.editor,
                  range: props.range,
                  query: props.query,
                  command: (item: SlashItem) => {
                    props.command(item);
                  },
                });
              },
              onKeyDown: (props) => {
                if (props.event.key === "Escape") {
                  unmount?.();
                  unmount = null;
                  component?.destroy();
                  component = null;
                  return true;
                }
                return component?.ref?.onKeyDown(props) ?? false;
              },
              onExit: () => {
                unmount?.();
                unmount = null;
                component?.destroy();
                component = null;
              },
            };
          },
        } satisfies Partial<SuggestionOptions<SlashItem>>,
      };
    },

    addProseMirrorPlugins() {
      return [
        Suggestion({
          editor: this.editor,
          ...this.options.suggestion,
        }),
      ];
    },
  });
}
