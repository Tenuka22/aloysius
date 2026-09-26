import * as stylex from "@stylexjs/stylex";
import { useEditorState } from "@tiptap/react";
import type { Editor } from "@tiptap/react";
import { useState } from "react";

import { color, font, radius, space } from "../../../tokens/tokens.stylex";

/**
 * The rich text toolbar.
 *
 * A custom component rather than Tiptap's bundled BubbleMenu/FloatingMenu: the
 * CMS already has a house style for controls (see `cms-primitives.tsx`) and a
 * menu that pops up over the text fights the CMS's two-column field grid.
 * A fixed bar above the text also keeps the controls reachable by keyboard
 * without the reader having to select something first.
 *
 * `useEditorState` rather than reading `editor.isActive` during render: the
 * selection changes on every keystroke and arrow key, and subscribing to the
 * whole editor state would re-render the entire field on each one.
 */

const styles = stylex.create({
  bar: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    gap: space["3xs"],
    padding: space["3xs"],
    borderBlockEndWidth: space.px,
    borderBlockEndStyle: "solid",
    borderBlockEndColor: color.border,
    backgroundColor: color.surfaceRaised,
  },
  group: {
    display: "flex",
    alignItems: "center",
    gap: space["3xs"],
    paddingInlineEnd: space["3xs"],
    marginInlineEnd: space["3xs"],
    borderInlineEndWidth: space.px,
    borderInlineEndStyle: "solid",
    borderInlineEndColor: color.border,
  },
  button: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minWidth: "1.75rem",
    height: "1.75rem",
    paddingInline: space["2xs"],
    borderWidth: space.px,
    borderStyle: "solid",
    borderColor: color.border,
    borderRadius: radius.sm,
    backgroundColor: color.surfaceRaised,
    fontSize: font.sizeSm,
    fontWeight: font.weightSemibold,
    lineHeight: 1,
    color: color.onSurfaceMuted,
    cursor: "pointer",
    ":hover": {
      backgroundColor: color.surfaceSunken,
      color: color.onSurface,
    },
    ":focus-visible": {
      outlineWidth: space.px,
      outlineStyle: "solid",
      outlineColor: color.focusRing,
      outlineOffset: space.px,
    },
  },
  pressed: {
    backgroundColor: color.surfaceInverse,
    borderColor: color.surfaceInverse,
    color: color.onInverse,
  },
  separator: {
    width: "1px",
    height: "1.25rem",
    backgroundColor: color.border,
  },
  linkRow: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    gap: space["3xs"],
    width: "100%",
    paddingBlockStart: space["3xs"],
  },
  linkInput: {
    flex: "1 1 12rem",
    minWidth: 0,
    height: "1.75rem",
    paddingInline: space["2xs"],
    borderWidth: space.px,
    borderStyle: "solid",
    borderColor: color.border,
    borderRadius: radius.sm,
    backgroundColor: color.surface,
    fontFamily: font.body,
    fontSize: font.sizeSm,
    color: color.onSurface,
  },
  hint: {
    margin: 0,
    fontSize: font.size2xs,
    color: color.onSurfaceSubtle,
  },
});

const ToolbarButton = ({
  active = false,
  children,
  label,
  onClick,
}: {
  active?: boolean;
  children: React.ReactNode;
  /** Doubles as the tooltip and the screen-reader name. */
  label: string;
  onClick: () => void;
}) => (
  <button
    aria-label={label}
    aria-pressed={active}
    onClick={onClick}
    title={label}
    type="button"
    {...stylex.props(styles.button, active && styles.pressed)}
  >
    {children}
  </button>
);

export const RichTextToolbar = ({ editor }: { editor: Editor }) => {
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkValue, setLinkValue] = useState("");

  /*
   * Only the handful of flags the buttons actually render. Anything more and
   * every selection move re-renders the bar for no visible change.
   */
  const state = useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      bold: e.isActive("bold"),
      italic: e.isActive("italic"),
      underline: e.isActive("underline"),
      strike: e.isActive("strike"),
      bulletList: e.isActive("bulletList"),
      orderedList: e.isActive("orderedList"),
      blockquote: e.isActive("blockquote"),
      pullQuote: e.isActive("pullQuote"),
      link: e.isActive("link"),
      canLink: e.can().setLink({ href: "" }),
    }),
  });

  const applyLink = () => {
    const href = linkValue.trim();
    if (href) {
      editor.chain().focus().extendMarkRange("link").setLink({ href }).run();
    } else {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
    }
    setLinkOpen(false);
    setLinkValue("");
  };

  return (
    <div {...stylex.props(styles.bar)}>
      <div {...stylex.props(styles.group)}>
        <ToolbarButton
          active={state.bold}
          label="Bold"
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          B
        </ToolbarButton>
        <ToolbarButton
          active={state.italic}
          label="Italic"
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <i>I</i>
        </ToolbarButton>
        <ToolbarButton
          active={state.underline}
          label="Underline"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
        >
          <u>U</u>
        </ToolbarButton>
        <ToolbarButton
          active={state.strike}
          label="Strikethrough"
          onClick={() => editor.chain().focus().toggleStrike().run()}
        >
          <s>S</s>
        </ToolbarButton>
      </div>

      <div {...stylex.props(styles.group)}>
        <ToolbarButton
          active={state.bulletList}
          label="Bulleted list"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          &bull;
        </ToolbarButton>
        <ToolbarButton
          active={state.orderedList}
          label="Numbered list"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          1.
        </ToolbarButton>
      </div>

      <div {...stylex.props(styles.group)}>
        <ToolbarButton
          active={state.blockquote}
          label="Quote"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
        >
          &ldquo;
        </ToolbarButton>
        <ToolbarButton
          active={state.pullQuote}
          label="Pull quote"
          onClick={() => editor.chain().focus().setPullQuote().run()}
        >
          &#10022;
        </ToolbarButton>
      </div>

      <div {...stylex.props(styles.group)}>
        <ToolbarButton
          active={state.link}
          label="Link"
          onClick={() => {
            setLinkValue(editor.getAttributes("link").href ?? "");
            setLinkOpen((open) => !open);
          }}
        >
          &#128279;
        </ToolbarButton>
        <ToolbarButton
          label="Undo"
          onClick={() => editor.chain().focus().undo().run()}
        >
          &#8630;
        </ToolbarButton>
        <ToolbarButton
          label="Redo"
          onClick={() => editor.chain().focus().redo().run()}
        >
          &#8631;
        </ToolbarButton>
      </div>

      {linkOpen ? (
        <div {...stylex.props(styles.linkRow)}>
          <input
            aria-label="Link address"
            onChange={(e) => setLinkValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                applyLink();
              }
              if (e.key === "Escape") {
                setLinkOpen(false);
              }
            }}
            placeholder="https:// or /about"
            type="url"
            value={linkValue}
            {...stylex.props(styles.linkInput)}
          />
          <ToolbarButton label="Apply link" onClick={applyLink}>
            Apply
          </ToolbarButton>
          <ToolbarButton
            label="Cancel link"
            onClick={() => {
              setLinkOpen(false);
              setLinkValue("");
            }}
          >
            Cancel
          </ToolbarButton>
          <p {...stylex.props(styles.hint)}>
            Only http, https and mailto links are kept on the published page.
          </p>
        </div>
      ) : null}
    </div>
  );
};
