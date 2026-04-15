import Link from 'next/link';
import { ShoppingBag, Heart, Search, User, ChevronDown } from 'lucide-react';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import HeaderSearch from './HeaderSearch';

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

export default async function Header() {
  const menus = await prisma.menuItem.findMany({
      where: { position: 'HEADER', parentId: null },
      orderBy: { order: 'asc' },
      include: { 
          children: { 
              orderBy: { order: 'asc' },
              include: { children: { orderBy: { order: 'asc' } } } // Allow Level 3 linking
          } 
      }
  });

  return (
    <>
    <style>{`
        .has-mega {
            position: static !important;
        }
        .nav-item {
            position: relative;
            display: flex;
            align-items: center;
            height: 100%;
        }
        .mega-menu-wrapper {
            position: absolute;
            top: 100%;
            left: 0;
            transform: none;
            width: 100%;
            background: #fff;
            box-shadow: 0 15px 40px rgba(0,0,0,0.08);
            border: 1px solid #eaeaea;
            border-top: 2px solid #111;
            padding: 40px 80px;
            display: flex;
            justify-content: center;
            gap: 40px;
            opacity: 0;
            visibility: hidden;
            transition: opacity 0.3s ease, visibility 0.3s ease, transform 0.3s ease;
            z-index: 200;
            cursor: default;
        }
        .simple-dropdown {
            position: absolute;
            top: 100%;
            left: 0;
            width: 220px;
            background: #fff;
            box-shadow: 0 10px 30px rgba(0,0,0,0.08);
            border: 1px solid #eaeaea;
            border-top: 2px solid #111;
            opacity: 0;
            visibility: hidden;
            transition: opacity 0.3s ease, visibility 0.3s ease, transform 0.3s ease;
            z-index: 200;
        }
        .nav-item:hover .mega-menu-wrapper,
        .nav-item:hover .simple-dropdown {
            opacity: 1;
            visibility: visible;
        }
        .nav-link {
            text-decoration: none;
            color: inherit;
            display: flex;
            align-items: center;
            gap: 6px;
            padding: 30px 0; 
            transition: color 0.2s;
        }
        .nav-link:hover {
            color: #F05A5A;
        }
        .mega-menu-link:hover {
            color: #F05A5A !important;
        }
        .dropdown-link:hover {
            background-color: #f9f9f9 !important;
            color: #F05A5A !important;
        }
        .mega-img-wrap:hover .mega-img {
            transform: scale(1.06);
        }
    `}</style>
    <header style={{ position: 'sticky', top: 0, zIndex: 100, backgroundColor: '#fff', borderBottom: '1px solid #eaeaea', padding: '0 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
       {/* Logo */}
       <div style={{ fontSize: '28px', fontWeight: '800', letterSpacing: '-1px', color: '#111' }}>
          <Link href="/" style={{ textDecoration: 'none', color: 'inherit' }}>Elessi.</Link>
       </div>

       {/* Dynamic Web Database Navigation */}
       <nav style={{ display: 'flex', gap: '32px', fontSize: '13px', fontWeight: '700', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#333', height: '88px' }}>
          {menus.length === 0 ? (
              <span style={{ color: '#888', fontStyle: 'italic', textTransform: 'lowercase', padding: '30px 0' }}>No menu configured.</span>
          ) : (
              menus.map(menu => {
                  const isMegaMenu = menu.isMegaMenu;
                  const hasChildren = menu.children && menu.children.length > 0;
                  const safeUrl = (url) => (!url || url.startsWith('/') || url.startsWith('http')) ? (url || '/') : `/${url}`;

                  return (
                  <div key={menu.id} className={`nav-item ${isMegaMenu ? 'has-mega' : ''}`}>
                      <Link href={safeUrl(menu.url)} className="nav-link" style={{ color: menu.url === '/' ? '#F05A5A' : 'inherit' }}>
                          {menu.label}
                          {(isMegaMenu || hasChildren) && <ChevronDown size={14} style={{ marginTop: '2px' }} />}
                      </Link>
                      
                      {/* Mega Menu Overlay */}
                      {isMegaMenu && (
                          <div className="mega-menu-wrapper">
                              {/* Text link columns — grid if columns set, flex auto otherwise */}
                              {(() => {
                                  const textCols = menu.children.filter(col => col.itemType !== 'IMAGE');
                                  const colCount = menu.columns > 0 ? menu.columns : textCols.length;
                                  return (
                                      <div style={{
                                          display: 'grid',
                                          gridTemplateColumns: `repeat(${colCount}, 1fr)`,
                                          gap: '40px',
                                          flex: 1
                                      }}>
                                          {textCols.map(col => (
                                              <div key={col.id}>
                                                  <Link href={safeUrl(col.url)} style={{ display: 'block', fontSize: '13px', fontWeight: '800', color: '#111', marginBottom: '20px', textDecoration: 'none', textTransform: 'uppercase', borderBottom: '1px solid #eaeaea', paddingBottom: '10px' }}>
                                                      {col.label}
                                                  </Link>
                                                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                                      {col.children.map(item => (
                                                          <li key={item.id}>
                                                              <Link href={safeUrl(item.url)} className="mega-menu-link" style={{ textDecoration: 'none', color: '#666', fontSize: '13px', fontWeight: '500', display: 'block', transition: 'color 0.2s' }}>
                                                                  {item.label}
                                                              </Link>
                                                          </li>
                                                      ))}
                                                      {col.children.length > 0 && (
                                                          <li style={{ marginTop: '6px' }}>
                                                              <Link href={safeUrl(col.url)} className="mega-menu-link" style={{ textDecoration: 'none', color: '#111', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', borderBottom: '1px solid #111', paddingBottom: '2px' }}>
                                                                  View All →
                                                              </Link>
                                                          </li>
                                                      )}
                                                  </ul>
                                              </div>
                                          ))}
                                      </div>
                                  );
                              })()}

                              {/* Image cards panel — right side */}
                              {menu.children.some(col => col.itemType === 'IMAGE') && (
                                  <div style={{ display: 'flex', gap: '12px', flexShrink: 0 }}>
                                      {menu.children.filter(col => col.itemType === 'IMAGE').map(imgItem => (
                                          <Link
                                              key={imgItem.id}
                                              href={safeUrl(imgItem.url)}
                                              style={{ display: 'block', width: '160px', flexShrink: 0, textDecoration: 'none', overflow: 'hidden', borderRadius: '4px' }}
                                              title={imgItem.label}
                                          >
                                              <div style={{ overflow: 'hidden', borderRadius: '4px' }} className="mega-img-wrap">
                                                  <img
                                                      src={imgItem.imageUrl}
                                                      alt={imgItem.label}
                                                      style={{ width: '160px', height: '210px', objectFit: 'cover', display: 'block', transition: 'transform 0.4s ease' }}
                                                      className="mega-img"
                                                  />
                                              </div>
                                              {imgItem.label && (
                                                  <div style={{ fontSize: '11px', fontWeight: '700', color: '#111', marginTop: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                                      {imgItem.label}
                                                  </div>
                                              )}
                                          </Link>
                                      ))}
                                  </div>
                              )}
                          </div>
                      )}

                      {/* Standard Native Submenus via Admin Recursion */}
                      {!isMegaMenu && hasChildren && (
                          <div className="simple-dropdown">
                              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                                  {menu.children.map(child => (
                                      <li key={child.id} style={{ borderBottom: '1px solid #eaeaea' }}>
                                          <Link href={safeUrl(child.url)} className="dropdown-link" style={{ display: 'block', padding: '15px 20px', fontSize: '13px', textDecoration: 'none', color: '#555', transition: 'all 0.2s', backgroundColor: '#fff', fontWeight: '600' }}>
                                              {child.label}
                                          </Link>
                                      </li>
                                  ))}
                              </ul>
                          </div>
                      )}
                  </div>
              )})
          )}
       </nav>

       {/* Utilities */}
       <div style={{ display: 'flex', gap: '24px', color: '#111', alignItems: 'center' }}>
          <HeaderSearch />
          <User size={22} strokeWidth={1.5} style={{ cursor: 'pointer' }} />
          <Heart size={22} strokeWidth={1.5} style={{ cursor: 'pointer' }} />
          <div style={{ position: 'relative', cursor: 'pointer' }}>
             <ShoppingBag size={22} strokeWidth={1.5} />
             <span style={{ position: 'absolute', top: '-6px', right: '-8px', backgroundColor: '#F05A5A', color: '#fff', fontSize: '10px', fontWeight: 'bold', width: '16px', height: '16px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                0
             </span>
          </div>
       </div>
    </header>
    </>
  );
}
