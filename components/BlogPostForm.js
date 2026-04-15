'use client';
import { useState } from 'react';
import dynamic from 'next/dynamic';

const TipTapEditor = dynamic(() => import('./TipTapEditor'), { ssr: false, loading: () => <div style={{ padding: '40px', color: '#ccc', textAlign: 'center' }}>Loading editor…</div> });

export default function BlogPostForm({ post, action, categories = [] }) {
  const [content, setContent] = useState(post?.content || '');

  return (
    <form action={action}>
      {post && <input type="hidden" name="id" value={post.id} />}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
        <div>
          <label style={labelStyle}>Post Title *</label>
          <input name="title" required defaultValue={post?.title || ''} style={inputStyle} placeholder="e.g. Summer Fashion Trends 2026" />
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
