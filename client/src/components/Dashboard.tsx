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
import type { RootState, AppDispatch } from "../store";
import { logoutThunk } from "../store/thunks/authThunks";
import PendingApproval from "./PendingApproval";
import AdminSidebar from "./dashboard/AdminSidebar";
import UserStatsCards from "./dashboard/UserStatsCards";
import UserManagementTable from "./dashboard/UserManagementTable";

const Dashboard: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);
  const [activeTab, setActiveTab] = useState("dashboard");

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

  // Check if user needs approval (non-admin users)
  if (user.role !== "admin" && user.status === "pending") {
    return <PendingApproval user={user} />;
  }

  // If user is approved, redirect to dashboard
  if (
    user.role !== "admin" &&
    user.approval === "approved" &&
    user.status === "active"
  ) {
    // For now, show a simple dashboard for approved customers/contractors
    return <CustomerContractorDashboard user={user} onLogout={handleLogout} />;
  }

  // Admin Dashboard
  if (user.role === "admin") {
    return (
      <div className="min-h-screen bg-gray-50 flex">
        {/* Sidebar */}
        <div className="w-80 flex-shrink-0">
          <AdminSidebar activeTab={activeTab} onTabChange={setActiveTab} />
        </div>

        {/* Main Content */}
        <div className="flex-1 p-8">
          {activeTab === "dashboard" && <AdminDashboardContent />}
          {activeTab === "users" && <UserManagementContent />}
          {activeTab === "analytics" && <ComingSoonContent title="Analytics" />}
          {activeTab === "settings" && <ComingSoonContent title="Settings" />}
        </div>
      </div>
    );
  }

  // Fallback for other cases
  return <PendingApproval user={user} />;
};

// Admin Dashboard Content Component
const AdminDashboardContent: React.FC = () => (
  <div className="space-y-8">
    <div>
      <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
      <p className="text-gray-600 mt-2">
        Overview of system statistics and user management
      </p>
    </div>

    {/* Statistics Cards */}
    <UserStatsCards />

    {/* Quick Actions */}
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">
        Quick Actions
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer">
          <Users className="h-8 w-8 text-blue-600 mb-2" />
          <h3 className="font-medium text-gray-900">Pending Approvals</h3>
          <p className="text-sm text-gray-500">Review user registrations</p>
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
  </div>
);

// User Management Content Component
const UserManagementContent: React.FC = () => (
  <div className="space-y-8">
    <div>
      <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
      <p className="text-gray-600 mt-2">
        Manage all users, approvals, and permissions
      </p>
    </div>

    <UserManagementTable />
  </div>
);

// Coming Soon Content Component
const ComingSoonContent: React.FC<{ title: string }> = ({ title }) => (
  <div className="space-y-8">
    <div>
      <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
      <p className="text-gray-600 mt-2">This feature is coming soon</p>
    </div>

    <div className="bg-white rounded-lg shadow p-12 text-center">
      <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <TrendingUp className="h-12 w-12 text-gray-400" />
      </div>
      <h2 className="text-2xl font-semibold text-gray-900 mb-4">
        {title} Coming Soon
      </h2>
      <p className="text-gray-600 max-w-md mx-auto">
        We're working hard to bring you this feature. Stay tuned for updates!
      </p>
    </div>
  </div>
);

// Customer/Contractor Dashboard Component
const CustomerContractorDashboard: React.FC<{
  user: any;
  onLogout: () => void;
}> = ({ user, onLogout }) => (
  <div className="min-h-screen bg-gray-50">
    {/* Header */}
    <div className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Welcome, {user.firstName}!
            </h1>
            <p className="text-gray-600 mt-1">
              {user.role === "customer" ? "Customer" : "Contractor"} Dashboard
            </p>
          </div>
          <button
            onClick={onLogout}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg"
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>

    {/* Content */}
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center space-x-4">
            <div className="bg-blue-100 p-3 rounded-full">
              {user.role === "customer" ? (
                <ShoppingCart className="h-6 w-6 text-blue-600" />
              ) : (
                <Briefcase className="h-6 w-6 text-blue-600" />
              )}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Profile</h3>
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
                <p className="text-sm text-gray-500">Manage your services</p>
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
                {user.role === "customer" ? "My Bookings" : "Appointments"}
              </h3>
              <p className="text-sm text-gray-500">View and manage bookings</p>
            </div>
          </div>
        </div>
      </div>

      {/* Coming Soon Message */}
      <div className="mt-8 bg-white rounded-lg shadow p-8 text-center">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">
          Full Dashboard Coming Soon
        </h2>
        <p className="text-gray-600">
          We're working on building a comprehensive dashboard with all the
          features you need. Stay tuned for updates!
        </p>
      </div>
    </div>
  </div>
);

export default Dashboard;
