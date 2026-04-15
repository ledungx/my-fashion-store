import Link from 'next/link';

export default function HeroBanner() {
  return (
    <section style={{ width: '100%', height: 'calc(100vh - 120px)', minHeight: '600px', display: 'flex', position: 'relative', overflow: 'hidden' }}>
        {/* Left Side Pexels Placeholder - Blush Pink Theme */}
        <div style={{ flex: 1, backgroundColor: '#fceced', backgroundImage: 'url("https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=1200")', backgroundSize: 'cover', backgroundPosition: 'center' }}></div>
        
        {/* Right Side Pexels Placeholder - Powder Blue Theme */}
        <div style={{ flex: 1, backgroundColor: '#e2ecef', backgroundImage: 'url("https://images.unsplash.com/photo-1520975954732-57dd22299614?q=80&w=1200")', backgroundSize: 'cover', backgroundPosition: 'center' }}></div>
        
        {/* Center Overlay Block */}
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
           
           {/* Diamond */}
           <div style={{ width: '200px', height: '200px', backgroundColor: '#222', transform: 'rotate(45deg)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '50px', boxShadow: '0 20px 40px rgba(0,0,0,0.15)' }}>
              <div style={{ transform: 'rotate(-45deg)', textAlign: 'center', color: '#fff' }}>
                 <p style={{ fontSize: '20px', fontWeight: '800', letterSpacing: '0.1em', margin: 0, lineHeight: 1.2, textTransform: 'lowercase' }}>new</p>
                 <p style={{ fontSize: '26px', fontWeight: '400', fontStyle: 'italic', fontFamily: 'serif', margin: 0, lineHeight: 1.2, marginTop: '2px' }}>arrivals</p>
              </div>
           </div>

           {/* Brand Title */}
           <h2 style={{ fontSize: '18px', fontWeight: '800', letterSpacing: '0.5em', color: '#111', textTransform: 'uppercase', marginBottom: '35px' }}>
               E l e s s i &nbsp;&nbsp; S t o r e
           </h2>

           {/* CTA Button */}
           <Link href="/search" style={{ pointerEvents: 'auto', textDecoration: 'none' }}>
             <button style={{ backgroundColor: '#F05A5A', color: '#fff', border: 'none', padding: '18px 45px', fontSize: '12px', fontWeight: '700', letterSpacing: '0.15em', textTransform: 'uppercase', cursor: 'pointer', transition: 'background-color 0.3s', borderRadius: '3px', boxShadow: '0 10px 20px rgba(240, 90, 90, 0.2)' }}>
                Shop Now
             </button>
           </Link>

        </div>
    </section>
  );
}
