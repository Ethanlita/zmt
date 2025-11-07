import React, { useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Link from '@tiptap/extension-link';
import Underline from '@tiptap/extension-underline';
import TextStyle from '@tiptap/extension-text-style';
import Image from '@tiptap/extension-image';
import { marked } from 'marked';
import TurndownService from 'turndown';
import { useNotificationStore } from '../store/notificationStore';
import { getErrorMessage } from '../utils/errorMessage';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
}

const turndown = new TurndownService();
const headingLevels = [1, 2, 3, 4] as const;

const RichTextEditor: React.FC<RichTextEditorProps> = ({ value, onChange }) => {
  const showNotification = useNotificationStore((state) => state.showNotification);
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3, 4],
        },
      }),
      Placeholder.configure({
        placeholder: '开始输入内容...',
      }),
      Link.configure({
        openOnClick: false,
        autolink: true,
      }),
      Underline,
      TextStyle,
      Image.configure({ inline: false }),
    ],
    editorProps: {
      attributes: {
        class:
          'prose max-w-none prose-sm sm:prose lg:prose-lg focus:outline-none px-4 py-3 min-h-[320px] bg-white',
      },
    },
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  useEffect(() => {
    if (!editor) return;
    const current = editor.getHTML();
    if (value !== current) {
      editor.commands.setContent(value || '', false);
    }
  }, [editor, value]);

  if (!editor) {
    return null;
  }

  const insertLink = () => {
    const url = prompt('请输入链接地址');
    if (!url) return;
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };

  const removeLink = () => {
    editor.chain().focus().unsetLink().run();
  };

  const insertAnchor = () => {
    const anchorId = prompt('请输入锚点 ID（用于页面内导航）');
    if (!anchorId) return;
    editor.chain().focus().insertContent(`<span id="${anchorId}"></span>`).run();
  };

  const insertImage = () => {
    const url = prompt('请输入图片链接（支持 CDN 或 S3 地址）');
    if (!url) return;
    editor.chain().focus().setImage({ src: url }).run();
  };

  const insertVideo = () => {
    const url = prompt('请输入视频链接或嵌入代码');
    if (!url) return;
    if (url.includes('<iframe')) {
      editor.chain().focus().insertContent(url).run();
    } else if (url.endsWith('.mp4') || url.startsWith('http')) {
      editor
        .chain()
        .focus()
        .insertContent(
          `<div class="video-wrapper"><video controls src="${url}" class="w-full rounded"></video></div>`,
        )
        .run();
    }
  };

  const importMarkdown = () => {
    const markdown = prompt('粘贴 Markdown 内容，导入后将覆盖当前编辑器内容');
    if (!markdown) return;
    const html = marked.parse(markdown);
    editor.commands.setContent(html, false);
  };

  const exportMarkdown = async () => {
    const html = editor.getHTML();
    const markdown = turndown.turndown(html);
    try {
      await navigator.clipboard.writeText(markdown);
      showNotification('已复制为 Markdown 文本', 'success');
    } catch (error) {
      console.error('复制失败，以下为导出的 Markdown 内容：', markdown, error);
      showNotification(
        `复制失败：${getErrorMessage(error)}。请在控制台复制生成的 Markdown 内容`,
        'error',
        5000,
      );
    }
  };

  const insertTableOfContents = () => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(editor.getHTML(), 'text/html');
    const headings = Array.from(doc.querySelectorAll('h1, h2, h3, h4'));

    if (headings.length === 0) {
      showNotification('当前内容中没有可用的标题', 'info');
      return;
    }

    const tocItems = headings.map((heading) => {
      let id = heading.id;
      if (!id) {
        id = heading.textContent?.trim().toLowerCase().replace(/\s+/g, '-') || 'section';
        heading.id = id;
      }
      return `<li class="toc-level-${heading.tagName.toLowerCase()}"><a href="#${id}">${heading.textContent}</a></li>`;
    });

    editor
      .chain()
      .focus()
      .insertContent(`
        <nav class="page-toc">
          <strong>页面导航</strong>
          <ul>
            ${tocItems.join('\n')}
          </ul>
        </nav>
      `)
      .run();
  };

  return (
    <div className="border border-gray-300 rounded-lg overflow-hidden bg-white">
      {/* Toolbar */}
      <div className="bg-gray-50 border-b border-gray-200 p-2 flex gap-2 flex-wrap">
        <ToolbarButton
          active={editor.isActive('bold')}
          onClick={() => editor.chain().focus().toggleBold().run()}
          label="B"
        />
        <ToolbarButton
          active={editor.isActive('italic')}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          label="I"
        />
        <ToolbarButton
          active={editor.isActive('underline')}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          label="U"
        />
        <ToolbarDivider />
        {headingLevels.map((level) => (
          <ToolbarButton
            key={level}
            active={editor.isActive('heading', { level })}
            onClick={() => editor.chain().focus().toggleHeading({ level }).run()}
            label={`H${level}`}
          />
        ))}
        <ToolbarDivider />
        <ToolbarButton
          active={editor.isActive('bulletList')}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          label="• 列表"
        />
        <ToolbarButton
          active={editor.isActive('orderedList')}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          label="1. 列表"
        />
        <ToolbarButton
          active={editor.isActive('blockquote')}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          label="引用"
        />
        <ToolbarButton
          active={editor.isActive('codeBlock')}
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          label="代码"
        />
        <ToolbarDivider />
        <ToolbarButton active={editor.isActive('link')} onClick={insertLink} label="插入链接" />
        <ToolbarButton active={false} onClick={removeLink} label="移除链接" />
        <ToolbarButton active={false} onClick={insertAnchor} label="页面锚点" />
        <ToolbarButton active={false} onClick={insertTableOfContents} label="插入目录" />
        <ToolbarDivider />
        <ToolbarButton active={false} onClick={insertImage} label="插入图片" />
        <ToolbarButton active={false} onClick={insertVideo} label="插入视频" />
        <ToolbarDivider />
        <ToolbarButton active={false} onClick={importMarkdown} label="导入 Markdown" />
        <ToolbarButton active={false} onClick={exportMarkdown} label="复制为 Markdown" />
      </div>

      {/* Editor */}
      <EditorContent editor={editor} />
    </div>
  );
};

interface ToolbarButtonProps {
  active: boolean;
  onClick: () => void;
  label: string;
}

const ToolbarButton: React.FC<ToolbarButtonProps> = ({ active, onClick, label }) => (
  <button
    type="button"
    onClick={onClick}
    className={`px-3 py-1 rounded text-sm transition-colors ${
      active ? 'bg-primary-100 text-primary-700' : 'bg-white text-gray-700 hover:bg-gray-100'
    }`}
  >
    {label}
  </button>
);

const ToolbarDivider: React.FC = () => <div className="w-px bg-gray-300" />;

export default RichTextEditor;
