import React, { useState } from "react";
import {
  User as UserIcon,
  Settings as SettingsIcon,
  LogOut as LogOutIcon,
} from "lucide-react";

import { useSelector, useDispatch } from "react-redux";
import {
  Users,
  DollarSign,
  Calendar,
  TrendingUp,
  ShoppingCart,
  Briefcase,
} from "lucide-react";
import ProfileModal from "./ProfileModal";
// ProfileMenu component for top right profile icon and dropdown
const ProfileMenu: React.FC<{ user: any; onLogout: () => void; onProfile: () => void }> = ({
  user,
  onLogout,
  onProfile,
}) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        className="flex items-center space-x-2 bg-white border border-gray-200 rounded-full px-3 py-2 shadow hover:bg-gray-50 focus:outline-none"
        onClick={() => setOpen((o) => !o)}
      >
        <UserIcon className="h-6 w-6 text-blue-600" />
        <span className="hidden md:inline text-sm font-medium text-gray-900">
          {user?.firstName}
        </span>
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg py-2 z-20">
          <button
            className="w-full flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100"
            onClick={() => { setOpen(false); onProfile(); }}
          >
            <UserIcon className="h-5 w-5 mr-2" /> Profile
          </button>
          <button
            className="w-full flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100"
            onClick={() => setOpen(false)}
          >
            <SettingsIcon className="h-5 w-5 mr-2" /> Settings
          </button>
          {/* <button
            className="w-full flex items-center px-4 py-2 text-red-600 hover:bg-red-50"
            onClick={onLogout}
          >
            <LogOutIcon className="h-5 w-5 mr-2" /> Logout
          </button> */}
        </div>
      )}
    </div>
  );
};
import { logoutThunk } from "../store/thunks/authThunks";
import PendingApproval from "./PendingApproval";
import AdminSidebar from "./dashboard/AdminSidebar";
import UserStatsCards from "./dashboard/UserStatsCards";
import UserManagementTable from "./dashboard/UserManagementTable";

const Dashboard: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [profileOpen, setProfileOpen] = useState(false);

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

  // Non-admins with status 'pending' see PendingApproval
  if (user.role !== "admin" && user.status === "pending") {
    return <PendingApproval user={user} />;
  }

  // Non-admins with status 'active' and approval 'approved' see their dashboard
  if (
    user.role !== "admin" &&
    user.status === "active" &&
    user.approval === "approved"
  ) {
    return <CustomerContractorDashboard user={user} onLogout={handleLogout} />;
  }

  // Admins with status 'active' always see the dashboard, regardless of approval
  if (user.role === "admin" && user.status === "active") {
    return (
      <div className="min-h-screen bg-primary-800 flex">
        {/* Sidebar */}
        <div className="w-80 flex-shrink-0 bg-primary-900">
          <AdminSidebar activeTab={activeTab} onTabChange={setActiveTab} />
        </div>

        {/* Main Content */}
        <div className="flex-1 p-8 relative xl:px-16 lg:px-12 md:px-8 px-4 bg-primary-50">
          {/* Profile Icon Top Right */}
          {activeTab === "dashboard" && (
            <AdminDashboardContent user={user} handleLogout={handleLogout} profileOpen={profileOpen} setProfileOpen={setProfileOpen} />
          )}
          {activeTab === "users" && <UserManagementContent />}
          {activeTab === "analytics" && <ComingSoonContent title="Analytics" />}
          {activeTab === "settings" && <ComingSoonContent title="Settings" />}
        </div>
        {/* Profile Modal */}
        <ProfileModal
          user={user}
          isOpen={profileOpen}
          onClose={() => setProfileOpen(false)}
          onSave={updated => {/* TODO: implement save logic */}}
        />
      </div>
    );
  }

  // Fallback: show PendingApproval for non-admins, minimal dashboard for admin
  if (user.role !== "admin") {
    return <PendingApproval user={user} />;
  }
  return (
    <div className="min-h-screen flex items-center justify-center bg-primary-800">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-primary-100">Admin Dashboard</h1>
        <p className="text-primary-300 mt-2">
          Welcome, admin. If you see this, something is wrong with your account
          status.
        </p>
      </div>
    </div>
  );
};

// Admin Dashboard Content Component
const AdminDashboardContent: React.FC<{
  user: any;
  handleLogout: () => void;
  profileOpen: boolean;
  setProfileOpen: React.Dispatch<React.SetStateAction<boolean>>;
}> = ({ user, handleLogout, profileOpen, setProfileOpen }) => (
  <div className="space-y-8">
    <div className="flex items-center justify-between pt-4 pb-2">
      {/* Dashboard Title (center) */}
      <div>
        <h1 className="text-3xl font-bold text-accent-500 ">Admin Dashboard</h1>
        <p className="text-lg font-semibold  text-accent-400 mt-2">
          Overview of system statistics and user management
        </p>
      </div>
      {/* Profile Icon (right) */}
      <div className="ml-4">
        <ProfileMenu user={user} onLogout={handleLogout} onProfile={() => setProfileOpen(true)} />
      </div>
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
