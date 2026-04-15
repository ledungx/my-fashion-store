import { notFound } from 'next/navigation';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import ProductImageSlider from '../../../components/ProductImageSlider';
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

export const revalidate = 86400; // 24 Hours Cache TTL
export const dynamicParams = true; // Any product ID outside Top 5000 is built gracefully on-demand properly

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const product = await prisma.product.findUnique({
    where: { slug },
    select: { name: true, description: true, slug: true }
  });

  if (!product) return { title: 'Product Not Found | My Fashion Store' };

  const excerpt = product.description 
      ? (product.description.length > 155 ? product.description.substring(0, 155) + '...' : product.description) 
      : `Purchase ${product.name} seamlessly via My Fashion Store. Premium styles securely delivered through our advanced affiliate network natively.`;

  return {
    title: `${product.name} - My Fashion Store`,
    description: excerpt,
    openGraph: {
      title: product.name,
      description: excerpt,
      url: `https://myfashionstore.com/product/${product.slug}`,
      siteName: 'My Fashion Store',
      images: [
        {
          url: 'https://www.ever-pretty.com/favicon.ico', // Native fallback explicitly bypassing custom CDNs
          width: 1200,
          height: 630,
          alt: product.name,
        },
      ],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: product.name,
      description: excerpt,
    },
  };
}

export async function generateStaticParams() {
  const topProducts = await prisma.product.findMany({
    orderBy: { createdAt: 'asc' }, 
    take: 5000,
    select: { slug: true }
  });
  
  return topProducts.map((product) => ({
    slug: product.slug,
  }));
}

export default async function ProductPage({ params }) {
  const { slug } = await params;
  const product = await prisma.product.findUnique({
    where: { slug },
    include: {
        brand: true,
        category: true,
    }
  });

  if (!product) {
    notFound();
  }
  
  let productImages = await prisma.productImage.findMany({ where: { productId: product.id } });

  // Image associations are now strictly and safely pre-computed via SKU mathematically at the DB ingestion layer 
  // so productImages array natively contains the absolute perfect gallery naturally without UI stripping!

  // Extract video URL from rawData (populated by scrape-videos script)
  const videoUrl = product.rawData?.videoUrl || null;

  const relatedProductsRaw = product.categoryId 
      ? await prisma.product.findMany({
          where: { categoryId: product.categoryId, id: { not: product.id } },
          take: 4,
          orderBy: { createdAt: 'desc' },
          include: { images: { take: 1 } }
        })
      : [];

  const relatedProducts = relatedProductsRaw.map(p => {
      // Use native mapped DB image safely bypassed archaic API limitations
      
      return {
          ...p,
          primaryImage: p.images?.[0]?.url || 'https://www.ever-pretty.com/favicon.ico'
      };
  });

  return (
    <div style={{ backgroundColor: '#fff', minHeight: '100vh', color: '#111', fontFamily: 'Inter, sans-serif' }}>
      <main style={{ maxWidth: '1400px', margin: '0 auto', padding: '60px 20px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.2fr) minmax(0, 1fr)', gap: '80px', alignItems: 'start' }}>
          
          <div style={{ position: 'sticky', top: '40px' }}>
             <ProductImageSlider 
               images={productImages.length > 0 ? productImages : [{ id: product.id, url: 'https://example.com/placeholder.jpg', altText: 'Placeholder' }]} 
               videoUrl={videoUrl}
             />
          </div>

          <div style={{ padding: '20px' }}>
             <div style={{ marginBottom: '20px', display: 'flex', gap: '12px' }}>
                 <span style={{ color: '#F05A5A', fontSize: '0.9rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                     {product.category?.name || "General Collection"}
                 </span>
             </div>

             <h1 style={{ fontSize: '32px', fontWeight: '600', marginBottom: '15px', lineHeight: '1.2', color: '#111' }}>
                 {product.name}
             </h1>
             
             <p style={{ fontSize: '24px', color: '#111', fontWeight: 'bold', marginBottom: '30px' }}>
                 ${Number(product.price).toFixed(2)}
             </p>
             
             <div style={{ borderTop: '1px solid #eaeaea', paddingTop: '30px', marginBottom: '40px' }}>
                 <p style={{ color: '#666', lineHeight: '1.8', fontSize: '14px' }}>
                     {product.description || "Crafted organically capturing minimalist styles seamlessly. A premier addition combining next-gen aesthetics securely alongside structural integrity seamlessly connected via pristine Cloudinary image distributions natively."}
                 </p>
             </div>
             
             <a 
                 href={product.rawData?.originUrl ? (product.rawData.originUrl.includes('?') ? `${product.rawData.originUrl}&ref=gumac` : `${product.rawData.originUrl}?ref=gumac`) : '#'}
                 target="_blank"
                 rel="noopener noreferrer"
                 style={{ textDecoration: 'none', display: 'block', width: '100%' }}
             >
                 <button style={{ 
                     width: '100%', 
                     padding: '16px', 
                     background: '#111', 
                     color: '#fff', 
                     fontWeight: 'bold', 
                     fontSize: '15px', 
                     border: 'none', 
                     cursor: 'pointer',
                     transition: 'background 0.2s'
                 }} 
                     className="add-to-cart-btn"
                 >
                     ADD TO CART
                 </button>
             </a>
             
             <style dangerouslySetInnerHTML={{__html: `
                .add-to-cart-btn:hover { background: #F05A5A !important; }
             `}} />
          </div>
        </div>

        {/* Related Products Elessi Grid */}
        {relatedProducts.length > 0 && (
             <div style={{ marginTop: '100px', borderTop: '1px solid #eaeaea', paddingTop: '60px' }}>
                <h3 style={{ fontSize: '24px', fontWeight: 'bold', textAlign: 'center', marginBottom: '40px', color: '#111' }}>RELATED PRODUCTS</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '30px' }}>
                     {relatedProducts.map(item => (
                         <Link key={item.id} href={`/product/${item.slug}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                             <div style={{ cursor: 'pointer', position: 'relative' }} className="product-item-wrap">
                                 <div style={{ position: 'relative', width: '100%', aspectRatio: '3/4', backgroundColor: '#f7f7f7', overflow: 'hidden', marginBottom: '15px' }}>
                                     {item.price < 30 && (
                                         <div style={{ position: 'absolute', top: '15px', left: '15px', backgroundColor: '#F05A5A', color: '#fff', padding: '2px 8px', borderRadius: '12px', fontSize: '10px', fontWeight: 'bold', zIndex: 10 }}>HOT</div>
                                     )}
                                     
                                     <Image 
                                        src={item.primaryImage} 
                                        alt={item.name} 
                                        fill 
                                        style={{ objectFit: 'cover' }} 
                                        unoptimized
                                     />
                                     
                                     {/* Hover Actions Native */}
                                     <div style={{ position: 'absolute', top: '15px', right: '15px', display: 'flex', flexDirection: 'column', gap: '10px', opacity: 0, transition: 'all 0.3s ease', transform: 'translateX(10px)' }} className="product-actions-side">
                                         <div style={{ backgroundColor: '#fff', width: '38px', height: '38px', borderRadius: '50%', cursor: 'pointer', boxShadow: '0 2px 10px rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#111' }}>♡</div>
                                     </div>
                                 </div>
                                 
                                 <h4 style={{ margin: 0, fontSize: '14px', fontWeight: '500', color: '#222', marginBottom: '8px', lineHeight: '1.4', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                     {item.name}
                                 </h4>
                                 <p style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: '#222' }}>
                                     ${Number(item.price).toFixed(2)}
                                 </p>
                             </div>
                         </Link>
                     ))}
                </div>
                {/* CSS purely for related items hover */}
                <style dangerouslySetInnerHTML={{__html: `
                   .product-actions-side { opacity: 0; }
                   .product-item-wrap:hover .product-actions-side { opacity: 1 !important; transform: translateX(0) !important; }
                `}} />
             </div>
        )}
      </main>
    </div>
  );
}
