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

export const revalidate = 0; // Prevent caching the dashboard natively

export default async function AdminDashboard() {
    const totalProducts = await prisma.product.count();
    const totalCategories = await prisma.category.count();
    const totalBrands = await prisma.brand.count();
    const totalPosts = await prisma.blogPost.count();

    return (
        <div>
            <h1 style={{ fontSize: '32px', fontWeight: '800', marginBottom: '40px', color: '#111' }}>Dashboard Overview</h1>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '30px', marginBottom: '50px' }}>
                <div style={{ backgroundColor: '#fff', padding: '30px', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }}>
                    <p style={{ color: '#888', fontSize: '13px', textTransform: 'uppercase', fontWeight: 'bold', marginBottom: '10px' }}>Total Products</p>
                    <h3 style={{ fontSize: '36px', fontWeight: '800', color: '#111', margin: 0 }}>{totalProducts}</h3>
                </div>
                <div style={{ backgroundColor: '#fff', padding: '30px', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }}>
                    <p style={{ color: '#888', fontSize: '13px', textTransform: 'uppercase', fontWeight: 'bold', marginBottom: '10px' }}>Active Categories</p>
                    <h3 style={{ fontSize: '36px', fontWeight: '800', color: '#111', margin: 0 }}>{totalCategories}</h3>
                </div>
                <div style={{ backgroundColor: '#fff', padding: '30px', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }}>
                    <p style={{ color: '#888', fontSize: '13px', textTransform: 'uppercase', fontWeight: 'bold', marginBottom: '10px' }}>Partner Brands</p>
                    <h3 style={{ fontSize: '36px', fontWeight: '800', color: '#111', margin: 0 }}>{totalBrands}</h3>
                </div>
                <div style={{ backgroundColor: '#fff', padding: '30px', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }}>
                    <p style={{ color: '#888', fontSize: '13px', textTransform: 'uppercase', fontWeight: 'bold', marginBottom: '10px' }}>Blog Posts</p>
                    <h3 style={{ fontSize: '36px', fontWeight: '800', color: '#111', margin: 0 }}>{totalPosts}</h3>
                </div>
            </div>
            
            <div style={{ backgroundColor: '#fff', padding: '30px', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }}>
                <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '20px' }}>Quick Actions</h3>
                <p style={{ color: '#666', lineHeight: '1.6' }}>Use the navigation sidebar to manage your store. The "Product Directory" allows you to view and delete items cleanly. The "Header & Footers" tab enables complete structural control over your site's navigation mapping seamlessly into PostgreSQL.</p>
            </div>
        </div>
    );
}
