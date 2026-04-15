import Link from 'next/link';

export default function PageBanner({ title = "Shop", breadcrumbs = [{label: "Home", href: "/"}, {label: "Fashions", href: ""}] }) {
  return (
    <div style={{
      width: '100%',
      height: '300px',
      backgroundColor: '#f5f5f5',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      position: 'relative',
      overflow: 'hidden',
      marginBottom: '40px'
    }}>
        {/* Subtle background placeholder elements representing the clothes */}
        <div style={{ position: 'absolute', left: '-5%', top: '10%', opacity: 0.1, width: '300px', height: '300px', backgroundImage: 'url("https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=400")', backgroundSize: 'cover', transform: 'rotate(-15deg)' }}></div>
        <div style={{ position: 'absolute', right: '-5%', bottom: '-10%', opacity: 0.1, width: '300px', height: '300px', backgroundImage: 'url("https://images.unsplash.com/photo-1520975954732-57dd22299614?q=80&w=400")', backgroundSize: 'cover', transform: 'rotate(15deg)' }}></div>

        <h1 style={{ fontSize: '38px', fontWeight: '600', color: '#222', margin: 0, marginBottom: '10px', zIndex: 1, textTransform: 'capitalize' }}>{title}</h1>
        <div style={{ fontSize: '13px', color: '#666', display: 'flex', gap: '8px', zIndex: 1 }}>
            {breadcrumbs.map((bc, idx) => (
                <span key={idx} style={{ display: 'flex', alignItems: 'center' }}>
                    {bc.href ? <Link href={bc.href} style={{ color: 'inherit', textDecoration: 'none', transition: 'color 0.2s', cursor: 'pointer' }}>{bc.label}</Link> : <span style={{ color: '#222' }}>{bc.label}</span>}
                    {idx < breadcrumbs.length - 1 && <span style={{ margin: '0 8px' }}>›</span>}
                </span>
            ))}
        </div>
    </div>
  );
}
