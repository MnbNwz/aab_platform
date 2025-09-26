import { configureStore } from "@reduxjs/toolkit";
import { authSlice } from "./slices/authSlice";
import { userSlice } from "./slices/userSlice";
import { serviceSlice } from "./slices/serviceSlice";
import { uiSlice } from "./slices/uiSlice";
import verificationReducer from "./slices/verificationSlice";

import servicesReducer from "./slices/servicesSlice";
import userManagementReducer from "./slices/userManagementSlice";
import membershipReducer from "./slices/membershipSlice";
import jobRequestsReducer from "./slices/jobRequestsSlice";
import jobReducer from "./slices/jobSlice";
import propertyReducer from "./slices/propertySlice";
import adminProfileReducer from "./slices/adminProfileSlice";
import dashboardReducer from "./slices/dashboardSlice";
import contractorJobReducer from "./slices/contractorJobSlice";

export const store = configureStore({
  reducer: {
    auth: authSlice.reducer,
    user: userSlice.reducer,
    service: serviceSlice.reducer,
    ui: uiSlice.reducer,
    verification: verificationReducer,
    services: servicesReducer,
    userManagement: userManagementReducer,
    membership: membershipReducer,
    jobRequests: jobRequestsReducer,
    job: jobReducer,
    property: propertyReducer,
    adminProfile: adminProfileReducer,
    dashboard: dashboardReducer,
    contractorJob: contractorJobReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ["persist/PERSIST", "persist/REHYDRATE"],
      },
    }),
  devTools: import.meta.env.DEV,
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
