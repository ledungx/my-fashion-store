import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import BlogPostForm from '../../../components/BlogPostForm';
const { Pool } = require('pg');

let prisma;
if (process.env.NODE_ENV === 'production') {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  prisma = new PrismaClient({ adapter });
} else {
  if (!global.prisma) {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    const adapter = new PrismaPg(pool);
    global.prisma = new PrismaClient({ adapter });
  }
  prisma = global.prisma;
}

export const revalidate = 0;

function generateSlug(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

// ── Server Actions ──

async function createPost(formData) {
  'use server';
  const title = formData.get('title');
  const content = formData.get('content') || '';
  const excerpt = formData.get('excerpt') || '';
  const coverImage = formData.get('coverImage') || '';
  const status = formData.get('status') || 'DRAFT';
  const author = formData.get('author') || 'Admin';
  const categoryId = formData.get('categoryId') || '';
  const metaTitle = formData.get('metaTitle') || '';
  const metaDescription = formData.get('metaDescription') || '';

  const slug = generateSlug(title) + '-' + Date.now().toString(36);

  await prisma.blogPost.create({
    data: {
      title, slug, content,
      excerpt: excerpt || null,
      coverImage: coverImage || null,
      status, author,
      categoryId: categoryId || null,
      metaTitle: metaTitle || null,
      metaDescription: metaDescription || null,
      publishedAt: status === 'PUBLISHED' ? new Date() : null,
    }
  });

  revalidatePath('/admin/blog');
  revalidatePath('/blog');
  redirect('/admin/blog');
}

async function updatePost(formData) {
  'use server';
  const id = formData.get('id');
  const title = formData.get('title');
  const content = formData.get('content') || '';
  const excerpt = formData.get('excerpt') || '';
  const coverImage = formData.get('coverImage') || '';
  const status = formData.get('status') || 'DRAFT';
  const author = formData.get('author') || 'Admin';
  const categoryId = formData.get('categoryId') || '';
  const metaTitle = formData.get('metaTitle') || '';
  const metaDescription = formData.get('metaDescription') || '';

  const existing = await prisma.blogPost.findUnique({ where: { id } });

  await prisma.blogPost.update({
    where: { id },
    data: {
      title, content,
      excerpt: excerpt || null,
      coverImage: coverImage || null,
      status, author,
      categoryId: categoryId || null,
      metaTitle: metaTitle || null,
      metaDescription: metaDescription || null,
      publishedAt: status === 'PUBLISHED' && !existing?.publishedAt ? new Date() : existing?.publishedAt,
    }
  });

  revalidatePath('/admin/blog');
  revalidatePath('/blog');
  redirect('/admin/blog');
}

async function deletePost(formData) {
  'use server';
  const id = formData.get('id');
  await prisma.blogPost.delete({ where: { id } });
  revalidatePath('/admin/blog');
  revalidatePath('/blog');
}

async function toggleStatus(formData) {
  'use server';
  const id = formData.get('id');
  const post = await prisma.blogPost.findUnique({ where: { id } });
  if (!post) return;

  const newStatus = post.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED';
  await prisma.blogPost.update({
    where: { id },
    data: {
      status: newStatus,
      publishedAt: newStatus === 'PUBLISHED' && !post.publishedAt ? new Date() : post.publishedAt,
    }
  });
  revalidatePath('/admin/blog');
  revalidatePath('/blog');
}

export default async function AdminBlogPage({ searchParams }) {
  const sp = await searchParams;
  const editId = sp?.edit;
  const isCreating = sp?.new === '1';

  const [posts, categories] = await Promise.all([
    prisma.blogPost.findMany({
      orderBy: { createdAt: 'desc' },
      include: { category: true },
    }),
    prisma.category.findMany({
      where: { parentId: null },
      orderBy: { name: 'asc' },
    }),
  ]);

  let editPost = null;
  if (editId) {
    editPost = await prisma.blogPost.findUnique({ where: { id: editId } });
  }

  const showForm = isCreating || editPost;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: '800', color: '#111', margin: 0 }}>Blog Manager</h1>
        {!showForm && (
          <Link href="/admin/blog?new=1" style={{ padding: '12px 28px', background: '#111', color: '#fff', textDecoration: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '700', letterSpacing: '0.05em' }}>
            + NEW POST
          </Link>
        )}
      </div>

      {showForm && (
        <div style={{ backgroundColor: '#fff', padding: '40px', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.04)', marginBottom: '40px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#111', margin: 0 }}>
              {editPost ? 'Edit Post' : 'Create New Post'}
            </h2>
            <Link href="/admin/blog" style={{ color: '#F05A5A', textDecoration: 'none', fontSize: '14px', fontWeight: '600' }}>
              ← Back to List
            </Link>
          </div>
          <BlogPostForm
            post={editPost ? JSON.parse(JSON.stringify(editPost)) : null}
            action={editPost ? updatePost : createPost}
            categories={JSON.parse(JSON.stringify(categories))}
          />
        </div>
      )}

      {/* Posts Table */}
      <div style={{ backgroundColor: '#fff', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.04)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #f0f0f0', textAlign: 'left' }}>
              <th style={thStyle}>Title</th>
              <th style={{ ...thStyle, width: '120px' }}>Category</th>
              <th style={{ ...thStyle, width: '90px' }}>Status</th>
              <th style={{ ...thStyle, width: '100px' }}>Author</th>
              <th style={{ ...thStyle, width: '130px' }}>Date</th>
              <th style={{ ...thStyle, width: '200px', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {posts.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ padding: '60px', textAlign: 'center', color: '#aaa', fontSize: '15px' }}>
                  No blog posts yet. Click "+ NEW POST" to create your first article.
                </td>
              </tr>
            ) : (
              posts.map(post => (
                <tr key={post.id} style={{ borderBottom: '1px solid #f5f5f5' }}>
                  <td style={tdStyle}>
                    <div style={{ fontWeight: '600', color: '#111', marginBottom: '2px' }}>{post.title}</div>
                    <div style={{ fontSize: '12px', color: '#aaa' }}>/{post.slug}</div>
                  </td>
                  <td style={{ ...tdStyle, fontSize: '12px', color: '#888' }}>
                    {post.category?.name || '—'}
                  </td>
                  <td style={tdStyle}>
                    <form action={toggleStatus} style={{ display: 'inline' }}>
                      <input type="hidden" name="id" value={post.id} />
                      <button type="submit" style={{
                        padding: '4px 12px', borderRadius: '20px', border: 'none', fontSize: '11px', fontWeight: '700', cursor: 'pointer',
                        background: post.status === 'PUBLISHED' ? '#e8f5e9' : '#fff3e0',
                        color: post.status === 'PUBLISHED' ? '#2e7d32' : '#e65100',
                      }}>
                        {post.status === 'PUBLISHED' ? '🟢 Live' : '📝 Draft'}
                      </button>
                    </form>
                  </td>
                  <td style={{ ...tdStyle, color: '#666', fontSize: '13px' }}>{post.author}</td>
                  <td style={{ ...tdStyle, color: '#888', fontSize: '13px' }}>
                    {new Date(post.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </td>
                  <td style={{ ...tdStyle, textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                      <Link href={`/blog/${post.slug}`} target="_blank" style={{ padding: '6px 14px', borderRadius: '6px', border: '1px solid #e0e0e0', color: '#555', fontSize: '12px', fontWeight: '600', textDecoration: 'none' }}>
                        View
                      </Link>
                      <Link href={`/admin/blog?edit=${post.id}`} style={{ padding: '6px 14px', borderRadius: '6px', background: '#111', color: '#fff', fontSize: '12px', fontWeight: '600', textDecoration: 'none' }}>
                        Edit
                      </Link>
                      <form action={deletePost} style={{ display: 'inline' }}>
                        <input type="hidden" name="id" value={post.id} />
                        <button type="submit" style={{ padding: '6px 14px', borderRadius: '6px', background: 'none', border: '1px solid #F05A5A', color: '#F05A5A', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>
                          Delete
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: '20px', fontSize: '13px', color: '#aaa', display: 'flex', gap: '20px' }}>
        <span>Total: {posts.length}</span>
        <span>Published: {posts.filter(p => p.status === 'PUBLISHED').length}</span>
        <span>Drafts: {posts.filter(p => p.status === 'DRAFT').length}</span>
      </div>
    </div>
  );
}

const thStyle = { padding: '16px 20px', fontSize: '11px', fontWeight: '700', color: '#999', textTransform: 'uppercase', letterSpacing: '0.06em' };
const tdStyle = { padding: '16px 20px', verticalAlign: 'middle' };
