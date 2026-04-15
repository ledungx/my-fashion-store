import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export default async function AdminLogin() {
    async function handleLogin(formData) {
        'use server';
        const password = formData.get('password');
        
        if (password === 'admin123') {
            const cookieStore = await cookies();
            cookieStore.set('adminSession', 'secured_admin_access_777', { 
                httpOnly: true, 
                secure: process.env.NODE_ENV === 'production', 
                maxAge: 60 * 60 * 24 // 1 Day TTL
            });
            redirect('/admin');
        }
    }

    return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f5f5f5', fontFamily: 'Inter, sans-serif' }}>
            <div style={{ backgroundColor: '#fff', padding: '60px', borderRadius: '8px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', width: '100%', maxWidth: '400px', textAlign: 'center' }}>
                <h1 style={{ fontSize: '28px', fontWeight: '800', marginBottom: '10px', color: '#111', letterSpacing: '-1px' }}>Elessi Admin</h1>
                <p style={{ color: '#666', marginBottom: '40px', fontSize: '14px' }}>Restricted access. Please input credentials.</p>
                
                <form action={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <input 
                        type="password" 
                        name="password" 
                        placeholder="Admin Password (admin123)" 
                        required 
                        style={{ padding: '16px', border: '1px solid #eaeaea', borderRadius: '4px', fontSize: '15px' }}
                    />
                    <button 
                        type="submit" 
                        style={{ padding: '16px', backgroundColor: '#111', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '15px', fontWeight: 'bold', cursor: 'pointer', transition: 'background 0.2s' }}
                    >
                        Secure Login
                    </button>
                </form>
            </div>
        </div>
    );
}
