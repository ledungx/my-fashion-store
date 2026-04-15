import { cookies } from 'next/headers';
import Link from 'next/link';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

export default async function AdminLayout({ children }) {
    // Intercept checking to ensure layout isn't rendering full chrome on the login page
    const headersList = await headers();
    const pathname = headersList.get('x-invoke-path') || ''; 
    const isLogin = pathname.includes('/admin/login'); // fallback detection
    
    // In NextJS App router, the cleanest way to bypass layout logic for a child route is relying on route groups. 
    // However, since we strictly built /admin/login directly under /admin, we conditionally render the bare login page if there's no auth token.
    const cookieStore = await cookies();
    const adminToken = cookieStore.get('adminSession');
    if (!adminToken) {
        // Fallback to bare children to prevent sidebar layout bleeding into Login
        return <>{children}</>;
    }

    return (
        <div style={{ display: 'flex', minHeight: '100vh', fontFamily: 'Inter, sans-serif' }}>
            {/* Sidebar */}
            <aside style={{ width: '250px', backgroundColor: '#000', color: '#fff', padding: '30px', display: 'flex', flexDirection: 'column' }}>
                <h2 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '50px', letterSpacing: '-0.5px' }}>Elessi CRM</h2>
                <nav style={{ display: 'flex', flexDirection: 'column', gap: '25px', fontSize: '14px' }}>
                    <Link href="/admin" style={{ color: '#fff', textDecoration: 'none', fontWeight: '600' }}>Dashboard Overview</Link>
                    <Link href="/admin/products" style={{ color: '#ccc', textDecoration: 'none', fontWeight: '600' }}>Product Directory</Link>
                    <Link href="/admin/menus" style={{ color: '#ccc', textDecoration: 'none', fontWeight: '600' }}>Header & Footers</Link>
                    <Link href="/admin/blog" style={{ color: '#ccc', textDecoration: 'none', fontWeight: '600' }}>Blog Manager</Link>
                    <Link href="/admin/pinterest" style={{ color: '#E60023', textDecoration: 'none', fontWeight: '600' }}>📌 Pinterest</Link>
                </nav>
                <div style={{ marginTop: 'auto' }}>
                    <form action={async () => {
                        "use server"; 
                        const cookieStore = await cookies();
                        cookieStore.delete('adminSession'); 
                        redirect('/admin/login');
                    }}>
                        <button style={{ background: 'none', border: 'none', color: '#F05A5A', cursor: 'pointer', fontWeight: 'bold' }}>Terminate Session</button>
                    </form>
                </div>
            </aside>
            
            {/* Main Content Dashboard Area */}
            <main style={{ flex: 1, backgroundColor: '#f5f5f5', padding: '50px', overflowY: 'auto' }}>
                {children}
            </main>
        </div>
    );
}
