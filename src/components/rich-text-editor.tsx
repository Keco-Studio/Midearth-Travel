"use client";

import {
  BoldOutlined,
  ItalicOutlined,
  LinkOutlined,
  OrderedListOutlined,
  RedoOutlined,
  UnderlineOutlined,
  UndoOutlined,
  UnorderedListOutlined,
} from "@ant-design/icons";
import Link from "@tiptap/extension-link";
import Underline from "@tiptap/extension-underline";
import { EditorContent, useEditor, useEditorState, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Button, Input, Popover, Space, Spin, Tooltip, Typography } from "antd";
import {
  Component,
  useEffect,
  useState,
  type ErrorInfo,
  type MouseEventHandler,
  type ReactNode,
} from "react";
import {
  isSafeRichTextHref,
  normalizeRichText,
  richTextToPlainText,
} from "@/lib/rich-text-content";
import {
  areSelectionFormattingControlsDisabled,
  createSelectionPreservingControlHandlers,
  getTextSelectionSnapshot,
  hasTextSelection,
  preserveTextSelection,
  setSelectedBlockType,
} from "@/lib/rich-text-selection";

type RichTextEditorProps = {
  value?: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
};

type BlockType = "paragraph" | "heading-2" | "heading-3";

const blockControls: ReadonlyArray<{ label: string; value: BlockType }> = [
  { label: "P", value: "paragraph" },
  { label: "H2", value: "heading-2" },
  { label: "H3", value: "heading-3" },
];

const extensions = [
  StarterKit.configure({
    blockquote: false,
    code: false,
    codeBlock: false,
    heading: { levels: [2, 3] },
    horizontalRule: false,
    link: false,
    strike: false,
    underline: false,
  }),
  Link.configure({
    autolink: false,
    HTMLAttributes: { rel: null, target: null },
    isAllowedUri: (url) => isSafeRichTextHref(url),
    linkOnPaste: true,
    openOnClick: false,
    protocols: ["http", "https", "mailto", "tel"],
  }),
  Underline,
];

export function RichTextEditor(props: RichTextEditorProps) {
  return (
    <RichTextErrorBoundary {...props}>
      <RichTextEditorInner {...props} />
    </RichTextErrorBoundary>
  );
}

function RichTextEditorInner({ value, onChange, disabled = false }: RichTextEditorProps) {
  const normalizedValue = normalizeRichText(value ?? "");
  const editor = useEditor({
    content: normalizedValue,
    editable: !disabled,
    extensions,
    immediatelyRender: false,
    onUpdate: ({ editor: currentEditor }) => {
      onChange?.(normalizeRichText(currentEditor.getHTML()));
    },
  });

  useEffect(() => {
    if (!editor) return;

    editor.setEditable(!disabled, false);
    if (normalizeRichText(editor.getHTML()) !== normalizedValue) {
      editor.commands.setContent(normalizedValue, { emitUpdate: false });
    }
  }, [disabled, editor, normalizedValue]);

  if (!editor) {
    return (
      <div className="cms-rich-text-editor-loading" aria-busy="true">
        <Spin size="small" />
      </div>
    );
  }

  return (
    <div className="cms-rich-text-editor">
      <RichTextToolbar editor={editor} disabled={disabled} />
      <EditorContent editor={editor} className="cms-rich-text-content" />
    </div>
  );
}

function RichTextToolbar({ editor, disabled }: { editor: Editor; disabled: boolean }) {
  const toolbarState = useEditorState({
    editor,
    selector: ({ editor: currentEditor }) => ({
      selection: getTextSelectionSnapshot(currentEditor.state.selection),
      block: activeBlock(currentEditor),
      bold: currentEditor.isActive("bold"),
    }),
  });
  const controlsDisabled = areSelectionFormattingControlsDisabled(disabled);
  const currentBlock = toolbarState?.block ?? activeBlock(editor);

  function toggleBold() {
    if (!hasTextSelection(editor.state.selection)) return;
    editor.chain().focus().toggleBold().run();
  }

  return (
    <div className="cms-rich-text-toolbar" role="toolbar" aria-label="Text formatting">
      <Space.Compact
        className="cms-rich-text-block-controls"
        role="group"
        aria-label="Paragraph style"
      >
        {blockControls.map(({ label, value }) => {
          const active = currentBlock === value;
          const handlers = createSelectionPreservingControlHandlers(() => setBlock(editor, value));

          return (
            <Button
              key={value}
              type="text"
              aria-label={label === "P" ? "Paragraph" : `Heading ${label.slice(1)}`}
              aria-pressed={active}
              className={active ? "cms-rich-text-control-active" : undefined}
              disabled={controlsDisabled}
              {...handlers}
            >
              {label}
            </Button>
          );
        })}
      </Space.Compact>
      <ToolbarButton
        active={toolbarState?.bold ?? editor.isActive("bold")}
        disabled={controlsDisabled}
        icon={<BoldOutlined />}
        label="Bold"
        onClick={toggleBold}
        onMouseDown={preserveTextSelection}
      />
      <ToolbarButton
        active={editor.isActive("italic")}
        disabled={disabled || !editor.can().chain().focus().toggleItalic().run()}
        icon={<ItalicOutlined />}
        label="Italic"
        onClick={() => editor.chain().focus().toggleItalic().run()}
      />
      <ToolbarButton
        active={editor.isActive("underline")}
        disabled={disabled || !editor.can().chain().focus().toggleUnderline().run()}
        icon={<UnderlineOutlined />}
        label="Underline"
        onClick={() => editor.chain().focus().toggleUnderline().run()}
      />
      <ToolbarButton
        active={editor.isActive("orderedList")}
        disabled={disabled || !editor.can().chain().focus().toggleOrderedList().run()}
        icon={<OrderedListOutlined />}
        label="Ordered list"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      />
      <ToolbarButton
        active={editor.isActive("bulletList")}
        disabled={disabled || !editor.can().chain().focus().toggleBulletList().run()}
        icon={<UnorderedListOutlined />}
        label="Bullet list"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      />
      <LinkControl editor={editor} disabled={disabled} />
      <ToolbarButton
        disabled={disabled || !editor.can().chain().focus().undo().run()}
        icon={<UndoOutlined />}
        label="Undo"
        onClick={() => editor.chain().focus().undo().run()}
      />
      <ToolbarButton
        disabled={disabled || !editor.can().chain().focus().redo().run()}
        icon={<RedoOutlined />}
        label="Redo"
        onClick={() => editor.chain().focus().redo().run()}
      />
    </div>
  );
}

function ToolbarButton({
  active = false,
  disabled,
  icon,
  label,
  onClick,
  onMouseDown,
}: {
  active?: boolean;
  disabled: boolean;
  icon: ReactNode;
  label: string;
  onClick: () => void;
  onMouseDown?: MouseEventHandler<HTMLElement>;
}) {
  return (
    <Tooltip title={label}>
      <Button
        type="text"
        aria-label={label}
        aria-pressed={active}
        className={active ? "cms-rich-text-control-active" : undefined}
        disabled={disabled}
        icon={icon}
        onClick={onClick}
        onMouseDown={onMouseDown}
      />
    </Tooltip>
  );
}

function LinkControl({ editor, disabled }: { editor: Editor; disabled: boolean }) {
  const [open, setOpen] = useState(false);
  const [href, setHref] = useState("");
  const [error, setError] = useState("");

  function handleOpenChange(nextOpen: boolean) {
    if (nextOpen) {
      setHref(String(editor.getAttributes("link").href ?? ""));
      setError("");
    }
    setOpen(nextOpen);
  }

  function applyLink() {
    const nextHref = href.trim();
    if (!nextHref) {
      editor.chain().focus().unsetLink().run();
      closePopover();
      return;
    }

    if (!isSafeRichTextHref(nextHref)) {
      setError("Enter a safe web, email, phone, or relative link");
      return;
    }

    editor.chain().focus().extendMarkRange("link").setLink({ href: nextHref }).run();
    closePopover();
  }

  function removeLink() {
    editor.chain().focus().unsetLink().run();
    closePopover();
  }

  function closePopover() {
    setError("");
    setOpen(false);
  }

  const content = (
    <Space direction="vertical" size={8} className="cms-rich-text-link-form">
      <Input
        aria-label="Link destination"
        placeholder="https://example.com"
        status={error ? "error" : undefined}
        value={href}
        onChange={(event) => setHref(event.target.value)}
        onPressEnter={applyLink}
      />
      {error ? <Typography.Text type="danger">{error}</Typography.Text> : null}
      <Space wrap>
        <Button type="primary" onClick={applyLink}>
          Apply
        </Button>
        <Button disabled={!editor.isActive("link")} onClick={removeLink}>
          Remove
        </Button>
      </Space>
    </Space>
  );

  return (
    <Popover
      content={content}
      open={open}
      placement="bottomLeft"
      trigger="click"
      onOpenChange={handleOpenChange}
    >
      <Tooltip title="Link">
        <Button
          type="text"
          aria-label="Link"
          aria-pressed={editor.isActive("link")}
          className={editor.isActive("link") ? "cms-rich-text-control-active" : undefined}
          disabled={disabled}
          icon={<LinkOutlined />}
        />
      </Tooltip>
    </Popover>
  );
}

function activeBlock(editor: Editor): BlockType {
  if (editor.isActive("heading", { level: 2 })) return "heading-2";
  if (editor.isActive("heading", { level: 3 })) return "heading-3";
  return "paragraph";
}

function setBlock(editor: Editor, value: BlockType) {
  if (!hasTextSelection(editor.state.selection)) return;

  const nodeType =
    value === "paragraph" ? editor.schema.nodes.paragraph : editor.schema.nodes.heading;
  const attributes =
    value === "paragraph" ? undefined : { level: value === "heading-2" ? 2 : 3 };
  const transaction = setSelectedBlockType(editor.state.tr, nodeType, attributes);

  if (!transaction) return;
  editor.view.dispatch(transaction);
  editor.view.focus();
}

type RichTextErrorBoundaryProps = RichTextEditorProps & { children: ReactNode };
type RichTextErrorBoundaryState = { hasError: boolean };

class RichTextErrorBoundary extends Component<
  RichTextErrorBoundaryProps,
  RichTextErrorBoundaryState
> {
  state: RichTextErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): RichTextErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Rich text editor failed to render", error, info);
  }

  componentDidUpdate(previousProps: RichTextErrorBoundaryProps) {
    if (this.state.hasError && previousProps.value !== this.props.value) {
      this.setState({ hasError: false });
    }
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    const { value, onChange, disabled } = this.props;
    return (
      <Input.TextArea
        className="cms-tour-editor-description"
        rows={12}
        disabled={disabled}
        value={richTextToPlainText(value ?? "")}
        onChange={(event) => onChange?.(normalizeRichText(event.target.value))}
      />
    );
  }
}
