// lib/store.js
import { configureStore } from '@reduxjs/toolkit';
import commonReducer from './slices/commonSlice'; // Assuming you create a counter slice below

export const makeStore = () => {
  return configureStore({
    reducer: {
      data: commonReducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: false,
      }),
  });
};