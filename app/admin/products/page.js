import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { revalidatePath } from 'next/cache';
import Link from 'next/link';
import Typesense from 'typesense';

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
let tsClient = new Typesense.Client({
  nodes: [{ host: 'localhost', port: '8108', protocol: 'http' }],
  apiKey: process.env.TYPESENSE_API_KEY || 'development_api_key_123',
  connectionTimeoutSeconds: 5,
});

export const revalidate = 0;

export default async function AdminProductsPage({ searchParams }) {
    const params = await searchParams;
    const page = parseInt(params?.page || '1');
    const searchQuery = params?.q || '';
    const limit = 20;
    const skip = (page - 1) * limit;

    // Build Prisma where clause for search
    const whereClause = searchQuery ? {
        OR: [
            { name: { contains: searchQuery, mode: 'insensitive' } },
            { description: { contains: searchQuery, mode: 'insensitive' } },
            { slug: { contains: searchQuery, mode: 'insensitive' } },
        ]
    } : {};

    const [products, totalCount, categories] = await Promise.all([
        prisma.product.findMany({
            where: whereClause,
            take: limit,
            skip: skip,
            orderBy: { createdAt: 'desc' },
            include: { category: true, brand: true }
        }),
        prisma.product.count({ where: whereClause }),
        prisma.category.findMany({ orderBy: { name: 'asc' } })
    ]);
    
    const totalPages = Math.ceil(totalCount / limit);

    // Build query string helper for pagination links
    const buildUrl = (p) => {
        const qs = new URLSearchParams();
        qs.set('page', String(p));
        if (searchQuery) qs.set('q', searchQuery);
        return `/admin/products?${qs.toString()}`;
    };

    async function deleteProduct(productId) {
        'use server';
        if (productId) {
            await prisma.product.delete({ where: { id: productId } });
            try { await tsClient.collections('products').documents(productId).delete(); } catch(e){}
        }
        revalidatePath('/admin/products');
    }

    async function bulkAssignCategory(formData) {
        'use server';
        const targetCategoryId = formData.get('targetCategoryId');
        const productIds = formData.getAll('productIds');
        
        if (targetCategoryId && productIds.length > 0) {
            await prisma.product.updateMany({
                where: { id: { in: productIds } },
                data: { categoryId: targetCategoryId }
            });
            
            for (const id of productIds) {
                try { await tsClient.collections('products').documents(id).update({ categoryId: targetCategoryId }); } catch(e){}
            }
        }
        revalidatePath('/admin/products');
    }

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                <h1 style={{ fontSize: '32px', fontWeight: '800', color: '#111' }}>Product Directory</h1>
                <p style={{ color: '#666', fontWeight: 'bold' }}>{searchQuery ? `${totalCount} results` : `Total: ${totalCount} items`}</p>
            </div>

            {/* Search Bar */}
            <form action="/admin/products" method="GET" style={{ marginBottom: '30px' }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <div style={{ position: 'relative', flex: 1, maxWidth: '500px' }}>
                        <input 
                            type="text" 
                            name="q" 
                            defaultValue={searchQuery}
                            placeholder="Search products by name, description, slug..."
                            style={{ 
                                width: '100%', 
                                padding: '12px 45px 12px 18px', 
                                border: '2px solid #eaeaea', 
                                borderRadius: '10px', 
                                fontSize: '14px', 
                                outline: 'none',
                                fontFamily: 'Inter, sans-serif',
                                color: '#333',
                                backgroundColor: '#fff',
                                transition: 'border-color 0.2s'
                            }}
                        />
                        <div style={{ position: 'absolute', right: '15px', top: '50%', transform: 'translateY(-50%)', color: '#888', pointerEvents: 'none' }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
                        </div>
                    </div>
                    <button type="submit" style={{ padding: '12px 24px', backgroundColor: '#111', color: '#fff', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px', whiteSpace: 'nowrap' }}>
                        Search
                    </button>
                    {searchQuery && (
                        <Link href="/admin/products" style={{ padding: '12px 20px', backgroundColor: '#fff', border: '1px solid #ddd', borderRadius: '10px', textDecoration: 'none', color: '#666', fontWeight: 'bold', fontSize: '13px', whiteSpace: 'nowrap' }}>
                            Clear
                        </Link>
                    )}
                </div>
                {searchQuery && (
                    <p style={{ marginTop: '10px', fontSize: '13px', color: '#888' }}>
                        Showing results for: <strong style={{ color: '#111' }}>{searchQuery}</strong>
                    </p>
                )}
            </form>
            
            <form action={bulkAssignCategory}>
            <div style={{ backgroundColor: '#fff', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.03)', overflow: 'hidden' }}>
                {/* Bulk Actions Header Native Overlay */}
                <div style={{ padding: '20px', backgroundColor: '#fdfdfd', borderBottom: '1px solid #eaeaea', display: 'flex', gap: '15px', alignItems: 'center' }}>
                    <span style={{ fontSize: '13px', fontWeight: 'bold' }}>Bulk Actions:</span>
                    <select name="targetCategoryId" style={{ padding: '8px 15px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '13px' }}>
                        <option value="">-- Assign Category --</option>
                        {categories.map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                    </select>
                    <button type="submit" style={{ padding: '8px 20px', backgroundColor: '#111', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}>Map Selected</button>
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
                    <thead>
                        <tr style={{ backgroundColor: '#f9f9f9', borderBottom: '1px solid #eaeaea', color: '#888', textTransform: 'uppercase', fontSize: '12px', letterSpacing: '0.05em' }}>
                            <th style={{ padding: '20px', width: '40px' }}></th>
                            <th style={{ padding: '20px' }}>Product Details</th>
                            <th style={{ padding: '20px' }}>Category</th>
                            <th style={{ padding: '20px' }}>Price</th>
                            <th style={{ padding: '20px', textAlign: 'right' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {products.map(product => (
                            <tr key={product.id} style={{ borderBottom: '1px solid #eaeaea' }}>
                                <td style={{ padding: '20px', textAlign: 'center' }}>
                                    <input type="checkbox" name="productIds" value={product.id} style={{ transform: 'scale(1.2)' }} />
                                </td>
                                <td style={{ padding: '20px' }}>
                                    <div style={{ fontWeight: 'bold', color: '#111', marginBottom: '5px' }}>
                                        {product.rawData?.originUrl ? (
                                            <a href={product.rawData.originUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#111', textDecoration: 'underline' }}>
                                                {product.name}
                                            </a>
                                        ) : product.name}
                                    </div>
                                    <div style={{ color: '#888', fontSize: '12px' }}>Slug: {product.slug}</div>
                                </td>
                                <td style={{ padding: '20px', color: '#555' }}>
                                    {product.category?.name || <span style={{ color: '#ccc', fontStyle: 'italic' }}>Unassigned</span>}
                                </td>
                                <td style={{ padding: '20px', fontWeight: 'bold', color: '#F05A5A' }}>
                                    ${Number(product.price).toFixed(2)}
                                </td>
                                <td style={{ padding: '20px', textAlign: 'right' }}>
                                    <button formAction={deleteProduct.bind(null, product.id)} style={{ backgroundColor: '#fff', border: '1px solid #ff4d4f', color: '#ff4d4f', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold', transition: 'all 0.2s' }}>
                                        DELETE
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {products.length === 0 && (
                            <tr>
                                <td colSpan="5" style={{ padding: '40px', textAlign: 'center', color: '#888' }}>
                                    {searchQuery ? `No products found matching "${searchQuery}".` : 'No products found in the database. Run the sync command.'}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
            </form>

            {/* Pagination with search query preserved */}
            {totalPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginTop: '40px' }}>
                    {page > 1 && (
                        <Link href={buildUrl(page - 1)} style={{ padding: '10px 20px', backgroundColor: '#fff', border: '1px solid #eaeaea', borderRadius: '6px', textDecoration: 'none', color: '#111', fontWeight: 'bold' }}>
                            Previous
                        </Link>
                    )}
                    <span style={{ padding: '10px 20px', backgroundColor: '#111', color: '#fff', borderRadius: '6px', fontWeight: 'bold' }}>
                        Page {page} of {totalPages}
                    </span>
                    {page < totalPages && (
                        <Link href={buildUrl(page + 1)} style={{ padding: '10px 20px', backgroundColor: '#fff', border: '1px solid #eaeaea', borderRadius: '6px', textDecoration: 'none', color: '#111', fontWeight: 'bold' }}>
                            Next
                        </Link>
                    )}
                </div>
            )}
        </div>
    );
}
