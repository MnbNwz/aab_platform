import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
  createdAt: string;
}

export interface UIState {
  theme: 'light' | 'dark';
  sidebarOpen: boolean;
  notifications: Notification[];
  isLoading: boolean;
  currentPage: string;
  breadcrumbs: Array<{
    label: string;
    path: string;
  }>;
}

const initialState: UIState = {
  theme: 'light',
  sidebarOpen: false,
  notifications: [],
  isLoading: false,
  currentPage: '',
  breadcrumbs: [],
};

export const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
    
    setSidebar: (state, action: PayloadAction<boolean>) => {
      state.sidebarOpen = action.payload;
    },
    
    setTheme: (state, action: PayloadAction<'light' | 'dark'>) => {
      state.theme = action.payload;
    },
    
    addNotification: (state, action: PayloadAction<Omit<Notification, 'id' | 'createdAt'>>) => {
      const notification: Notification = {
        ...action.payload,
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        createdAt: new Date().toISOString(),
      };
      state.notifications.push(notification);
    },
    
    removeNotification: (state, action: PayloadAction<string>) => {
      state.notifications = state.notifications.filter(n => n.id !== action.payload);
    },
    
    clearNotifications: (state) => {
      state.notifications = [];
    },
    
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    
    setCurrentPage: (state, action: PayloadAction<string>) => {
      state.currentPage = action.payload;
    },
    
    setBreadcrumbs: (state, action: PayloadAction<Array<{
      label: string;
      path: string;
    }>>) => {
      state.breadcrumbs = action.payload;
    },
  },
});

export const {
  toggleSidebar,
  setSidebar,
  setTheme,
  addNotification,
  removeNotification,
  clearNotifications,
  setLoading,
  setCurrentPage,
  setBreadcrumbs,
} = uiSlice.actions;
