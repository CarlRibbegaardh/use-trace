import { configureStore } from '@reduxjs/toolkit';
import { usersReducer } from './usersSlice';
import { productsReducer } from './productsSlice';

/**
 * Redux store configuration with all slices
 */
export const store = configureStore({
  reducer: {
    users: usersReducer,
    products: productsReducer
  }
});

/**
 * Root state type inferred from store
 */
export type RootState = ReturnType<typeof store.getState>;

/**
 * App dispatch type inferred from store
 */
export type AppDispatch = typeof store.dispatch;
