'use client';
import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

const TipTapEditor = dynamic(() => import('./TipTapEditor'), { ssr: false, loading: () => <div style={{ padding: '40px', color: '#ccc', textAlign: 'center' }}>Loading editor…</div> });

function generateSlug(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

export default function BlogPostForm({ post, action, categories = [] }) {
  const [title, setTitle] = useState(post?.title || '');
  const [slug, setSlug] = useState(post?.slug || '');
  const [content, setContent] = useState(post?.content || '');
  const [isEditingSlug, setIsEditingSlug] = useState(false);
  const [hasCustomSlug, setHasCustomSlug] = useState(!!post?.slug);

  // Auto-generate slug from title if not manually edited
  useEffect(() => {
    if (!hasCustomSlug) {
      setSlug(generateSlug(title));
    }
  }, [title, hasCustomSlug]);

  const handleSlugBlur = () => {
    // Clean up slug on blur
    setSlug(generateSlug(slug));
  };

  return (
    <form action={action}>
      {post && <input type="hidden" name="id" value={post.id} />}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
        <div>
          <label style={labelStyle}>Post Title *</label>
          <input 
            name="title" 
            required 
            value={title} 
            onChange={(e) => setTitle(e.target.value)}
            style={inputStyle} 
            placeholder="e.g. Summer Fashion Trends 2026" 
          />
          {/* WordPress-style Permalink Preview */}
          <div style={{ marginTop: '8px', fontSize: '13px', color: '#666', display: 'flex', gap: '6px', alignItems: 'center' }}>
            <span style={{ fontWeight: '600', color: '#999' }}>Permalink:</span>
            <span style={{ color: '#ccc' }}>/blog/</span>
            {!isEditingSlug ? (
              <>
                <span style={{ borderBottom: '1px dashed #ccc', color: '#333' }}>{slug || '(post-title)'}</span>
                <button 
                  type="button" 
                  onClick={() => setIsEditingSlug(true)}
                  style={{ padding: '2px 8px', fontSize: '11px', fontWeight: '700', border: '1px solid #ddd', background: '#fff', borderRadius: '4px', cursor: 'pointer' }}
                >
                  EDIT
                </button>
              </>
            ) : (
              <>
                <input 
                  name="slug"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  onBlur={handleSlugBlur}
                  style={slugInputStyle}
                  autoFocus
                />
                <button 
                  type="button" 
                  onClick={() => {
                    setIsEditingSlug(false);
                    setHasCustomSlug(true);
                    setSlug(generateSlug(slug) || generateSlug(title));
                  }}
                  style={{ padding: '2px 8px', fontSize: '11px', fontWeight: '700', border: '1px solid #111', background: '#111', color: '#fff', borderRadius: '4px', cursor: 'pointer' }}
                >
                  OK
                </button>
                <button 
                  type="button" 
                  onClick={() => {
                    setIsEditingSlug(false);
                    setHasCustomSlug(false);
                    setSlug(generateSlug(title));
                  }}
                  style={{ padding: '2px 8px', fontSize: '11px', color: '#F05A5A', background: 'none', border: 'none', cursor: 'pointer', fontWeight: '600' }}
                >
                  Reset
                </button>
              </>
            )}
          </div>
          {/* Hidden input to ensure slug is always sent if not using the editable input */}
          {!isEditingSlug && <input type="hidden" name="slug" value={slug} />}
        </div>
        <div>
          <label style={labelStyle}>Author</label>
          <input name="author" defaultValue={post?.author || 'Admin'} style={inputStyle} placeholder="Author name" />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
        <div>
          <label style={labelStyle}>Cover Image URL</label>
          <input name="coverImage" defaultValue={post?.coverImage || ''} style={inputStyle} placeholder="https://cdn.example.com/hero.jpg" />
        </div>
        <div>
          <label style={labelStyle}>Category</label>
          <select name="categoryId" defaultValue={post?.categoryId || ''} style={inputStyle}>
            <option value="">— No Category —</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <label style={labelStyle}>Excerpt <span style={{ color: '#aaa', fontWeight: '400' }}>(shown on listing cards)</span></label>
        <textarea name="excerpt" defaultValue={post?.excerpt || ''} style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }} placeholder="A brief summary of the post..." />
      </div>

      <div style={{ marginBottom: '20px' }}>
        <label style={labelStyle}>Content *</label>
        <TipTapEditor content={content} onChange={setContent} name="content" />
      </div>

      {/* SEO Fields */}
      <details style={{ marginBottom: '20px', padding: '20px', background: '#fafafa', borderRadius: '10px', border: '1px solid #eee' }}>
        <summary style={{ cursor: 'pointer', fontSize: '13px', fontWeight: '700', color: '#666', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          SEO Settings
        </summary>
        <div style={{ marginTop: '16px', display: 'grid', gap: '16px' }}>
          <div>
            <label style={labelStyle}>Meta Title</label>
            <input name="metaTitle" defaultValue={post?.metaTitle || ''} style={inputStyle} placeholder="SEO title (defaults to post title)" />
          </div>
          <div>
            <label style={labelStyle}>Meta Description</label>
            <textarea name="metaDescription" defaultValue={post?.metaDescription || ''} style={{ ...inputStyle, minHeight: '60px', resize: 'vertical' }} placeholder="SEO description for search engines" />
          </div>
        </div>
      </details>

      {/* Status + Submit */}
      <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
        <select name="status" defaultValue={post?.status || 'DRAFT'} style={{ ...inputStyle, width: '180px' }}>
          <option value="DRAFT">📝 Draft</option>
          <option value="PUBLISHED">🟢 Published</option>
        </select>

        <button type="submit" style={{
          padding: '14px 36px',
          background: '#111',
          color: '#fff',
          border: 'none',
          borderRadius: '8px',
          fontSize: '13px',
          fontWeight: '700',
          letterSpacing: '0.06em',
          cursor: 'pointer',
        }}>
          {post ? 'UPDATE POST' : 'CREATE POST'}
        </button>
      </div>
    </form>
  );
}

const labelStyle = {
  display: 'block', fontSize: '12px', fontWeight: '700', color: '#555',
  marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.04em',
};

const inputStyle = {
  width: '100%', padding: '12px 16px', border: '1.5px solid #e8e8e8',
  borderRadius: '8px', fontSize: '14px', fontFamily: 'Inter, sans-serif',
  color: '#333', background: '#fafafa', outline: 'none', boxSizing: 'border-box',
};

const slugInputStyle = {
  background: 'none', border: 'none', borderBottom: '1px solid #c9a050',
  color: '#c9a050', fontSize: '13px', fontWeight: '600', padding: '0',
  outline: 'none', minWidth: '100px',
};
