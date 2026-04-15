'use client';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import cdnLoader from '../utils/cdnLoader';
import { X, CheckCircle } from 'lucide-react';

export default function SalesPopup() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Show popup after 3 seconds, hide after 8 ensuring interactive UX
    const showTimer = setTimeout(() => setVisible(true), 3000);
    const hideTimer = setTimeout(() => setVisible(false), 8000);
    return () => {
      clearTimeout(showTimer);
      clearTimeout(hideTimer);
    };
  }, []);

  if (!visible) return null;

  return (
    <div style={{ position: 'fixed', bottom: '30px', left: '30px', zIndex: 1000, background: '#fff', borderRadius: '4px', boxShadow: '0 5px 20px rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', padding: '12px', width: '300px', border: '1px solid #eaeaea', animation: 'slideUp 0.5s ease' }}>
      <button onClick={() => setVisible(false)} style={{ position: 'absolute', top: '8px', right: '8px', background: 'none', border: 'none', cursor: 'pointer', color: '#999' }}>
         <X size={14} />
      </button>

      <div style={{ width: '60px', height: '80px', flexShrink: 0, position: 'relative', overflow: 'hidden', backgroundColor: '#f5f5f5' }}>
         <Image loader={cdnLoader} src="https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=200" alt="Product" fill style={{ objectFit: 'cover' }} unoptimized />
      </div>
      
      <div style={{ paddingLeft: '15px' }}>
         <p style={{ margin: 0, fontSize: '11px', color: '#666', marginBottom: '4px' }}>Someone in London purchased a</p>
         <h4 style={{ margin: 0, fontSize: '13px', fontWeight: 'bold', color: '#111', marginBottom: '6px' }}>Ruffled Sleeves Top</h4>
         <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#888' }}>
            <span>5 mins ago</span>
            <CheckCircle size={12} color="#34d399" />
            <span style={{ color: '#34d399' }}>Verified</span>
         </div>
      </div>
      
      <style jsx>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
