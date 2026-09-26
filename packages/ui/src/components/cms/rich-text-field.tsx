import * as stylex from "@stylexjs/stylex";
import { EditorContent, useEditor } from "@tiptap/react";
import { StarterKit } from "@tiptap/starter-kit";
import { useEffect, useId } from "react";

import type { BlockField } from "../../content/cms";
import { color, space } from "../../tokens/tokens.stylex";
import { FieldShell } from "./cms-primitives";
import { PullQuote } from "./tiptap/pull-quote";
import { RichTextToolbar } from "./tiptap/rich-text-toolbar";

import "./rich-text.css";

const styles = stylex.create({
  frame: {
    display: "block",
    width: "100%",
    borderWidth: space.px,
    borderStyle: "solid",
    borderColor: color.border,
    borderRadius: "4px",
    backgroundColor: color.surface,
    overflow: "hidden",
    /*
     * The ring goes on the frame, not the editable region, so it traces the
     * whole control. `:focus-within` rather than a focus handler, so it tracks
     * the caret without the field re-rendering on every focus change.
     */
    ":focus-within": {
      outlineWidth: "2px",
      outlineStyle: "solid",
      outlineColor: color.focusRing,
      outlineOffset: "-2px",
    },
  },
  dirty: {
    borderColor: color.borderAccent,
  },
});

/**
 * The `richtext` field control.
 *
 * Stores HTML, not ProseMirror JSON: JSON would mean a migration every time a
 * node is added to the schema, and the stored value is only ever read back
 * through `sanitizeRichText` on the public side anyway.
 *
 * The schema is deliberately narrower than the full StarterKit. A principal's
 * message is prose, so code blocks and every heading level above `h2` are off —
 * an editor cannot produce markup the site's typography has no style for, which
 * is also why the published page needs no per-element CSS to cope.
 */
const buildExtensions = () => [
  StarterKit.configure({
    codeBlock: false,
    heading: { levels: [2, 3, 4] },
    link: {
      openOnClick: false,
      autolink: true,
      defaultProtocol: "https",
      HTMLAttributes: { rel: "noopener noreferrer" },
    },
  }),
  PullQuote,
];

export const RichTextField = ({
  field,
  value,
  dirty = false,
  highlighted = false,
  wide = true,
  onChange,
  onReset,
}: {
  field: BlockField;
  value?: string;
  dirty?: boolean;
  highlighted?: boolean;
  wide?: boolean;
  onChange: (next: string) => void;
  onReset?: () => void;
}) => {
  const id = useId();
  const hintId = `${id}-hint`;

  const editor = useEditor({
    extensions: buildExtensions(),
    content: value ?? "",
    /*
     * The CMS is server-rendered, and Tiptap measures the DOM as it builds the
     * view. Without this it renders on the server too, where there is no DOM to
     * measure, and React logs a hydration mismatch.
     */
    immediatelyRender: false,
    onUpdate: ({ editor: instance }) => {
      onChange(instance.getHTML());
    },
    editorProps: {
      attributes: {
        "aria-label": field.label,
        // `attributes` is `Record<string, string>`, so an absent hint has to
        // leave the key out rather than set it to undefined.
        ...(field.hint ? { "aria-describedby": hintId } : {}),
      },
    },
  });

  /*
   * The editor is built once with the value it was first given. When the field
   * changes from outside - the reset button, or a real-time update replacing
   * the draft - the new HTML has to be pushed into the live document, or the
   * text on screen keeps showing the old copy while the saved value has
   * already moved on.
   */
  useEffect(() => {
    if (!editor) {
      return;
    }
    const next = value ?? "";
    if (next !== editor.getHTML()) {
      editor.commands.setContent(next, { emitUpdate: false });
    }
  }, [editor, value]);

  return (
    <FieldShell
      hint={field.hint}
      hintId={hintId}
      highlightFlash={highlighted}
      label={field.label}
      onReset={onReset}
      showClear={dirty}
      wide={wide}
    >
      <div
        data-rich-text=""
        {...stylex.props(styles.frame, dirty && styles.dirty)}
      >
        {editor ? (
          <>
            <RichTextToolbar editor={editor} />
            <EditorContent editor={editor} />
          </>
        ) : null}
      </div>
    </FieldShell>
  );
};
