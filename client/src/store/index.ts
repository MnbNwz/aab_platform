import { configureStore } from '@reduxjs/toolkit';
import { authSlice } from './slices/authSlice';
import { userSlice } from './slices/userSlice';
import { serviceSlice } from './slices/serviceSlice';
import { uiSlice } from './slices/uiSlice';
import servicesReducer from './slices/servicesSlice';
import userManagementReducer from './slices/userManagementSlice';
import membershipReducer from './slices/membershipSlice';

export const store = configureStore({
  reducer: {
    auth: authSlice.reducer,
    user: userSlice.reducer,
    service: serviceSlice.reducer,
    ui: uiSlice.reducer,
    services: servicesReducer,
    userManagement: userManagementReducer,
    membership: membershipReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }),
  devTools: import.meta.env.DEV,
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
