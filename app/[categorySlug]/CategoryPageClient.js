'use client';
import { Suspense } from 'react';
import ProductGrid from '../../components/ProductGrid';

export default function CategoryPageClient({ categoryId, categoryName }) {
    return (
        <Suspense fallback={<div style={{ textAlign: 'center', padding: '100px' }}>Loading...</div>}>
            <ProductGrid 
                initialCategoryId={categoryId}
                initialCategoryName={categoryName}
                initialQuery=""
                showSearchInput={false}
            />
        </Suspense>
    );
}
