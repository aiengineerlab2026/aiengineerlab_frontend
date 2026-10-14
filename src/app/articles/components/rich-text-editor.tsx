"use client";

import { EditorContent, useEditor, useEditorState, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
  Bold,
  Code2,
  Heading2,
  Heading3,
  Italic,
  Link2,
  List,
  ListOrdered,
  Minus,
  Quote,
  Redo2,
  Strikethrough,
  Underline,
  Undo2,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/app/restaurant/lib/utils";

function ToolButton({ label, icon: Icon, active, disabled, onClick }: {
  label: string;
  icon: LucideIcon;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      aria-pressed={active}
      disabled={disabled}
      // keep the selection in the editor when a toolbar button is pressed
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={cn(
        "inline-flex size-8 cursor-pointer items-center justify-center rounded-md text-foreground/80 transition-colors hover:bg-muted disabled:pointer-events-none disabled:opacity-40 focus-visible:ring-2 focus-visible:ring-(--brand) focus-visible:outline-none",
        active && "bg-(--brand)/15 text-(--brand) dark:text-(--brand-bright)",
      )}
    >
      <Icon className="size-4" />
    </button>
  );
}

const Divider = () => <span aria-hidden className="mx-1 h-5 w-px bg-border" />;

function setLink(editor: Editor) {
  const previous = editor.getAttributes("link").href as string | undefined;
  const url = window.prompt("Link address (leave empty to remove the link)", previous ?? "https://");
  if (url === null) return;
  const chain = editor.chain().focus().extendMarkRange("link");
  if (url.trim() === "" || url.trim() === "https://") chain.unsetLink().run();
  else chain.setLink({ href: url.trim() }).run();
}

function Toolbar({ editor }: { editor: Editor }) {
  const s = useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      bold: e.isActive("bold"),
      italic: e.isActive("italic"),
      underline: e.isActive("underline"),
      strike: e.isActive("strike"),
      h2: e.isActive("heading", { level: 2 }),
      h3: e.isActive("heading", { level: 3 }),
      bullet: e.isActive("bulletList"),
      ordered: e.isActive("orderedList"),
      quote: e.isActive("blockquote"),
      code: e.isActive("codeBlock"),
      link: e.isActive("link"),
      canUndo: e.can().undo(),
      canRedo: e.can().redo(),
    }),
  });
  const run = () => editor.chain().focus();

  return (
    <div role="toolbar" aria-label="Formatting" className="flex flex-wrap items-center gap-0.5 border-b bg-muted/40 p-1.5">
      <ToolButton label="Bold" icon={Bold} active={s.bold} onClick={() => run().toggleBold().run()} />
      <ToolButton label="Italic" icon={Italic} active={s.italic} onClick={() => run().toggleItalic().run()} />
      <ToolButton label="Underline" icon={Underline} active={s.underline} onClick={() => run().toggleUnderline().run()} />
      <ToolButton label="Strikethrough" icon={Strikethrough} active={s.strike} onClick={() => run().toggleStrike().run()} />
      <Divider />
      <ToolButton label="Heading" icon={Heading2} active={s.h2} onClick={() => run().toggleHeading({ level: 2 }).run()} />
      <ToolButton label="Subheading" icon={Heading3} active={s.h3} onClick={() => run().toggleHeading({ level: 3 }).run()} />
      <Divider />
      <ToolButton label="Bulleted list" icon={List} active={s.bullet} onClick={() => run().toggleBulletList().run()} />
      <ToolButton label="Numbered list" icon={ListOrdered} active={s.ordered} onClick={() => run().toggleOrderedList().run()} />
      <ToolButton label="Quote" icon={Quote} active={s.quote} onClick={() => run().toggleBlockquote().run()} />
      <ToolButton label="Code block" icon={Code2} active={s.code} onClick={() => run().toggleCodeBlock().run()} />
      <ToolButton label="Link" icon={Link2} active={s.link} onClick={() => setLink(editor)} />
      <ToolButton label="Divider line" icon={Minus} onClick={() => run().setHorizontalRule().run()} />
      <Divider />
      <ToolButton label="Undo" icon={Undo2} disabled={!s.canUndo} onClick={() => run().undo().run()} />
      <ToolButton label="Redo" icon={Redo2} disabled={!s.canRedo} onClick={() => run().redo().run()} />
    </div>
  );
}

/** WYSIWYG editor for the article body. Emits HTML ("" while empty); `initialContent` is only read once. */
export function RichTextEditor({ initialContent, onChange }: { initialContent: string; onChange: (html: string) => void }) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        link: { openOnClick: false, autolink: true, protocols: ["http", "https", "mailto"] },
      }),
    ],
    content: initialContent,
    immediatelyRender: false, // the page is server-rendered first
    onUpdate: ({ editor: e }) => onChange(e.isEmpty ? "" : e.getHTML()),
    editorProps: {
      attributes: {
        class: "article-body min-h-[320px] px-4 py-3 outline-none",
        role: "textbox",
        "aria-multiline": "true",
        "aria-label": "Article content",
      },
    },
  });

  return (
    <div className="overflow-hidden rounded-xl border bg-card focus-within:ring-2 focus-within:ring-(--brand)/40">
      {editor ? <Toolbar editor={editor} /> : <div className="h-11 border-b bg-muted/40" />}
      <EditorContent editor={editor} />
    </div>
  );
}
