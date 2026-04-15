'use client';
import { useState, useRef, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function HeaderSearch() {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const inputRef = useRef(null);
    const wrapperRef = useRef(null);
    const router = useRouter();

    // Focus input when opened
    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen]);

    // Close on click outside
    useEffect(() => {
        function handleClickOutside(e) {
            if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Live search with debounce
    useEffect(() => {
        if (!query.trim()) {
            setResults([]);
            return;
        }
        setLoading(true);
        const timer = setTimeout(async () => {
            try {
                const res = await fetch(`/api/search?q=${encodeURIComponent(query)}&per_page=6`);
                const data = await res.json();
                setResults(data.hits || []);
            } catch (e) {
                console.error('Search error', e);
            } finally {
                setLoading(false);
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [query]);

    const handleSubmit = (e) => {
        if (e) e.preventDefault();
        if (query.trim()) {
            const searchUrl = `/search?q=${encodeURIComponent(query.trim())}`;
            router.push(searchUrl);
            setIsOpen(false);
            setQuery('');
            setResults([]);
        }
    };

    return (
        <div ref={wrapperRef} style={{ position: 'relative' }}>
            {/* Search Icon Toggle */}
            <button 
                onClick={() => setIsOpen(!isOpen)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#111', padding: 0, display: 'flex', alignItems: 'center' }}
                aria-label="Toggle search"
            >
                <Search size={22} strokeWidth={1.5} />
            </button>

            {/* Expandable Search Overlay */}
            {isOpen && (
                <div style={{
                    position: 'absolute',
                    top: '50%',
                    right: 0,
                    transform: 'translateY(-50%)',
                    width: '380px',
                    zIndex: 300,
                    animation: 'searchSlideIn 0.25s ease-out forwards'
                }}>
                    <form onSubmit={handleSubmit} style={{ position: 'relative' }}>
                        <input
                            ref={inputRef}
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit(e); }}
                            placeholder="Search products..."
                            style={{
                                width: '100%',
                                padding: '12px 80px 12px 18px',
                                border: '2px solid #111',
                                borderRadius: '50px',
                                fontSize: '14px',
                                outline: 'none',
                                fontFamily: 'Inter, sans-serif',
                                color: '#333',
                                backgroundColor: '#fff',
                                boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
                            }}
                        />
                        <div style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', display: 'flex', gap: '4px' }}>
                            {query && (
                                <button
                                    type="button"
                                    onClick={() => { setQuery(''); inputRef.current?.focus(); }}
                                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#999', padding: '4px', display: 'flex', alignItems: 'center' }}
                                >
                                    <X size={16} />
                                </button>
                            )}
                            <button
                                type="button"
                                onClick={handleSubmit}
                                style={{ background: '#111', border: 'none', cursor: 'pointer', color: '#fff', padding: '6px 12px', borderRadius: '50px', display: 'flex', alignItems: 'center', fontSize: '12px', fontWeight: 'bold' }}
                            >
                                <Search size={14} strokeWidth={2} />
                            </button>
                        </div>
                    </form>

                    {/* Live Results Dropdown */}
                    {query.trim() && (
                        <div style={{
                            position: 'absolute',
                            top: 'calc(100% + 8px)',
                            left: 0,
                            right: 0,
                            backgroundColor: '#fff',
                            border: '1px solid #eaeaea',
                            borderRadius: '12px',
                            boxShadow: '0 8px 30px rgba(0,0,0,0.1)',
                            maxHeight: '400px',
                            overflowY: 'auto',
                            zIndex: 310
                        }}>
                            {loading ? (
                                <div style={{ padding: '20px', textAlign: 'center', color: '#888', fontSize: '13px' }}>Searching...</div>
                            ) : results.length === 0 ? (
                                <div style={{ padding: '20px', textAlign: 'center', color: '#888', fontSize: '13px' }}>No results for "{query}"</div>
                            ) : (
                                <>
                                    {results.map((hit) => (
                                        <a
                                            key={hit.document.id}
                                            href={`/product/${hit.document.slug}`}
                                            onClick={() => { setIsOpen(false); setQuery(''); }}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '12px',
                                                padding: '12px 16px',
                                                textDecoration: 'none',
                                                color: '#333',
                                                borderBottom: '1px solid #f5f5f5',
                                                transition: 'background 0.15s'
                                            }}
                                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9f9f9'}
                                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                        >
                                            {hit.document.image_url && (
                                                <img
                                                    src={hit.document.image_url}
                                                    alt=""
                                                    style={{ width: '45px', height: '55px', objectFit: 'cover', borderRadius: '6px', flexShrink: 0, backgroundColor: '#f5f5f5' }}
                                                />
                                            )}
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ fontSize: '13px', fontWeight: '600', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                    {hit.document.name}
                                                </div>
                                                <div style={{ fontSize: '13px', fontWeight: '700', color: '#F05A5A', marginTop: '2px' }}>
                                                    ${Number(hit.document.price).toFixed(2)}
                                                </div>
                                            </div>
                                        </a>
                                    ))}
                                    <a
                                        href={`/search?q=${encodeURIComponent(query)}`}
                                        onClick={() => { setIsOpen(false); setQuery(''); }}
                                        style={{
                                            display: 'block',
                                            padding: '14px 16px',
                                            textAlign: 'center',
                                            fontSize: '12px',
                                            fontWeight: '800',
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.1em',
                                            color: '#111',
                                            textDecoration: 'none',
                                            borderTop: '1px solid #eaeaea',
                                            transition: 'background 0.15s'
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9f9f9'}
                                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                    >
                                        View All Results →
                                    </a>
                                </>
                            )}
                        </div>
                    )}
                </div>
            )}

            <style dangerouslySetInnerHTML={{__html: `
                @keyframes searchSlideIn {
                    from { opacity: 0; width: 200px; }
                    to { opacity: 1; width: 380px; }
                }
            `}} />
        </div>
    );
}
