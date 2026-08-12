"use client";

import * as React from "react";
import type { Content, Editor, UseEditorOptions } from "@tiptap/react";
import { StarterKit } from "@tiptap/starter-kit";
import { useEditor } from "@tiptap/react";
import { Placeholder } from "@tiptap/extension-placeholder";
import { Link } from "@tiptap/extension-link";
import { Underline } from "@tiptap/extension-underline";
import { TextAlign } from "@tiptap/extension-text-align";
import { Highlight } from "@tiptap/extension-highlight";
import { TaskList } from "@tiptap/extension-task-list";
import { TaskItem } from "@tiptap/extension-task-item";
import { CodeBlockLowlight } from "@tiptap/extension-code-block-lowlight";
import { Image } from "@tiptap/extension-image";
import { common, createLowlight } from "lowlight";
import { useThrottle } from "./use-throttle";

const lowlight = createLowlight(common);

export interface UseMinimalTiptapEditorProps extends UseEditorOptions {
  value?: Content;
  output?: "html" | "json" | "text";
  placeholder?: string;
  editorClassName?: string;
  throttleDelay?: number;
  onUpdate?: (content: Content) => void;
  onBlur?: (content: Content) => void;
}

const createExtensions = ({
  placeholder,
  output = "html",
}: {
  placeholder: string;
  output: UseMinimalTiptapEditorProps["output"];
}) => [
  StarterKit.configure({
    blockquote: { HTMLAttributes: { class: "block-node" } },
    bulletList: { HTMLAttributes: { class: "list-node" } },
    code: { HTMLAttributes: { class: "inline", spellcheck: "false" } },
    codeBlock: false,
    dropcursor: { width: 2, class: "ProseMirror-dropcursor border" },
    heading: { HTMLAttributes: { class: "heading-node" } },
    horizontalRule: { HTMLAttributes: { class: "my-4" } },
    link: {
      enableClickSelection: true,
      openOnClick: false,
      HTMLAttributes: { class: "link" },
    },
    orderedList: { HTMLAttributes: { class: "list-node" } },
    paragraph: { HTMLAttributes: { class: "text-node" } },
  }),
  Underline,
  TextAlign.configure({ types: ["heading", "paragraph"] }),
  Highlight.configure({ multicolor: true }),
  Image.configure({
    HTMLAttributes: {
      class: "tiptap-image rounded-md max-w-full h-auto my-4",
    },
    inline: false,
  }),
  TaskList.configure({ HTMLAttributes: { class: "task-list-node" } }),
  TaskItem.configure({ nested: true }),
  CodeBlockLowlight.configure({ lowlight }),
  Placeholder.configure({ placeholder: () => placeholder }),
  Link.configure({
    openOnClick: false,
    HTMLAttributes: { class: "link" },
  }),
];

function getOutput(editor: Editor, format: "html" | "json" | "text"): object | string {
  switch (format) {
    case "json":
      return editor.getJSON();
    case "text":
      return editor.getText();
    default:
      return editor.isEmpty ? "" : editor.getHTML();
  }
}

export const useMinimalTiptapEditor = ({
  value,
  output = "html",
  placeholder = "",
  editorClassName,
  throttleDelay = 0,
  onUpdate,
  onBlur,
  ...props
}: UseMinimalTiptapEditorProps) => {
  const throttledSetValue = useThrottle((value: Content) => onUpdate?.(value), throttleDelay);

  const handleUpdate = React.useCallback(
    (editor: Editor) => throttledSetValue(getOutput(editor, output)),
    [output, throttledSetValue],
  );

  const handleCreate = React.useCallback(
    (editor: Editor) => {
      if (value && editor.isEmpty) {
        editor.commands.setContent(value);
      }
    },
    [value],
  );

  const handleBlur = React.useCallback(
    (editor: Editor) => onBlur?.(getOutput(editor, output)),
    [output, onBlur],
  );

  const editor = useEditor({
    immediatelyRender: false,
    extensions: createExtensions({ placeholder, output }),
    editorProps: {
      attributes: {
        autocomplete: "off",
        autocorrect: "off",
        autocapitalize: "off",
        class: editorClassName ?? "",
      },
    },
    onUpdate: ({ editor }) => handleUpdate(editor),
    onCreate: ({ editor }) => handleCreate(editor),
    onBlur: ({ editor }) => handleBlur(editor),
    ...props,
  });

  return editor;
};

export default useMinimalTiptapEditor;
