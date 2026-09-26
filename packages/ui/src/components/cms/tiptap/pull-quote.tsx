import * as stylex from "@stylexjs/stylex";
import { mergeAttributes, Node } from "@tiptap/core";
import {
  NodeViewContent,
  NodeViewWrapper,
  ReactNodeViewRenderer,
} from "@tiptap/react";
import type { ReactNodeViewProps } from "@tiptap/react";

import { color, font, space } from "../../../tokens/tokens.stylex";

/**
 * A pull quote the editor can drop anywhere in the full message.
 *
 * Built as a custom node with a React node view rather than leaning on
 * StarterKit's `blockquote`, because the two are not the same thing: a
 * `blockquote` here is semantic (quoting someone) and gets the browser's
 * default margins, whereas this is a display element the principal uses to
 * surface one sentence. It also needs the gold rule and the display face,
 * which the sanitiser allowlist would otherwise strip as a `class`.
 */

const styles = stylex.create({
  node: {
    display: "flex",
    gap: space.sm,
    marginBlock: space.md,
    paddingInlineStart: space.md,
    borderInlineStartWidth: space.px,
    borderInlineStartStyle: "solid",
    borderInlineStartColor: color.accent,
    fontFamily: font.display,
    fontSize: font.sizeXl,
    lineHeight: font.leadingSnug,
    color: color.onSurface,
    textWrap: "pretty",
  },
  selected: {
    backgroundColor: color.surfaceSunken,
  },
  content: {
    minWidth: 0,
  },
});

/**
 * `ReactNodeViewProps` rather than the bare `NodeViewProps`: the renderer is
 * handed the extra props Tiptap's React bridge supplies. `NodeViewContent` takes
 * no props at all in v3 - it reads the node it belongs to from context, so
 * passing one is both unnecessary and a type error.
 */
const PullQuoteView = ({ selected }: ReactNodeViewProps) => (
  <NodeViewWrapper
    {...stylex.props(styles.node, selected && styles.selected)}
    data-pull-quote=""
  >
    <div {...stylex.props(styles.content)}>
      <NodeViewContent />
    </div>
  </NodeViewWrapper>
);

export const PullQuote = Node.create({
  name: "pullQuote",
  group: "block",
  content: "inline*",
  defining: true,

  parseHTML() {
    return [{ tag: "aside[data-pull-quote]" }];
  },

  renderHTML({ HTMLAttributes }) {
    // `data-pull-quote` is what `parseHTML` matches on, and it is also the only
    // reason the node survives a round trip through the stored HTML.
    return [
      "aside",
      mergeAttributes(HTMLAttributes, { "data-pull-quote": "" }),
      0,
    ];
  },

  addNodeView() {
    // v3 expects a renderer that returns a `NodeView` ({ dom, contentDOM });
    // `ReactNodeViewRenderer` is the bridge that turns a React component into
    // one, so the component itself must not be returned directly.
    return ReactNodeViewRenderer(PullQuoteView);
  },

  addCommands() {
    return {
      setPullQuote:
        () =>
        ({ commands }) =>
          commands.toggleWrap(this.name),
    };
  },
});

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    pullQuote: {
      /** Wrap or unwrap the selection in a pull quote. */
      setPullQuote: () => ReturnType;
    };
  }
}
