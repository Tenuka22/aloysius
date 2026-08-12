"use client";

import * as React from "react";
import type { Editor } from "@tiptap/react";
import {
  IconBold,
  IconItalic,
  IconUnderline,
  IconStrikethrough,
  IconCode,
  IconH1,
  IconH2,
  IconH3,
  IconListLetters,
  IconListNumbers,
  IconListCheck,
  IconBlockquote,
  IconMinus,
  IconArrowBackUp,
  IconArrowForwardUp,
  IconHighlight,
  IconAlignLeft,
  IconAlignCenter,
  IconAlignRight,
  IconLink,
  IconCodeDots,
  IconClearFormatting,
  IconPhoto,
} from "@tabler/icons-react";
import { ToolbarButton } from "./toolbar-button";
import { Separator } from "@aloysius-web/ui/components/separator";

interface ToolbarProps {
  editor: Editor | null;
  onImageUpload?: (file: File) => Promise<string>;
}

function LinkButton({ editor }: { editor: Editor }) {
  const [showInput, setShowInput] = React.useState(false);
  const [url, setUrl] = React.useState("");

  const handleSetLink = () => {
    if (url) {
      editor.chain().focus().setLink({ href: url }).run();
    } else {
      editor.chain().focus().unsetLink().run();
    }
    setShowInput(false);
    setUrl("");
  };

  if (showInput) {
    return (
      <div className="flex items-center gap-1">
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://..."
          className="h-7 w-32 rounded border border-input bg-background px-2 text-xs outline-none focus:ring-1 focus:ring-ring"
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSetLink();
            if (e.key === "Escape") setShowInput(false);
          }}
          autoFocus
        />
        <ToolbarButton tooltip="Confirm" onClick={handleSetLink}>
          <span className="text-xs">OK</span>
        </ToolbarButton>
      </div>
    );
  }

  return (
    <ToolbarButton
      isActive={editor.isActive("link")}
      tooltip="Link"
      onClick={() => {
        const href = editor.getAttributes("link").href as string;
        setUrl(href ?? "");
        setShowInput(true);
      }}
    >
      <IconLink className="size-4" />
    </ToolbarButton>
  );
}

function ImageButton({
  editor,
  onImageUpload,
}: {
  editor: Editor;
  onImageUpload?: (file: File) => Promise<string>;
}) {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = React.useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !onImageUpload) return;

    setUploading(true);
    try {
      const url = await onImageUpload(file);
      editor.chain().focus().setImage({ src: url }).run();
    } catch (err) {
      console.error("Image upload failed:", err);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
      <ToolbarButton
        tooltip="Insert image"
        disabled={uploading}
        onClick={() => fileInputRef.current?.click()}
      >
        <IconPhoto className="size-4" />
      </ToolbarButton>
    </>
  );
}

export function Toolbar({ editor, onImageUpload }: ToolbarProps) {
  if (!editor) return null;

  return (
    <div className="border-border flex h-10 shrink-0 flex-wrap items-center gap-0.5 overflow-x-auto border-b px-2 py-1">
      <ToolbarButton
        isActive={editor.isActive("heading", { level: 1 })}
        tooltip="Heading 1"
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
      >
        <IconH1 className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        isActive={editor.isActive("heading", { level: 2 })}
        tooltip="Heading 2"
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
      >
        <IconH2 className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        isActive={editor.isActive("heading", { level: 3 })}
        tooltip="Heading 3"
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
      >
        <IconH3 className="size-4" />
      </ToolbarButton>

      <Separator orientation="vertical" className="mx-1 h-5" />

      <ToolbarButton
        isActive={editor.isActive("bold")}
        tooltip="Bold"
        onClick={() => editor.chain().focus().toggleBold().run()}
      >
        <IconBold className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        isActive={editor.isActive("italic")}
        tooltip="Italic"
        onClick={() => editor.chain().focus().toggleItalic().run()}
      >
        <IconItalic className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        isActive={editor.isActive("underline")}
        tooltip="Underline"
        onClick={() => editor.chain().focus().toggleUnderline().run()}
      >
        <IconUnderline className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        isActive={editor.isActive("strike")}
        tooltip="Strikethrough"
        onClick={() => editor.chain().focus().toggleStrike().run()}
      >
        <IconStrikethrough className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        isActive={editor.isActive("code")}
        tooltip="Code"
        onClick={() => editor.chain().focus().toggleCode().run()}
      >
        <IconCode className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        isActive={editor.isActive("highlight")}
        tooltip="Highlight"
        onClick={() => editor.chain().focus().toggleHighlight().run()}
      >
        <IconHighlight className="size-4" />
      </ToolbarButton>

      <Separator orientation="vertical" className="mx-1 h-5" />

      <ToolbarButton
        isActive={editor.isActive({ textAlign: "left" })}
        tooltip="Align left"
        onClick={() => editor.chain().focus().setTextAlign("left").run()}
      >
        <IconAlignLeft className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        isActive={editor.isActive({ textAlign: "center" })}
        tooltip="Align center"
        onClick={() => editor.chain().focus().setTextAlign("center").run()}
      >
        <IconAlignCenter className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        isActive={editor.isActive({ textAlign: "right" })}
        tooltip="Align right"
        onClick={() => editor.chain().focus().setTextAlign("right").run()}
      >
        <IconAlignRight className="size-4" />
      </ToolbarButton>

      <Separator orientation="vertical" className="mx-1 h-5" />

      <ToolbarButton
        isActive={editor.isActive("bulletList")}
        tooltip="Bullet list"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      >
        <IconListLetters className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        isActive={editor.isActive("orderedList")}
        tooltip="Ordered list"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      >
        <IconListNumbers className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        isActive={editor.isActive("taskList")}
        tooltip="Task list"
        onClick={() => editor.chain().focus().toggleTaskList().run()}
      >
        <IconListCheck className="size-4" />
      </ToolbarButton>

      <Separator orientation="vertical" className="mx-1 h-5" />

      <ToolbarButton
        isActive={editor.isActive("blockquote")}
        tooltip="Blockquote"
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
      >
        <IconBlockquote className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        isActive={editor.isActive("codeBlock")}
        tooltip="Code block"
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
      >
        <IconCodeDots className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        tooltip="Horizontal rule"
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
      >
        <IconMinus className="size-4" />
      </ToolbarButton>

      <Separator orientation="vertical" className="mx-1 h-5" />

      <LinkButton editor={editor} />

      <Separator orientation="vertical" className="mx-1 h-5" />

      <ImageButton editor={editor} onImageUpload={onImageUpload} />

      <Separator orientation="vertical" className="mx-1 h-5" />

      <ToolbarButton
        tooltip="Clear formatting"
        onClick={() => editor.chain().focus().unsetAllMarks().run()}
      >
        <IconClearFormatting className="size-4" />
      </ToolbarButton>

      <div className="flex-1" />

      <ToolbarButton
        tooltip="Undo"
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
      >
        <IconArrowBackUp className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        tooltip="Redo"
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
      >
        <IconArrowForwardUp className="size-4" />
      </ToolbarButton>
    </div>
  );
}
