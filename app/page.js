import HeroBanner from '../components/HeroBanner';
import SalesPopup from '../components/SalesPopup';
import Link from 'next/link';
import Image from 'next/image';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

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

export const revalidate = 60; // 1 minute homepage TTL

async function getTrendyItems() {
    // Fetch top 8 items natively mapping Elessi grids
    const products = await prisma.product.findMany({
        take: 8,
        orderBy: { createdAt: 'desc' },
        include: { images: { take: 15 } }
    });
    
    // Inject dynamic rawData fallback to absolutely guarantee thumbnails render natively
    return products.map(p => {
        let jpgImage = p.images?.find(img => img.url.toLowerCase().includes('.jpg'));
        let fallbackUrl = jpgImage ? jpgImage.url : p.images?.[0]?.url;
        
        if (!fallbackUrl && p.rawData && p.rawData.images && p.rawData.images.length > 0) {
            const rawJpg = p.rawData.images.find(img => img.src.toLowerCase().includes('.jpg'));
            fallbackUrl = rawJpg ? rawJpg.src : p.rawData.images[0].src;
        }
        return {
            ...p,
            primaryImage: fallbackUrl || 'https://www.ever-pretty.com/favicon.ico'
        };
    });
}

export default async function HomePage() {
   const trendyItems = await getTrendyItems();

   return (
       <main style={{ backgroundColor: '#fff', color: '#111', minHeight: '100vh', fontFamily: 'Inter, sans-serif' }}>
          <HeroBanner />

          {/* Trendy Item Section */}
          <section style={{ maxWidth: '1200px', margin: '0 auto', padding: '100px 20px' }}>
              <div style={{ textAlign: 'center', marginBottom: '50px' }}>
                  <h3 style={{ fontSize: '24px', fontWeight: '800', margin: 0, textTransform: 'capitalize', color: '#222' }}>Trendy item</h3>
                  <div style={{ width: '40px', height: '2px', backgroundColor: '#F05A5A', margin: '15px auto' }}></div>
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '30px', marginTop: '25px', fontSize: '13px', fontWeight: '600', color: '#888' }}>
                      <span style={{ color: '#111', borderBottom: '2px solid #111', paddingBottom: '5px', cursor: 'pointer' }}>ALL</span>
                      <span style={{ cursor: 'pointer', paddingBottom: '5px' }}>FEATURED</span>
                      <span style={{ cursor: 'pointer', paddingBottom: '5px' }}>BEST SELLING</span>
                      <span style={{ cursor: 'pointer', paddingBottom: '5px' }}>NEW ARRIVALS</span>
                  </div>
              </div>

              {/* Grid Wrapper */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '30px' }}>
                 {trendyItems.map(item => (
                     <Link key={item.id} href={`/product/${item.slug}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                         <div style={{ textAlign: 'center', cursor: 'pointer', position: 'relative' }} className="product-item-wrap">
                             <div style={{ position: 'relative', width: '100%', aspectRatio: '3/4', backgroundColor: '#f5f5f5', overflow: 'hidden', marginBottom: '15px' }}>
                                 {/* Elessi Hover Reveal Image Logic */}
                                 <Image 
                                    src={item.primaryImage} 
                                    alt={item.name} 
                                    fill 
                                    style={{ objectFit: 'cover' }} 
                                    unoptimized
                                 />
                                 
                                 {/* Mock Elessi Action Group */}
                                 <div style={{ position: 'absolute', bottom: '15px', left: '0', right: '0', display: 'flex', justifyContent: 'center', gap: '10px', opacity: 0, transition: 'all 0.3s ease', transform: 'translateY(10px)' }} className="product-actions">
                                     <button style={{ backgroundColor: '#fff', border: 'none', width: '38px', height: '38px', borderRadius: '50%', cursor: 'pointer', boxShadow: '0 2px 10px rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>♡</button>
                                     <button style={{ backgroundColor: '#fff', border: 'none', width: '38px', height: '38px', borderRadius: '50%', cursor: 'pointer', boxShadow: '0 2px 10px rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>⚖</button>
                                     <button style={{ backgroundColor: '#fff', border: 'none', width: '38px', height: '38px', borderRadius: '50%', cursor: 'pointer', boxShadow: '0 2px 10px rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>👁</button>
                                 </div>
                             </div>

                             <h4 style={{ margin: 0, fontSize: '13px', fontWeight: '500', color: '#222', marginBottom: '8px', lineHeight: '1.4', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                 {item.name}
                             </h4>
                             <p style={{ margin: 0, fontSize: '14px', fontWeight: '700', color: '#F05A5A' }}>
                                 ${Number(item.price).toFixed(2)}
                             </p>
                         </div>
                     </Link>
                 ))}
              </div>
          </section>

          <SalesPopup />
          
          <style dangerouslySetInnerHTML={{__html: `
             .product-item-wrap:hover .product-actions { 
                 opacity: 1 !important; 
                 transform: translateY(0) !important;
             }
          `}} />
       </main>
   );
}
