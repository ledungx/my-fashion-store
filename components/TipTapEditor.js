'use client';
import { useEditor, EditorContent, BubbleMenu } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import Highlight from '@tiptap/extension-highlight';
import Youtube from '@tiptap/extension-youtube';
import { useState, useCallback, useEffect, useRef } from 'react';

export default function TipTapEditor({ content = '', onChange, name = 'content' }) {
  const hiddenInput = useRef(null);
  const [linkUrl, setLinkUrl] = useState('');
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3, 4] },
      }),
      Image.configure({ HTMLAttributes: { class: 'blog-embedded-img' } }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { class: 'blog-link', rel: 'noopener noreferrer', target: '_blank' },
      }),
      Placeholder.configure({ placeholder: 'Start writing your blog post…' }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Underline,
      Highlight.configure({ multicolor: false }),
      Youtube.configure({ width: 640, height: 360, HTMLAttributes: { class: 'blog-youtube' } }),
    ],
    content: content || '',
    editorProps: {
      attributes: {
        class: 'tiptap-editor-content',
        spellcheck: 'true',
      },
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      if (hiddenInput.current) hiddenInput.current.value = html;
      if (onChange) onChange(html);
    },
  });

  // Sync initial content to hidden input
  useEffect(() => {
    if (hiddenInput.current && content) {
      hiddenInput.current.value = content;
    }
  }, [content]);

  const addImage = useCallback(() => {
    const url = window.prompt('Image URL:');
    if (url && editor) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  }, [editor]);

  const addYoutube = useCallback(() => {
    const url = window.prompt('YouTube URL:');
    if (url && editor) {
      editor.commands.setYoutubeVideo({ src: url });
    }
  }, [editor]);

  const setLink = useCallback(() => {
    if (!editor) return;
    if (showLinkInput) {
      if (linkUrl) {
        editor.chain().focus().extendMarkRange('link').setLink({ href: linkUrl }).run();
      }
      setShowLinkInput(false);
      setLinkUrl('');
    } else {
      const prev = editor.getAttributes('link').href;
      setLinkUrl(prev || '');
      setShowLinkInput(true);
    }
  }, [editor, showLinkInput, linkUrl]);

  const removeLink = useCallback(() => {
    if (editor) editor.chain().focus().unsetLink().run();
    setShowLinkInput(false);
  }, [editor]);

  if (!editor) return null;

  const wrapperStyle = isFullscreen ? {
    position: 'fixed', inset: 0, zIndex: 9999, backgroundColor: '#fff',
    display: 'flex', flexDirection: 'column', overflow: 'hidden',
  } : {};

  return (
    <div style={wrapperStyle}>
      {/* Hidden input for form submission */}
      <input type="hidden" name={name} ref={hiddenInput} defaultValue={content} />

      {/* ── Toolbar ── */}
      <div style={{
        display: 'flex', flexWrap: 'wrap', gap: '2px', padding: '10px 12px',
        borderBottom: '1.5px solid #e8e8e8', background: '#fafafa',
        borderRadius: isFullscreen ? '0' : '8px 8px 0 0',
        position: 'sticky', top: 0, zIndex: 10,
      }}>
        {/* Text format group */}
        <ToolbarGroup>
          <ToolBtn onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} title="Bold">
            <b>B</b>
          </ToolBtn>
          <ToolBtn onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} title="Italic">
            <i>I</i>
          </ToolBtn>
          <ToolBtn onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive('underline')} title="Underline">
            <u>U</u>
          </ToolBtn>
          <ToolBtn onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive('strike')} title="Strikethrough">
            <s>S</s>
          </ToolBtn>
          <ToolBtn onClick={() => editor.chain().focus().toggleHighlight().run()} active={editor.isActive('highlight')} title="Highlight">
            <span style={{ backgroundColor: '#fef08a', padding: '0 3px', borderRadius: '2px' }}>H</span>
          </ToolBtn>
        </ToolbarGroup>

        <Divider />

        {/* Headings */}
        <ToolbarGroup>
          <ToolBtn onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive('heading', { level: 2 })} title="Heading 2">
            H2
          </ToolBtn>
          <ToolBtn onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive('heading', { level: 3 })} title="Heading 3">
            H3
          </ToolBtn>
          <ToolBtn onClick={() => editor.chain().focus().toggleHeading({ level: 4 }).run()} active={editor.isActive('heading', { level: 4 })} title="Heading 4">
            H4
          </ToolBtn>
          <ToolBtn onClick={() => editor.chain().focus().setParagraph().run()} active={editor.isActive('paragraph')} title="Normal text">
            ¶
          </ToolBtn>
        </ToolbarGroup>

        <Divider />

        {/* Alignment */}
        <ToolbarGroup>
          <ToolBtn onClick={() => editor.chain().focus().setTextAlign('left').run()} active={editor.isActive({ textAlign: 'left' })} title="Align left">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="17" y1="10" x2="3" y2="10"/><line x1="21" y1="6" x2="3" y2="6"/><line x1="21" y1="14" x2="3" y2="14"/><line x1="17" y1="18" x2="3" y2="18"/></svg>
          </ToolBtn>
          <ToolBtn onClick={() => editor.chain().focus().setTextAlign('center').run()} active={editor.isActive({ textAlign: 'center' })} title="Center">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="10" x2="6" y2="10"/><line x1="21" y1="6" x2="3" y2="6"/><line x1="21" y1="14" x2="3" y2="14"/><line x1="18" y1="18" x2="6" y2="18"/></svg>
          </ToolBtn>
          <ToolBtn onClick={() => editor.chain().focus().setTextAlign('right').run()} active={editor.isActive({ textAlign: 'right' })} title="Align right">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="21" y1="10" x2="7" y2="10"/><line x1="21" y1="6" x2="3" y2="6"/><line x1="21" y1="14" x2="3" y2="14"/><line x1="21" y1="18" x2="7" y2="18"/></svg>
          </ToolBtn>
        </ToolbarGroup>

        <Divider />

        {/* Lists & Blocks */}
        <ToolbarGroup>
          <ToolBtn onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} title="Bullet list">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><circle cx="4" cy="6" r="1" fill="currentColor"/><circle cx="4" cy="12" r="1" fill="currentColor"/><circle cx="4" cy="18" r="1" fill="currentColor"/></svg>
          </ToolBtn>
          <ToolBtn onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} title="Numbered list">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="10" y1="6" x2="21" y2="6"/><line x1="10" y1="12" x2="21" y2="12"/><line x1="10" y1="18" x2="21" y2="18"/><text x="3" y="8" fontSize="8" fill="currentColor" fontWeight="bold">1</text><text x="3" y="14" fontSize="8" fill="currentColor" fontWeight="bold">2</text><text x="3" y="20" fontSize="8" fill="currentColor" fontWeight="bold">3</text></svg>
          </ToolBtn>
          <ToolBtn onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive('blockquote')} title="Blockquote">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V21z"/><path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3z"/></svg>
          </ToolBtn>
          <ToolBtn onClick={() => editor.chain().focus().toggleCodeBlock().run()} active={editor.isActive('codeBlock')} title="Code block">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
          </ToolBtn>
          <ToolBtn onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Horizontal rule">
            —
          </ToolBtn>
        </ToolbarGroup>

        <Divider />

        {/* Media & Links */}
        <ToolbarGroup>
          <ToolBtn onClick={setLink} active={editor.isActive('link')} title="Insert link">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
          </ToolBtn>
          {editor.isActive('link') && (
            <ToolBtn onClick={removeLink} title="Remove link" danger>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18.84 12.25l1.72-1.71a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M5.16 11.75l-1.72 1.71a5 5 0 0 0 7.07 7.07l1.72-1.71"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
            </ToolBtn>
          )}
          <ToolBtn onClick={addImage} title="Insert image">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
          </ToolBtn>
          <ToolBtn onClick={addYoutube} title="Embed YouTube">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19.13C5.12 19.56 12 19.56 12 19.56s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"/><polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"/></svg>
          </ToolBtn>
        </ToolbarGroup>

        <Divider />

        {/* Undo/Redo & Fullscreen */}
        <ToolbarGroup>
          <ToolBtn onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} title="Undo">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>
          </ToolBtn>
          <ToolBtn onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} title="Redo">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
          </ToolBtn>
        </ToolbarGroup>

        <div style={{ marginLeft: 'auto' }}>
          <ToolBtn onClick={() => setIsFullscreen(!isFullscreen)} title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}>
            {isFullscreen ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="4 14 10 14 10 20"/><polyline points="20 10 14 10 14 4"/><line x1="14" y1="10" x2="21" y2="3"/><line x1="3" y1="21" x2="10" y2="14"/></svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>
            )}
          </ToolBtn>
        </div>
      </div>

      {/* Link URL Input */}
      {showLinkInput && (
        <div style={{ display: 'flex', gap: '8px', padding: '10px 12px', background: '#f0f4ff', borderBottom: '1px solid #dde4f0' }}>
          <input
            type="url"
            value={linkUrl}
            onChange={e => setLinkUrl(e.target.value)}
            placeholder="https://example.com"
            autoFocus
            onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), setLink())}
            style={{ flex: 1, padding: '8px 12px', border: '1px solid #ccc', borderRadius: '6px', fontSize: '13px', outline: 'none' }}
          />
          <button onClick={setLink} type="button" style={{ padding: '8px 16px', background: '#111', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>
            Apply
          </button>
          <button onClick={() => { setShowLinkInput(false); setLinkUrl(''); }} type="button" style={{ padding: '8px 12px', background: 'none', border: '1px solid #ddd', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', color: '#666' }}>
            Cancel
          </button>
        </div>
      )}

      {/* ── Editor Area ── */}
      <div style={{
        border: '1.5px solid #e8e8e8',
        borderTop: 'none',
        borderRadius: isFullscreen ? '0' : '0 0 8px 8px',
        minHeight: isFullscreen ? '0' : '400px',
        flex: isFullscreen ? 1 : 'none',
        overflow: 'auto',
        backgroundColor: '#fff',
      }}>
        <EditorContent editor={editor} />
      </div>

      {/* ── Char Count ──  */}
      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', fontSize: '11px', color: '#aaa' }}>
        <span>{editor.storage.characterCount?.characters?.() || editor.getText().length} characters</span>
        <span>~{Math.max(1, Math.ceil(editor.getText().length / 1000))} min read</span>
      </div>

      {/* ── Editor Styles ── */}
      <style dangerouslySetInnerHTML={{ __html: `
        .tiptap-editor-content {
          padding: 32px 40px;
          font-family: 'Inter', sans-serif;
          font-size: 16px;
          line-height: 1.8;
          color: #333;
          outline: none;
          min-height: 350px;
        }
        .tiptap-editor-content > *:first-child { margin-top: 0; }
        .tiptap-editor-content p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: #ccc;
          pointer-events: none;
          height: 0;
          font-style: italic;
        }
        .tiptap-editor-content h2 {
          font-size: 26px; font-weight: 800; margin: 40px 0 16px; color: #111;
        }
        .tiptap-editor-content h3 {
          font-size: 20px; font-weight: 700; margin: 32px 0 12px; color: #222;
        }
        .tiptap-editor-content h4 {
          font-size: 17px; font-weight: 700; margin: 24px 0 10px; color: #333;
        }
        .tiptap-editor-content p { margin: 0 0 16px; }
        .tiptap-editor-content ul, .tiptap-editor-content ol {
          padding-left: 28px; margin: 12px 0;
        }
        .tiptap-editor-content li { margin-bottom: 6px; }
        .tiptap-editor-content blockquote {
          border-left: 4px solid #F05A5A;
          margin: 24px 0;
          padding: 12px 20px;
          background: #fafafa;
          border-radius: 0 8px 8px 0;
          color: #555;
          font-style: italic;
        }
        .tiptap-editor-content pre {
          background: #1a1a2e;
          color: #e0e0e0;
          padding: 20px;
          border-radius: 10px;
          font-family: 'JetBrains Mono', monospace;
          font-size: 14px;
          overflow-x: auto;
          margin: 20px 0;
        }
        .tiptap-editor-content code {
          background: #f3f3f3;
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 14px;
        }
        .tiptap-editor-content pre code {
          background: none; padding: 0;
        }
        .tiptap-editor-content hr {
          border: none; border-top: 2px solid #eee; margin: 32px 0;
        }
        .tiptap-editor-content a { color: #F05A5A; text-decoration: underline; }
        .tiptap-editor-content mark { background: #fef08a; padding: 1px 3px; border-radius: 2px; }
        .blog-embedded-img {
          max-width: 100%; height: auto; border-radius: 12px; margin: 24px 0; display: block;
        }
        .blog-youtube {
          border-radius: 12px; margin: 24px auto; display: block;
        }
        .tiptap-editor-content iframe {
          border-radius: 12px; max-width: 100%;
        }
      `}} />
    </div>
  );
}

/* ── Sub-components ── */

function ToolbarGroup({ children }) {
  return <div style={{ display: 'flex', gap: '1px' }}>{children}</div>;
}

function Divider() {
  return <div style={{ width: '1px', background: '#e0e0e0', margin: '4px 8px', alignSelf: 'stretch' }} />;
}

function ToolBtn({ onClick, active, disabled, title, danger, children }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      type="button"
      style={{
        width: '34px',
        height: '34px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: 'none',
        borderRadius: '6px',
        cursor: disabled ? 'not-allowed' : 'pointer',
        fontSize: '13px',
        fontWeight: '600',
        fontFamily: 'Inter, sans-serif',
        transition: 'all 0.15s',
        background: active ? '#111' : 'transparent',
        color: active ? '#fff' : danger ? '#F05A5A' : disabled ? '#ccc' : '#555',
        opacity: disabled ? 0.4 : 1,
      }}
      onMouseEnter={e => { if (!active && !disabled) e.currentTarget.style.background = '#f0f0f0'; }}
      onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}
    >
      {children}
    </button>
  );
}
