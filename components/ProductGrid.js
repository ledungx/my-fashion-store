'use client';
import React, { useState, useEffect } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import PageBanner from './PageBanner';

export default function ProductGrid({ initialCategoryId = '', initialCategoryName = '', initialQuery = '', showSearchInput = true }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState([]);
  const [facets, setFacets] = useState([]);
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedSort, setSelectedSort] = useState('');
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(() => parseInt(searchParams?.get('page') || '1', 10));
  const [totalPages, setTotalPages] = useState(1);

  const handlePageChange = (newPage) => {
      setPage(newPage);
      const params = new URLSearchParams(searchParams.toString());
      if (newPage > 1) {
          params.set('page', newPage.toString());
      } else {
          params.delete('page');
      }
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
      window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  const performSearch = async () => {
    setLoading(true);
    let url = `/api/search?q=${encodeURIComponent(query)}&page=${page}`;
    if (initialCategoryId) url += `&category=${encodeURIComponent(initialCategoryId)}`;
    if (selectedColor) url += `&color=${encodeURIComponent(selectedColor)}`;
    if (selectedSize) url += `&size=${encodeURIComponent(selectedSize)}`;
    if (selectedSort) url += `&sort_by=${encodeURIComponent(selectedSort)}`;

    try {
        const res = await fetch(url);
        const data = await res.json();
        setResults(data.hits || []);
        setFacets(data.facet_counts || []);
        setTotalPages(Math.ceil((data.found || 0) / 24) || 1);
    } catch (e) {
        console.error("Search error", e);
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => {
     setQuery(initialQuery);
  }, [initialQuery]);

  useEffect(() => {
     setPage(1);
  }, [query, selectedColor, selectedSize, selectedSort, initialCategoryId]);

  useEffect(() => {
    const timer = setTimeout(() => {
        performSearch();
    }, 250);
    return () => clearTimeout(timer);
  }, [query, selectedColor, selectedSize, selectedSort, page, initialCategoryId]);

  const getFacet = (fieldName) => {
    return facets.find(f => f.field_name === fieldName)?.counts || [];
  };

  const bannerTitle = query ? `Search: ${query}` : (initialCategoryName || "Shop Collection");

  return (
    <main style={{ backgroundColor: '#fff', color: '#111', minHeight: '100vh', fontFamily: 'Inter, sans-serif' }}>
      <PageBanner title={bannerTitle} breadcrumbs={[{label: "Home", href: "/"}, {label: initialCategoryName || "Fashions", href: ""}]} />
      
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 20px 60px' }}>
          
          {/* Horizontal Elessi Filter Bar */}
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', padding: '20px 0', borderTop: '1px solid #eaeaea', borderBottom: '1px solid #eaeaea', marginBottom: '40px' }}>
             
             <div style={{ display: 'flex', alignItems: 'center', gap: '25px', fontSize: '14px', fontWeight: '500' }}>
                 <div className="filter-item-elessi">
                     <span style={{ color: '#888', marginRight: '10px' }}>Filter by:</span>
                 </div>

                 {/* Search Input - inline in filter bar */}
                 {showSearchInput && (
                 <div style={{ position: 'relative' }}>
                     <input 
                        type="text" 
                        placeholder="Search..." 
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        style={{ 
                            width: '200px', 
                            padding: '7px 32px 7px 12px', 
                            border: '1px solid #ddd', 
                            borderRadius: '6px', 
                            fontSize: '13px', 
                            outline: 'none',
                            transition: 'border-color 0.2s, width 0.3s',
                            fontFamily: 'Inter, sans-serif',
                            color: '#333'
                        }}
                        onFocus={(e) => { e.target.style.borderColor = '#F05A5A'; e.target.style.width = '260px'; }}
                        onBlur={(e) => { e.target.style.borderColor = '#ddd'; if (!query) e.target.style.width = '200px'; }}
                     />
                     {query ? (
                         <button onClick={() => setQuery('')} style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#F05A5A', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold', padding: '2px' }}>✕</button>
                     ) : (
                         <div style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: '#bbb', pointerEvents: 'none' }}>
                             <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
                         </div>
                     )}
                 </div>
                 )}

                 <div className="filter-item-elessi">
                    <span style={{ color: selectedColor ? '#F05A5A' : '#111', cursor: 'pointer' }}>Color ▾</span>
                    <div className="dropdown-menu-mock">
                       <select value={selectedColor} onChange={(e) => setSelectedColor(e.target.value)} style={{ border: 'none', background: 'transparent', outline: 'none', cursor: 'pointer', fontSize: '13px', color: '#666' }}>
                         <option value="">All Colors</option>
                         {getFacet('color').map(c => <option key={c.value} value={c.value}>{c.value} ({c.count})</option>)}
                       </select>
                    </div>
                 </div>

                 <div className="filter-item-elessi">
                    <span style={{ color: selectedSize ? '#F05A5A' : '#111', cursor: 'pointer' }}>Size ▾</span>
                    <div className="dropdown-menu-mock">
                       <select value={selectedSize} onChange={(e) => setSelectedSize(e.target.value)} style={{ border: 'none', background: 'transparent', outline: 'none', cursor: 'pointer', fontSize: '13px', color: '#666' }}>
                         <option value="">All Sizes</option>
                         {getFacet('size').map(s => <option key={s.value} value={s.value}>{s.value} ({s.count})</option>)}
                       </select>
                    </div>
                 </div>
             </div>

             {/* Sort By Right */}
             <div style={{ fontSize: '14px', fontWeight: '500' }}>
                 <span style={{ color: '#888', marginRight: '5px' }}>Sort by</span>
                 <select value={selectedSort} onChange={(e) => setSelectedSort(e.target.value)} style={{ border: 'none', background: 'transparent', outline: 'none', cursor: 'pointer', color: '#111', fontWeight: 'bold' }}>
                     <option value="">Latest</option>
                     <option value="price:asc">Price: Low to High</option>
                     <option value="price:desc">Price: High to Low</option>
                 </select>
             </div>
          </div>

          {/* Grid Content */}
          {loading ? (
                <div style={{ textAlign: 'center', padding: '100px', color: '#888' }}>Fetching collection...</div>
          ) : results.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '100px', color: '#888' }}>No fashion items matched your filters.</div>
          ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '30px' }}>
                     {results.map(hit => (
                         <ProductCard key={hit.document.id} hit={hit} />
                     ))}
                </div>
          )}
      </div>
      
      {/* Pagination Footer Container */}
      {!loading && totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', paddingBottom: '80px' }}>
              <button 
                  onClick={() => handlePageChange(Math.max(1, page - 1))}
                  disabled={page === 1}
                  style={{ padding: '10px 20px', background: 'none', border: 'none', color: page === 1 ? '#ccc' : '#111', cursor: page === 1 ? 'not-allowed' : 'pointer', fontWeight: 'bold', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.1em' }}
              >
                  Prev
              </button>
              
              <div style={{ display: 'flex', gap: '8px' }}>
                  {(() => {
                      const pages = [];
                      for (let p = 1; p <= totalPages; p++) {
                          if (p === 1 || p === totalPages || (p >= page - 1 && p <= page + 1)) {
                             pages.push(
                                 <button 
                                     key={p}
                                     onClick={(e) => { e.preventDefault(); handlePageChange(p); }}
                                     style={{ width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', background: page === p ? '#F05A5A' : 'transparent', color: page === p ? '#fff' : '#666', fontWeight: page === p ? 'bold' : 'normal', borderRadius: '50%', cursor: 'pointer', transition: 'all 0.2s', fontSize: '14px' }}
                                 >
                                     {p}
                                 </button>
                             );
                          } else if (p === page - 2 || p === page + 2) {
                             pages.push(<span key={`dots-${p}`} style={{ color: '#ccc', alignSelf: 'flex-end', paddingBottom: '10px' }}>...</span>);
                          } else if (p > page + 2 && p < totalPages) {
                             p = totalPages - 1;
                          } else if (p < page - 2 && p > 1) {
                             p = page - 3;
                          }
                      }
                      return pages;
                  })()}
              </div>

              <button 
                  onClick={() => handlePageChange(Math.min(totalPages, page + 1))}
                  disabled={page === totalPages}
                  style={{ padding: '10px 20px', background: 'none', border: 'none', color: page === totalPages ? '#ccc' : '#111', cursor: page === totalPages ? 'not-allowed' : 'pointer', fontWeight: 'bold', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.1em' }}
              >
                  Next
              </button>
          </div>
      )}

      {/* Inject Elessi Custom Classes for inline UX hover logic natively */}
      <style dangerouslySetInnerHTML={{__html: `
         .filter-item-elessi { position: relative; }
         .filter-item-elessi:hover .dropdown-menu-mock { display: block !important; }
         .dropdown-menu-mock { display: none; position: absolute; top: calc(100% + 5px); left: -10px; background: #fff; padding: 15px; box-shadow: 0 5px 20px rgba(0,0,0,0.08); z-index: 50; border-top: 2px solid #F05A5A; border-radius: 2px; }
         
         .product-actions-side, .product-actions-bottom { opacity: 0; }
         .product-item-wrap:hover .product-actions-side { opacity: 1 !important; transform: translateX(0) !important; }
         .product-item-wrap:hover .product-actions-bottom { opacity: 1 !important; transform: translateY(0) !important; }
         
         .product-hover-video {
           position: absolute; top: 0; left: 0; width: 100%; height: 100%;
           object-fit: cover; z-index: 5;
           opacity: 0; transition: opacity 0.4s ease;
         }
         .product-item-wrap:hover .product-hover-video { opacity: 1; }
         .product-item-wrap .product-image-main { transition: opacity 0.4s ease; }
         .product-item-wrap:hover .product-image-main.has-video { opacity: 0; }
         
         .video-badge {
           position: absolute; bottom: 10px; left: 10px; z-index: 12;
           width: 32px; height: 32px; border-radius: 50%;
           background: rgba(0,0,0,0.55); border: 1.5px solid rgba(255,255,255,0.7);
           display: flex; align-items: center; justify-content: center;
           pointer-events: none; backdrop-filter: blur(3px);
           transition: opacity 0.3s;
         }
         .product-item-wrap:hover .video-badge { opacity: 0; }
      `}} />
    </main>
  );
}

/* ── Product Card with hover‑to‑play video ── */
function ProductCard({ hit }) {
  const videoRef = React.useRef(null);
  const doc = hit.document;
  const hasVideo = !!doc.video_url;

  const handleMouseEnter = () => {
    if (hasVideo && videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(() => {});
    }
  };

  const handleMouseLeave = () => {
    if (hasVideo && videoRef.current) {
      videoRef.current.pause();
    }
  };

  return (
    <Link href={`/product/${doc.slug}`} style={{ textDecoration: 'none', color: 'inherit' }}>
      <div
        style={{ cursor: 'pointer', position: 'relative' }}
        className="product-item-wrap"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <div style={{ position: 'relative', width: '100%', aspectRatio: '3/4', backgroundColor: '#f7f7f7', overflow: 'hidden', marginBottom: '15px' }}>

          {/* Elessi Badges */}
          {doc.price < 30 && (
            <div style={{ position: 'absolute', top: '15px', left: '15px', backgroundColor: '#F05A5A', color: '#fff', padding: '2px 8px', borderRadius: '12px', fontSize: '10px', fontWeight: 'bold', zIndex: 10 }}>HOT</div>
          )}

          {/* Product Image */}
          <Image
            src={doc.image_url || 'https://www.ever-pretty.com/favicon.ico'}
            alt={doc.name}
            fill
            style={{ objectFit: 'cover' }}
            className={`product-image-main${hasVideo ? ' has-video' : ''}`}
            unoptimized
          />

          {/* Hover Video (preloaded on metadata only, plays on hover) */}
          {hasVideo && (
            <video
              ref={videoRef}
              src={doc.video_url}
              muted
              loop
              playsInline
              preload="metadata"
              className="product-hover-video"
            />
          )}

          {/* Video indicator badge */}
          {hasVideo && (
            <div className="video-badge">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="white"><path d="M8 5v14l11-7z" /></svg>
            </div>
          )}

          {/* Hover Action Group */}
          <div style={{ position: 'absolute', top: '15px', right: '15px', display: 'flex', flexDirection: 'column', gap: '10px', opacity: 0, transition: 'all 0.3s ease', transform: 'translateX(10px)' }} className="product-actions-side">
            <button style={{ backgroundColor: '#fff', border: 'none', width: '38px', height: '38px', borderRadius: '50%', cursor: 'pointer', boxShadow: '0 2px 10px rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>♡</button>
          </div>
          <div style={{ position: 'absolute', bottom: '15px', left: '15px', opacity: 0, transition: 'all 0.3s ease', transform: 'translateY(10px)' }} className="product-actions-bottom">
            {doc.size && (
              <div style={{ backgroundColor: '#fff', padding: '4px 8px', fontSize: '11px', fontWeight: 'bold', borderRadius: '2px' }}>{doc.size}</div>
            )}
          </div>
        </div>

        <h4 style={{ margin: 0, fontSize: '14px', fontWeight: '500', color: '#222', marginBottom: '8px', lineHeight: '1.4', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {doc.name}
        </h4>
        <p style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: '#222' }}>
          ${Number(doc.price).toFixed(2)}
        </p>
        <div style={{ marginTop: '8px', display: 'flex', gap: '6px' }}>
          {doc.color && (
            <div style={{ width: '14px', height: '14px', borderRadius: '50%', border: '1px solid #eaeaea', backgroundColor: doc.color.toLowerCase() === 'white' ? '#f5f5f5' : (doc.color.toLowerCase() || '#666') }} title={doc.color}></div>
          )}
        </div>
      </div>
    </Link>
  );
}
