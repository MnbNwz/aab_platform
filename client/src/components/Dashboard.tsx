import MyProperties from "./MyProperties";
import React, { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  Users,
  DollarSign,
  Calendar,
  TrendingUp,
  ShoppingCart,
  Briefcase,
} from "lucide-react";
import UserDropdown from "./ui/UserDropdown";
import { logoutThunk } from "../store/thunks/authThunks";
import Sidebar from "./dashboard/Sidebar";
import UserStatsCards from "./dashboard/UserStatsCards";
import UserManagementTable from "./dashboard/UserManagementTable";
import { AppDispatch, RootState } from "../store";
import ProfileModal from "./ProfileModal";
import JobManagementTable from "./dashboard/JobManagementTable";
import type { User } from "../types";
import { handleApiError } from "../services/apiService";
import { updateProfileThunk } from "../store/thunks/userThunks";
import { showToast } from "../utils/toast";

const Dashboard: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const handleLogout = () => {
    dispatch(logoutThunk());
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Loading user data...</p>
        </div>
      </div>
    );
  }

  // Check if user is allowed to see dashboard
  const canAccessDashboard =
    (user.role === "admin" && user.status === "active") ||
    (user.role !== "admin" &&
      user.status === "active" &&
      user.approval === "approved");

  if (!canAccessDashboard) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-primary-800">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-primary-100">
            Access Restricted
          </h1>
          <p className="text-primary-300 mt-2">
            Please wait for your account to be approved.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-primary-800 flex">
      {/* Unified Sidebar for all user types */}
      <Sidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        isMobileOpen={isMobileOpen}
        onMobileToggle={() => setIsMobileOpen(!isMobileOpen)}
        userRole={user.role as "admin" | "customer" | "contractor"}
      />

      {/* Main Content */}
      <div className="flex-1 p-8 relative xl:px-16 lg:px-12 md:px-8 px-4 bg-primary-50">
        <DashboardContent
          user={user}
          activeTab={activeTab}
          handleLogout={handleLogout}
          setActiveTab={setActiveTab}
        />
      </div>
    </div>
  );
};

// Dashboard Content Component
const DashboardContent: React.FC<{
  user: any;
  activeTab: string;
  handleLogout: () => void;
  setActiveTab: (tab: string) => void;
}> = ({ user, activeTab, handleLogout, setActiveTab }) => {
  const dispatch = useDispatch<AppDispatch>();
  const isAdmin = user.role === "admin";
  const [profileOpen, setLocalProfileOpen] = useState(false);

  const handleProfileClose = () => {
    setLocalProfileOpen(false);
  };

  const handleSaveProfile = async (profileData: Partial<User>) => {
    try {
      // Always use user._id for update
      await dispatch(
        updateProfileThunk({ userId: user._id, profileData })
      ).unwrap();
      handleProfileClose();
    } catch (error) {
      showToast.error(handleApiError(error));
    }
  };

  if (activeTab === "dashboard") {
    if (isAdmin) {
      return (
        <div className="space-y-8">
          <div className="flex items-center justify-between pt-4 pb-2">
            <div>
              <h1 className="text-3xl font-bold text-accent-500">
                Admin Dashboard
              </h1>
              <p className="text-lg font-semibold text-accent-400 mt-2">
                Overview of system statistics and user management
              </p>
            </div>
            <div className="ml-4">
              <UserDropdown
                user={user}
                onLogout={handleLogout}
                onProfile={() => setLocalProfileOpen(true)}
                onSettings={() => {}}
              />
            </div>
          </div>

          <UserStatsCards
            onCardClick={(filter) => {
              // setActiveTab("users");
              // dispatch(setFilters({ ...filter, page: 1 }));
            }}
          />

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Quick Actions
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div
                className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer"
                onClick={() => setActiveTab("users")}
              >
                <Users className="h-8 w-8 text-blue-600 mb-2" />
                <h3 className="font-medium text-gray-900">Pending Approvals</h3>
                <p className="text-sm text-gray-500">
                  Review user registrations
                </p>
              </div>
              <div className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer opacity-50">
                <DollarSign className="h-8 w-8 text-green-600 mb-2" />
                <h3 className="font-medium text-gray-900">Revenue Reports</h3>
                <p className="text-sm text-gray-500">Coming soon</p>
              </div>
              <div className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer opacity-50">
                <TrendingUp className="h-8 w-8 text-purple-600 mb-2" />
                <h3 className="font-medium text-gray-900">Analytics</h3>
                <p className="text-sm text-gray-500">Coming soon</p>
              </div>
            </div>
          </div>
          <ProfileModal
            isOpen={profileOpen}
            onClose={handleProfileClose}
            onSave={handleSaveProfile}
            user={user}
          />
        </div>
      );
    } else {
      // Customer/Contractor Dashboard
      return (
        <div className="space-y-0 relative">
          {/* UserDropdown absolute for <768px, static for md+ */}
          <div className="block md:hidden">
            <div className="absolute right-0 -top-2 md:top-8 z-10">
              <UserDropdown
                user={user}
                onLogout={handleLogout}
                onProfile={() => setLocalProfileOpen(true)}
                onSettings={() => {}}
              />
            </div>
          </div>
          <div className="hidden md:flex items-center justify-between pt-8 pb-2">
            <div>
              <h1 className="text-3xl font-bold text-accent-500">
                Welcome, {user.firstName}!
              </h1>
              <p className="text-lg font-semibold text-accent-400 mt-2">
                {user.role === "customer" ? "Customer" : "Contractor"} Dashboard
              </p>
            </div>
            {/* UserDropdown absolute for md+ */}
            <div className="hidden md:block">
              <div className="absolute right-0 top-0 z-10">
                <UserDropdown
                  user={user}
                  onLogout={handleLogout}
                  onProfile={() => setLocalProfileOpen(true)}
                  onSettings={() => {}}
                />
              </div>
            </div>
          </div>
          {/* Centered welcome text for <768px */}
          <div className="md:hidden pt-12 pb-6 text-center">
            <h1 className="text-3xl font-bold text-accent-500">
              Welcome, {user.firstName}!
            </h1>
            <p className="text-lg font-semibold text-accent-400 mt-2">
              {user.role === "customer" ? "Customer" : "Contractor"} Dashboard
            </p>
          </div>

          {/* Tab content */}
          {activeTab === "dashboard" && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Profile Card */}
              <div
                className="bg-white rounded-lg shadow p-6 cursor-pointer hover:bg-gray-50"
                onClick={() => setLocalProfileOpen(true)}
              >
                <div className="flex items-center space-x-4">
                  <div className="bg-blue-100 p-3 rounded-full">
                    {user.role === "customer" ? (
                      <ShoppingCart className="h-6 w-6 text-blue-600" />
                    ) : (
                      <Briefcase className="h-6 w-6 text-blue-600" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      Profile
                    </h3>
                    <p className="text-sm text-gray-500">Manage your account</p>
                  </div>
                </div>
              </div>

              {/* Services Card (Contractor only) */}
              {user.role === "contractor" && (
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center space-x-4">
                    <div className="bg-green-100 p-3 rounded-full">
                      <Briefcase className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        Services
                      </h3>
                      <p className="text-sm text-gray-500">
                        Manage your services
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Bookings Card */}
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center space-x-4">
                  <div className="bg-purple-100 p-3 rounded-full">
                    <Calendar className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {user.role === "customer"
                        ? "My Bookings"
                        : "Appointments"}
                    </h3>
                    <p className="text-sm text-gray-500">
                      View and manage bookings
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
          <ProfileModal
            isOpen={profileOpen}
            onClose={handleProfileClose}
            onSave={handleSaveProfile}
            user={user}
          />
        </div>
      );
    }
  }

  // Other tab content based on activeTab
  if (activeTab === "users" && isAdmin) {
    return <UserManagementTable />;
  }

  if (
    activeTab === "properties" &&
    (user.role === "admin" || user.role === "customer")
  ) {
    return <MyProperties userRole={user.role} />;
  }

  // Show JobManagementTable for jobs tab (admin and customer)
  if (
    activeTab === "jobs" &&
    (user.role === "admin" || user.role === "customer")
  ) {
    return <JobManagementTable />;
  }

  // Default content for other tabs
  return (
    <div className="bg-white rounded-lg shadow p-8 text-center mt-8">
      <h2 className="text-2xl font-semibold text-gray-900 mb-4">
        Feature Coming Soon
      </h2>
      <p className="text-gray-600">
        We're working on building this feature. Stay tuned for updates!
      </p>
    </div>
  );
};

export default Dashboard;
