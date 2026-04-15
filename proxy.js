import { NextResponse } from 'next/server';

export function proxy(request) {
    if (request.nextUrl.pathname.startsWith('/admin')) {
        const adminToken = request.cookies.get('adminSession');
        const isAuthenticated = adminToken && adminToken.value === 'secured_admin_access_777';

        if (request.nextUrl.pathname === '/admin/login') {
            if (isAuthenticated) {
                return NextResponse.redirect(new URL('/admin', request.url));
            }
            return NextResponse.next();
        }
        
        if (!isAuthenticated) {
            return NextResponse.redirect(new URL('/admin/login', request.url));
        }
    }
    return NextResponse.next();
}

export const config = {
    matcher: ['/admin/:path*'],
};
