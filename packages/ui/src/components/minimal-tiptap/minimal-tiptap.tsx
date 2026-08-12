"use client";

// @ts-ignore - CSS import for side effects
import "./styles.css";

import type { Content, Editor } from "@tiptap/react";
import type { UseMinimalTiptapEditorProps } from "./use-minimal-tiptap";
import { EditorContent, EditorContext } from "@tiptap/react";
import { cn } from "@aloysius-web/ui/lib/utils";
import { Toolbar } from "./toolbar";
import { useMinimalTiptapEditor } from "./use-minimal-tiptap";
import { useTiptapEditor } from "./use-tiptap-editor";

export interface MinimalTiptapProps extends Omit<UseMinimalTiptapEditorProps, "onUpdate"> {
  value?: Content;
  onChange?: (value: Content) => void;
  className?: string;
  editorContentClassName?: string;
  onImageUpload?: (file: File) => Promise<string>;
}

export const MinimalTiptapEditor = ({
  value,
  onChange,
  className,
  editorContentClassName,
  onImageUpload,
  ...props
}: MinimalTiptapProps) => {
  const editor = useMinimalTiptapEditor({
    value,
    onUpdate: onChange,
    ...props,
  });

  if (!editor) return null;

  return (
    <EditorContext.Provider value={{ editor }}>
      <MainMinimalTiptapEditor
        editor={editor}
        className={className}
        editorContentClassName={editorContentClassName}
        onImageUpload={onImageUpload}
      />
    </EditorContext.Provider>
  );
};

MinimalTiptapEditor.displayName = "MinimalTiptapEditor";

export default MinimalTiptapEditor;

const MainMinimalTiptapEditor = ({
  editor: providedEditor,
  className,
  editorContentClassName,
  onImageUpload,
}: MinimalTiptapProps & { editor: Editor }) => {
  const { editor } = useTiptapEditor(providedEditor);

  if (!editor) return null;

  return (
    <div
      className={cn(
        "border-input flex h-auto w-full flex-col rounded-md border shadow-xs",
        "focus-within:border-ring focus-within:ring-ring/50 focus-within:ring-[3px]",
        className,
      )}
    >
      <Toolbar editor={editor} onImageUpload={onImageUpload} />
      <EditorContent
        editor={editor}
        className={cn("minimal-tiptap-editor min-h-[200px] p-3", editorContentClassName)}
      />
    </div>
  );
};
