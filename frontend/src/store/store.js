import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import menuReducer from './slices/menuSlice';
import orderReducer from './slices/orderSlice';
import userReducer from './slices/userSlice';
import branchReducer from './slices/branchSlice';
import ridersReducer from './slices/ridersSlice';
import paymentsReducer from './slices/paymentsSlice';
import themeReducer from './slices/themeSlice';
import inventoryReducer from './slices/inventorySlice';
import analyticsReducer from './slices/analyticsSlice';
import marketingReducer from './slices/marketingSlice';
import operationsReducer from './slices/operationsSlice';
import qualityReducer from './slices/qualitySlice';
import financialReducer from './slices/financialSlice';
import systemReducer from './slices/systemSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    menu: menuReducer,
    orders: orderReducer,
    users: userReducer,
    branches: branchReducer,
    riders: ridersReducer,
    payments: paymentsReducer,
    theme: themeReducer,
    inventory: inventoryReducer,
    analytics: analyticsReducer,
    marketing: marketingReducer,
    operations: operationsReducer,
    quality: qualityReducer,
    financial: financialReducer,
    system: systemReducer,
  },
});

export default store;
