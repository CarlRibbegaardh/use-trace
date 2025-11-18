import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '../store';
import type { Product } from '../productsSlice';

/**
 * Vanilla selector to get all products
 */
export const selectAllProducts = (state: RootState): Product[] => state.products.products;

/**
 * Vanilla selector to get category filter
 */
export const selectCategoryFilter = (state: RootState): string => state.products.categoryFilter;

/**
 * Vanilla selector to get price range
 */
export const selectPriceRange = (state: RootState): [number, number] => state.products.priceRange;

/**
 * Vanilla selector to get selected product ID
 */
export const selectSelectedProductId = (state: RootState): string | null => state.products.selectedProductId;

/**
 * Memoized selector to get filtered products
 */
export const selectFilteredProducts = createSelector(
  [selectAllProducts, selectCategoryFilter, selectPriceRange],
  (products, category, [minPrice, maxPrice]) => {
    return products.filter(product => {
      const categoryMatch = !category || product.category === category;
      const priceMatch = product.price >= minPrice && product.price <= maxPrice;
      return categoryMatch && priceMatch;
    });
  }
);

/**
 * Memoized selector to get selected product
 */
export const selectSelectedProduct = createSelector(
  [selectAllProducts, selectSelectedProductId],
  (products, selectedId) => {
    if (!selectedId) return null;
    return products.find(p => p.id === selectedId) ?? null;
  }
);

/**
 * Memoized selector to get all categories
 */
export const selectAllCategories = createSelector(
  [selectAllProducts],
  (products) => {
    const categories = new Set(products.map(p => p.category));
    return Array.from(categories).sort();
  }
);

/**
 * Memoized selector to get low stock products
 */
export const selectLowStockProducts = createSelector(
  [selectAllProducts],
  (products) => products.filter(p => p.stock < 50)
);

/**
 * Memoized selector to get average rating
 */
export const selectAverageRating = createSelector(
  [selectFilteredProducts],
  (products) => {
    if (products.length === 0) return 0;
    const sum = products.reduce((acc, p) => acc + p.rating, 0);
    return Math.round((sum / products.length) * 10) / 10;
  }
);
