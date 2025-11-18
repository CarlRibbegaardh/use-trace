import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

/**
 * Product entity interface
 */
export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  description: string;
  rating: number;
}

/**
 * Products slice state interface
 */
export interface ProductsState {
  products: Product[];
  selectedProductId: string | null;
  categoryFilter: string;
  priceRange: [number, number];
}

/**
 * Generate large dataset of products for performance testing
 */
const generateProducts = (count: number): Product[] => {
  const categories = ['Electronics', 'Clothing', 'Books', 'Home', 'Sports', 'Toys', 'Food', 'Beauty'];

  return Array.from({ length: count }, (_, i) => ({
    id: `product-${i}`,
    name: `Product ${i}`,
    category: categories[i % categories.length]!,
    price: Math.round((Math.random() * 1000 + 10) * 100) / 100,
    stock: Math.floor(Math.random() * 500),
    description: `Description for product ${i}. This is a great product with many features.`,
    rating: Math.round((Math.random() * 4 + 1) * 10) / 10
  }));
};

const initialState: ProductsState = {
  products: generateProducts(10000),
  selectedProductId: null,
  categoryFilter: '',
  priceRange: [0, 1000]
};

/**
 * Products slice for managing product catalog
 */
export const productsSlice = createSlice({
  name: 'products',
  initialState,
  reducers: {
    selectProduct: (state, action: PayloadAction<string | null>) => {
      state.selectedProductId = action.payload;
    },
    setCategoryFilter: (state, action: PayloadAction<string>) => {
      state.categoryFilter = action.payload;
    },
    setPriceRange: (state, action: PayloadAction<[number, number]>) => {
      state.priceRange = action.payload;
    },
    updateProductStock: (state, action: PayloadAction<{ id: string; stock: number }>) => {
      const product = state.products.find((p): p is Product => p.id === action.payload.id);
      if (product) {
        product.stock = action.payload.stock;
      }
    }
  }
});

export const { selectProduct, setCategoryFilter, setPriceRange, updateProductStock } = productsSlice.actions;
export const productsReducer = productsSlice.reducer;
