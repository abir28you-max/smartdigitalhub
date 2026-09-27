import { useEffect, useRef } from "react";
import { Bold, Italic, List, ListOrdered, Heading2, Heading3, Link2, Undo2, Eraser } from "lucide-react";
import { Button } from "@/components/ui/button";

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: number;
}

/**
 * Lightweight WYSIWYG editor. The AI writes HTML into `value`, but the admin
 * only ever sees formatted text — never raw tags.
 */
const RichTextEditor = ({ value, onChange, placeholder, minHeight = 260 }: RichTextEditorProps) => {
  const ref = useRef<HTMLDivElement>(null);

  // Sync external value in only when it differs from what's rendered,
  // so typing doesn't reset the caret.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (el.innerHTML !== value) el.innerHTML = value || "";
  }, [value]);

  const exec = (command: string, arg?: string) => {
    ref.current?.focus();
    document.execCommand(command, false, arg);
    onChange(ref.current?.innerHTML || "");
  };

  const addLink = () => {
    const url = window.prompt("Link URL");
    if (url) exec("createLink", url);
  };

  const tools = [
    { icon: Bold, label: "Bold", run: () => exec("bold") },
    { icon: Italic, label: "Italic", run: () => exec("italic") },
    { icon: Heading2, label: "Heading", run: () => exec("formatBlock", "<h2>") },
    { icon: Heading3, label: "Subheading", run: () => exec("formatBlock", "<h3>") },
    { icon: List, label: "Bullet list", run: () => exec("insertUnorderedList") },
    { icon: ListOrdered, label: "Numbered list", run: () => exec("insertOrderedList") },
    { icon: Link2, label: "Link", run: addLink },
    { icon: Eraser, label: "Clear formatting", run: () => exec("removeFormat") },
    { icon: Undo2, label: "Undo", run: () => exec("undo") },
  ];

  return (
    <div className="border border-border rounded-lg overflow-hidden bg-background">
      <div className="flex flex-wrap gap-0.5 border-b border-border bg-muted/40 p-1">
        {tools.map(({ icon: Icon, label, run }) => (
          <Button
            key={label}
            type="button"
            variant="ghost"
            size="sm"
            title={label}
            aria-label={label}
            className="h-7 w-7 p-0"
            onMouseDown={(e) => e.preventDefault()}
            onClick={run}
          >
            <Icon className="h-3.5 w-3.5" />
          </Button>
        ))}
      </div>
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        role="textbox"
        aria-multiline="true"
        data-placeholder={placeholder}
        style={{ minHeight }}
        className="prose prose-sm max-w-none px-3 py-2 text-sm outline-none prose-headings:text-foreground prose-p:text-foreground prose-li:text-foreground empty:before:content-[attr(data-placeholder)] empty:before:text-muted-foreground"
        onInput={() => onChange(ref.current?.innerHTML || "")}
        onBlur={() => onChange(ref.current?.innerHTML || "")}
        onPaste={(e) => {
          e.preventDefault();
          const text = e.clipboardData.getData("text/plain");
          document.execCommand("insertText", false, text);
          onChange(ref.current?.innerHTML || "");
        }}
      />
    </div>
  );
};

export default RichTextEditor;
