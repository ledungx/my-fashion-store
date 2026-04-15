import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
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

export const revalidate = 60;

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const post = await prisma.blogPost.findUnique({ where: { slug } });
  if (!post) return { title: 'Post Not Found' };

  return {
    title: post.metaTitle || `${post.title} – Blog`,
    description: post.metaDescription || post.excerpt || `Read "${post.title}" on our fashion blog.`,
    openGraph: {
      title: post.title,
      description: post.excerpt || '',
      images: post.coverImage ? [{ url: post.coverImage, width: 1200, height: 630, alt: post.title }] : [],
      type: 'article',
      publishedTime: post.publishedAt?.toISOString(),
      authors: [post.author],
    },
  };
}

export default async function BlogPostPage({ params }) {
  const { slug } = await params;
  const post = await prisma.blogPost.findUnique({
    where: { slug },
    include: { category: true },
  });

  if (!post || post.status !== 'PUBLISHED') {
    notFound();
  }

  const [related, categories, recentPosts] = await Promise.all([
    prisma.blogPost.findMany({
      where: { status: 'PUBLISHED', id: { not: post.id } },
      orderBy: { publishedAt: 'desc' },
      take: 3,
    }),
    prisma.category.findMany({
      where: { parentId: null, blogPosts: { some: { status: 'PUBLISHED' } } },
      orderBy: { name: 'asc' },
    }),
    prisma.blogPost.findMany({
      where: { status: 'PUBLISHED', id: { not: post.id } },
      orderBy: { publishedAt: 'desc' },
      take: 5,
      select: { id: true, title: true, slug: true },
    }),
  ]);

  return (
    <main style={{ backgroundColor: '#fff', color: '#111', minHeight: '100vh', fontFamily: 'Inter, sans-serif' }}>

      {/* Breadcrumb */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px 20px 0' }}>
        <div style={{ fontSize: '13px', color: '#999', display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          <Link href="/" style={{ color: '#999', textDecoration: 'none' }}>Home</Link>
          <span style={{ color: '#ccc' }}>/</span>
          <Link href="/blog" style={{ color: '#999', textDecoration: 'none' }}>Blog</Link>
          <span style={{ color: '#ccc' }}>/</span>
          <span style={{ color: '#333' }}>{post.title}</span>
        </div>
      </div>

      {/* Main layout: article + sidebar */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '30px 20px 80px', display: 'grid', gridTemplateColumns: '1fr 300px', gap: '60px' }}>

        {/* ── Article ── */}
        <article>
          {/* Cover Image */}
          {post.coverImage && (
            <div style={{ position: 'relative', width: '100%', aspectRatio: '16/9', overflow: 'hidden', marginBottom: '30px', borderRadius: '4px', backgroundColor: '#f5f5f5' }}>
              <Image src={post.coverImage} alt={post.title} fill style={{ objectFit: 'cover' }} unoptimized priority />
            </div>
          )}

          {/* Title */}
          <h1 style={{ fontSize: '32px', fontWeight: '800', lineHeight: '1.3', margin: '0 0 16px', color: '#111', letterSpacing: '-0.3px' }}>
            {post.title}
          </h1>

          {/* Meta */}
          <div style={{ fontSize: '13px', color: '#999', marginBottom: '30px', paddingBottom: '24px', borderBottom: '1px solid #eee', display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
            <span>By <span style={{ color: '#555' }}>{post.author}</span></span>
            <span>·</span>
            <span>{post.publishedAt && new Date(post.publishedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
            {post.category && (
              <>
                <span>·</span>
                <Link href={`/blog?category=${post.categoryId}`} style={{ color: '#c9a050', textDecoration: 'none', fontWeight: '600' }}>
                  {post.category.name}
                </Link>
              </>
            )}
          </div>

          {/* Body */}
          <div className="blog-content" dangerouslySetInnerHTML={{ __html: post.content }} />

          {/* Related Posts */}
          {related.length > 0 && (
            <div style={{ borderTop: '1px solid #eee', marginTop: '50px', paddingTop: '40px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '24px', color: '#111' }}>
                You May Also Like
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
                {related.map(r => (
                  <Link key={r.id} href={`/blog/${r.slug}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                    <div className="related-card">
                      {r.coverImage && (
                        <div style={{ position: 'relative', width: '100%', aspectRatio: '4/3', backgroundColor: '#f5f5f5', overflow: 'hidden', borderRadius: '4px', marginBottom: '10px' }}>
                          <Image src={r.coverImage} alt={r.title} fill style={{ objectFit: 'cover' }} unoptimized />
                        </div>
                      )}
                      <h4 style={{ fontSize: '14px', fontWeight: '600', margin: 0, lineHeight: '1.4', color: '#333' }}>{r.title}</h4>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </article>

        {/* ── Sidebar ── */}
        <aside>
          {/* Recent Posts */}
          <div style={{ marginBottom: '40px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '20px', color: '#111' }}>
              Recent Posts
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {recentPosts.map(rp => (
                <Link key={rp.id} href={`/blog/${rp.slug}`} style={{
                  fontSize: '14px', color: '#555', textDecoration: 'none', lineHeight: '1.5',
                  borderBottom: '1px solid #f0f0f0', paddingBottom: '14px', transition: 'color 0.2s',
                }}>
                  {rp.title}
                </Link>
              ))}
            </div>
          </div>

          {/* Categories */}
          {categories.length > 0 && (
            <div>
              <h3 style={{ fontSize: '14px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '20px', color: '#111' }}>
                Categories
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <Link href="/blog" style={{ fontSize: '14px', textDecoration: 'none', color: '#555' }}>All Posts</Link>
                {categories.map(cat => (
                  <Link key={cat.id} href={`/blog?category=${cat.id}`} style={{
                    fontSize: '14px', textDecoration: 'none',
                    color: post.categoryId === cat.id ? '#111' : '#555',
                    fontWeight: post.categoryId === cat.id ? '600' : '400',
                  }}>
                    {cat.name}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </aside>
      </div>

      {/* Styles */}
      <style dangerouslySetInnerHTML={{ __html: `
        .blog-content {
          font-size: 15px; line-height: 1.85; color: #444;
        }
        .blog-content h2 { font-size: 24px; font-weight: 800; margin: 40px 0 16px; color: #111; }
        .blog-content h3 { font-size: 19px; font-weight: 700; margin: 32px 0 12px; color: #222; }
        .blog-content p { margin: 0 0 18px; }
        .blog-content img { max-width: 100%; height: auto; border-radius: 6px; margin: 24px 0; }
        .blog-content blockquote {
          border-left: 3px solid #c9a050; margin: 28px 0; padding: 14px 24px;
          background: #faf8f4; border-radius: 0 6px 6px 0; font-style: italic; color: #555;
        }
        .blog-content ul, .blog-content ol { padding-left: 24px; margin: 14px 0; }
        .blog-content li { margin-bottom: 6px; }
        .blog-content a { color: #c9a050; text-decoration: underline; }
        .blog-content pre {
          background: #1a1a2e; color: #e0e0e0; padding: 20px; border-radius: 8px;
          font-family: 'JetBrains Mono', monospace; font-size: 13px; overflow-x: auto; margin: 20px 0;
        }
        .blog-content code { background: #f3f3f3; padding: 2px 6px; border-radius: 3px; font-size: 13px; }
        .blog-content pre code { background: none; padding: 0; }
        .blog-content hr { border: none; border-top: 1px solid #eee; margin: 32px 0; }
        .related-card:hover h4 { color: #111 !important; }
      `}} />
    </main>
  );
}
