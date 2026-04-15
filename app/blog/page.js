import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
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

export const metadata = {
  title: 'Blog – Fashion Tips, Dress Guides & Style Inspiration',
  description: 'Explore the latest fashion trends, dress tips, and styling guides. From glamorous evening gowns to casual-chic, find everything to elevate your personal style.',
};

const POSTS_PER_PAGE = 6;

export default async function BlogListPage({ searchParams }) {
  const sp = await searchParams;
  const page = Math.max(1, parseInt(sp?.page || '1'));
  const activeCat = sp?.category || '';

  const where = { status: 'PUBLISHED' };
  if (activeCat) where.categoryId = activeCat;

  const [posts, totalCount, categories, recentPosts] = await Promise.all([
    prisma.blogPost.findMany({
      where,
      orderBy: { publishedAt: 'desc' },
      skip: (page - 1) * POSTS_PER_PAGE,
      take: POSTS_PER_PAGE,
      include: { category: true },
    }),
    prisma.blogPost.count({ where }),
    prisma.category.findMany({
      where: {
        parentId: null,
        blogPosts: { some: { status: 'PUBLISHED' } },
      },
      orderBy: { name: 'asc' },
    }),
    prisma.blogPost.findMany({
      where: { status: 'PUBLISHED' },
      orderBy: { publishedAt: 'desc' },
      take: 5,
      select: { id: true, title: true, slug: true },
    }),
  ]);

  const totalPages = Math.ceil(totalCount / POSTS_PER_PAGE);

  return (
    <main style={{ backgroundColor: '#fff', color: '#111', minHeight: '100vh', fontFamily: 'Inter, sans-serif' }}>

      {/* Breadcrumb */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px 20px 0' }}>
        <div style={{ fontSize: '13px', color: '#999', display: 'flex', gap: '8px', alignItems: 'center' }}>
          <Link href="/" style={{ color: '#999', textDecoration: 'none' }}>Home</Link>
          <span style={{ color: '#ccc' }}>/</span>
          <span style={{ color: '#333' }}>Blog</span>
        </div>
      </div>

      {/* Main layout: content + sidebar */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '30px 20px 80px', display: 'grid', gridTemplateColumns: '1fr 300px', gap: '60px' }}>

        {/* ── Main Content ── */}
        <div>
          {posts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '100px 20px', color: '#aaa' }}>
              <h3 style={{ fontSize: '20px', fontWeight: '600', color: '#888', marginBottom: '8px' }}>No Posts Found</h3>
              <p style={{ fontSize: '14px' }}>
                {activeCat ? 'No posts in this category yet.' : 'Check back soon for fashion tips and style guides.'}
              </p>
              {activeCat && (
                <Link href="/blog" style={{ color: '#c9a050', textDecoration: 'underline', fontSize: '14px', marginTop: '12px', display: 'inline-block' }}>
                  View All Posts
                </Link>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {posts.map((post, idx) => (
                <article key={post.id} style={{
                  display: 'grid',
                  gridTemplateColumns: '300px 1fr',
                  gap: '30px',
                  padding: '30px 0',
                  borderBottom: idx < posts.length - 1 ? '1px solid #eee' : 'none',
                  alignItems: 'start',
                }}>
                  {/* Image */}
                  <Link href={`/blog/${post.slug}`} style={{ display: 'block', position: 'relative', width: '100%', aspectRatio: '4/3', overflow: 'hidden', backgroundColor: '#f5f5f5', borderRadius: '4px', flexShrink: 0 }}>
                    {post.coverImage ? (
                      <Image src={post.coverImage} alt={post.title} fill style={{ objectFit: 'cover', transition: 'transform 0.4s' }} unoptimized className="blog-card-img" />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ccc', fontSize: '40px' }}>
                        ✦
                      </div>
                    )}
                  </Link>

                  {/* Content */}
                  <div>
                    <Link href={`/blog/${post.slug}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                      <h2 style={{ fontSize: '21px', fontWeight: '700', lineHeight: '1.35', margin: '0 0 10px', color: '#111' }}>
                        {post.title}
                      </h2>
                    </Link>

                    <div style={{ fontSize: '13px', color: '#999', marginBottom: '14px' }}>
                      By <span style={{ color: '#666' }}>{post.author}</span>
                      <span style={{ margin: '0 8px' }}>·</span>
                      {post.publishedAt && new Date(post.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>

                    {post.excerpt && (
                      <p style={{ fontSize: '14px', color: '#666', lineHeight: '1.7', margin: '0 0 16px', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {post.excerpt}
                      </p>
                    )}

                    <Link href={`/blog/${post.slug}`} style={{
                      fontSize: '13px', fontWeight: '600', color: '#333', textDecoration: 'none',
                      textTransform: 'uppercase', letterSpacing: '0.08em', borderBottom: '1px solid #333',
                      paddingBottom: '2px', transition: 'color 0.2s',
                    }}>
                      READ MORE
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', gap: '4px', marginTop: '40px', justifyContent: 'center' }}>
              {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                let pageNum;
                if (totalPages <= 7) {
                  pageNum = i + 1;
                } else if (page <= 4) {
                  pageNum = i < 5 ? i + 1 : (i === 5 ? '...' : totalPages);
                } else if (page >= totalPages - 3) {
                  pageNum = i === 0 ? 1 : (i === 1 ? '...' : totalPages - (6 - i));
                } else {
                  pageNum = i === 0 ? 1 : (i === 1 ? '...' : (i <= 4 ? page + i - 3 : (i === 5 ? '...' : totalPages)));
                }
                const isEllipsis = pageNum === '...';
                const isCurrent = pageNum === page;
                const href = `/blog?page=${pageNum}${activeCat ? `&category=${activeCat}` : ''}`;

                return isEllipsis ? (
                  <span key={`e${i}`} style={{ width: '42px', height: '42px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', color: '#999' }}>…</span>
                ) : (
                  <Link key={pageNum} href={href} style={{
                    width: '42px', height: '42px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    border: isCurrent ? '2px solid #111' : '1px solid #ddd', borderRadius: '0',
                    fontSize: '14px', fontWeight: isCurrent ? '700' : '400', textDecoration: 'none',
                    color: isCurrent ? '#111' : '#555', background: '#fff', transition: 'all 0.2s',
                  }}>
                    {pageNum}
                  </Link>
                );
              })}
              {page < totalPages && (
                <Link href={`/blog?page=${page + 1}${activeCat ? `&category=${activeCat}` : ''}`} style={{
                  width: '42px', height: '42px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: '1px solid #ddd', fontSize: '18px', textDecoration: 'none', color: '#555',
                }}>
                  →
                </Link>
              )}
            </div>
          )}
        </div>

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
                  transition: 'color 0.2s', borderBottom: '1px solid #f0f0f0', paddingBottom: '14px',
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
                <Link href="/blog" style={{
                  fontSize: '14px', textDecoration: 'none', transition: 'color 0.2s',
                  color: !activeCat ? '#111' : '#555', fontWeight: !activeCat ? '600' : '400',
                }}>
                  All Posts
                </Link>
                {categories.map(cat => (
                  <Link key={cat.id} href={`/blog?category=${cat.id}`} style={{
                    fontSize: '14px', textDecoration: 'none', transition: 'color 0.2s',
                    color: activeCat === cat.id ? '#111' : '#555',
                    fontWeight: activeCat === cat.id ? '600' : '400',
                  }}>
                    {cat.name}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </aside>
      </div>

      {/* Hover styling */}
      <style dangerouslySetInnerHTML={{ __html: `
        .blog-card-img:hover { transform: scale(1.05) !important; }
        @media (max-width: 768px) {
          [style*="gridTemplateColumns: '1fr 300px'"] { grid-template-columns: 1fr !important; }
          [style*="gridTemplateColumns: '300px 1fr'"] { grid-template-columns: 1fr !important; }
        }
      `}} />
    </main>
  );
}
