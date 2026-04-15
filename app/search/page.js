'use client';
import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import ProductGrid from '../../components/ProductGrid';

function SearchContent() {
  const searchParams = useSearchParams();
  const categoryId = searchParams.get('category') || '';
  const categoryName = searchParams.get('categoryName') || '';
  const query = searchParams.get('q') || '';

  return (
    <ProductGrid 
      initialCategoryId={categoryId}
      initialCategoryName={categoryName}
      initialQuery={query}
      showSearchInput={true}
    />
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div style={{ textAlign: 'center', padding: '100px' }}>Loading Filter State...</div>}>
      <SearchContent />
    </Suspense>
  );
}
