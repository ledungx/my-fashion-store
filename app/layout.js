import './globals.css';
import TopBar from '../components/TopBar';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { headers } from 'next/headers';

export const metadata = {
  title: 'Elessi Fashion Store',
  description: 'Premium boutique shopping',
}

export default async function RootLayout({ children }) {
  const headersList = await headers();
  const pathname = headersList.get('x-invoke-path') || ''; 
  const isAdminRoute = pathname.startsWith('/admin');

  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0 }}>
        {!isAdminRoute && <TopBar />}
        {!isAdminRoute && <Header />}
        {children}
        {!isAdminRoute && <Footer />}
      </body>
    </html>
  )
}
