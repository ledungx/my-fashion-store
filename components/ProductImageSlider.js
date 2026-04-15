'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, A11y, Autoplay } from 'swiper/modules';

import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

export default function ProductImageSlider({ images, videoUrl }) {
  const [showVideo, setShowVideo] = useState(false);

  let displayImages = images;
  
  if (!images || images.length === 0) {
     displayImages = [{ id: 'mock', url: 'https://example.com/placeholder.jpg', altText: 'Placeholder Image' }];
  } else if (images.length === 1) {
    const originalUrl = images[0].url;
    // Visually multiply to showcase Swiper functionality on 1-image setups
    displayImages = Array(5).fill().map((_, i) => ({
      id: `mock-${i}`,
      url: originalUrl.includes('?') ? `${originalUrl}&mock=${i}` : `${originalUrl}?mock=${i}`,
      altText: `${images[0].altText || 'Item Photo'} - View ${i + 1}`
    }));
  }

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      {/* Main Image Slider */}
      <div style={{ borderRadius: '16px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)', position: 'relative', width: '100%', aspectRatio: '3/4', background: '#000' }}>
        <Swiper
          modules={[Navigation, Pagination, A11y, Autoplay]}
          spaceBetween={0}
          slidesPerView={1}
          navigation
          pagination={{ clickable: true }}
          autoplay={{ delay: 3500, disableOnInteraction: true }}
          style={{ width: '100%', height: '100%', '--swiper-theme-color': '#3b82f6', '--swiper-navigation-color': '#fff' }}
        >
          {displayImages.map((img, index) => (
            <SwiperSlide key={img.id} style={{ position: 'relative', width: '100%', height: '100%' }}>
              <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                <Image
                  src={img.url}
                  alt={img.altText || "Product illustration"}
                  fill
                  style={{ objectFit: 'cover' }}
                  priority={index === 0} 
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 800px"
                />
              </div>
            </SwiperSlide>
          ))}
        </Swiper>

        {/* Video Play Button — overlays bottom-right of slider */}
        {videoUrl && !showVideo && (
          <button
            onClick={() => setShowVideo(true)}
            aria-label="Play product video"
            style={{
              position: 'absolute',
              bottom: '20px',
              right: '20px',
              zIndex: 50,
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: 'rgba(0,0,0,0.65)',
              border: '2px solid rgba(255,255,255,0.8)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backdropFilter: 'blur(4px)',
              transition: 'transform 0.2s, background 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.1)'; e.currentTarget.style.background = 'rgba(240,90,90,0.85)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.background = 'rgba(0,0,0,0.65)'; }}
          >
            {/* Play triangle */}
            <svg width="22" height="22" viewBox="0 0 24 24" fill="white">
              <path d="M8 5v14l11-7z" />
            </svg>
          </button>
        )}
      </div>

      {/* Video Overlay — Ever-Pretty productVideoBox style */}
      {videoUrl && showVideo && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            zIndex: 30,
            background: '#000',
            borderRadius: '16px',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {/* Close button */}
          <button
            onClick={() => setShowVideo(false)}
            aria-label="Close video"
            style={{
              position: 'absolute',
              top: '12px',
              right: '12px',
              zIndex: 40,
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: 'rgba(0,0,0,0.6)',
              border: '1.5px solid rgba(255,255,255,0.5)',
              color: '#fff',
              fontSize: '20px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              lineHeight: 1,
              backdropFilter: 'blur(4px)',
              transition: 'background 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(240,90,90,0.85)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(0,0,0,0.6)'; }}
          >
            ×
          </button>

          {/* Video Element */}
          <video
            src={videoUrl}
            controls
            autoPlay
            loop
            muted
            playsInline
            controlsList="nodownload"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              background: '#000',
            }}
          />
        </div>
      )}
    </div>
  );
}
