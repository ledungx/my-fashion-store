import Link from 'next/link';
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

export default async function Footer() {
  const menus = await prisma.menuItem.findMany({
      where: { position: 'FOOTER' },
      orderBy: { order: 'asc' }
  });

  return (
    <footer style={{ backgroundColor: '#111', color: '#fff', padding: '80px 40px 40px', marginTop: '100px', fontFamily: 'Inter, sans-serif' }}>
       <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
           <div style={{ fontSize: '32px', fontWeight: '800', letterSpacing: '-1px', marginBottom: '30px' }}>Elessi.</div>
           
           <nav style={{ display: 'flex', display: 'flex', gap: '30px', marginBottom: '40px', flexWrap: 'wrap', justifyContent: 'center' }}>
              {menus.map(menu => (
                  <Link 
                      key={menu.id} 
                      href={menu.url} 
                      style={{ color: '#ccc', textDecoration: 'none', fontSize: '14px', fontWeight: '500', transition: 'color 0.2s' }}
                  >
                      {menu.label}
                  </Link>
              ))}
              {menus.length === 0 && <span style={{ color: '#555' }}>No footer menus mapped. Use Admin Dashboard.</span>}
           </nav>

           <div style={{ borderTop: '1px solid #333', width: '100%', paddingTop: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', color: '#666' }}>
               <p>© {new Date().getFullYear()} Elessi Platform. Built with securely integrated headless architecture.</p>
               <Link href="/admin/login" style={{ color: '#F05A5A', textDecoration: 'none', fontWeight: 'bold' }}>Admin Portal</Link>
           </div>
       </div>
    </footer>
  );
}
