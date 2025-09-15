import MyProperties from "./MyProperties";
import React, {
  useState,
  useCallback,
  useMemo,
  useEffect,
  memo,
  useRef,
} from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  Users,
  DollarSign,
  Calendar,
  TrendingUp,
  ShoppingCart,
  Briefcase,
} from "lucide-react";
import PageHeader from "./ui/PageHeader";
import { logoutThunk } from "../store/thunks/authThunks";
import Sidebar from "./dashboard/Sidebar";
import UserStatsCards from "./dashboard/UserStatsCards";
import UserManagementTable from "./dashboard/UserManagementTable";
import { AppDispatch, RootState } from "../store";
import ProfileModal from "./ProfileModal";
import ProfileViewModal from "./ProfileViewModal";
import Settings from "./Settings";
import JobManagementTable from "./dashboard/JobManagementTable";
import type { User } from "../types";
import { handleApiError } from "../services/apiService";
import {
  updateProfileThunk,
  changePasswordThunk,
} from "../store/thunks/userThunks";
import { showToast } from "../utils/toast";

interface DashboardCardProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  onClick?: () => void;
  iconBgColor: string;
  iconColor: string;
  disabled?: boolean;
}

interface TabContentProps {
  user: User;
  activeTab: string;
  handleLogout: () => void;
  onProfile: () => void;
  onProfileFromSettings: () => void;
  onEmailChange?: (oldEmail: string, newEmail: string) => Promise<void>;
  onPasswordChange?: (
    currentPassword: string,
    newPassword: string
  ) => Promise<void>;
  isMobileOpen: boolean;
  onMobileToggle: () => void;
  setActiveTab: (tab: string) => void;
}

// Reusable Dashboard Card Component
const DashboardCard = memo<DashboardCardProps>(
  ({
    icon: Icon,
    title,
    description,
    onClick,
    iconBgColor,
    iconColor,
    disabled = false,
  }) => (
    <div
      className={`bg-white rounded-lg shadow p-4 sm:p-6 cursor-pointer hover:bg-gray-50 transition-colors ${
        disabled ? "opacity-50" : ""
      }`}
      onClick={disabled ? undefined : onClick}
    >
      <div className="flex items-center space-x-3 sm:space-x-4">
        <div className={`${iconBgColor} p-2 sm:p-3 rounded-full flex-shrink-0`}>
          <Icon className={`h-5 w-5 sm:h-6 sm:w-6 ${iconColor}`} />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900">
            {title}
          </h3>
          <p className="text-xs sm:text-sm text-gray-500">{description}</p>
        </div>
      </div>
    </div>
  )
);

DashboardCard.displayName = "DashboardCard";

// Admin Quick Actions Component
const AdminQuickActions = memo<{ onNavigateToUsers: () => void }>(
  ({ onNavigateToUsers }) => {
    const quickActions = useMemo(
      () => [
        {
          icon: Users,
          title: "Pending Approvals",
          description: "Review user registrations",
          onClick: onNavigateToUsers,
          iconBgColor: "bg-blue-100",
          iconColor: "text-blue-600",
        },
        {
          icon: DollarSign,
          title: "Revenue Reports",
          description: "Coming soon",
          iconBgColor: "bg-green-100",
          iconColor: "text-green-600",
          disabled: true,
        },
        {
          icon: TrendingUp,
          title: "Analytics",
          description: "Coming soon",
          iconBgColor: "bg-purple-100",
          iconColor: "text-purple-600",
          disabled: true,
        },
      ],
      [onNavigateToUsers]
    );

    return (
      <div className="bg-white rounded-lg shadow p-4 sm:p-6">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 sm:mb-6">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {quickActions.map((action, index) => (
            <DashboardCard key={index} {...action} />
          ))}
        </div>
      </div>
    );
  }
);

AdminQuickActions.displayName = "AdminQuickActions";

const UserDashboardCards = memo<{
  user: User;
  onProfileClick: () => void;
}>(({ user, onProfileClick }) => {
  const userCards = useMemo(() => {
    const isCustomer = user.role === "customer";
    const isContractor = user.role === "contractor";

    return [
      {
        icon: isCustomer ? ShoppingCart : Briefcase,
        title: "Profile",
        description: "Manage your account",
        onClick: onProfileClick,
        iconBgColor: "bg-blue-100",
        iconColor: "text-blue-600",
      },
      // Conditional contractor services card
      ...(isContractor
        ? [
            {
              icon: Briefcase,
              title: "Services",
              description: "Manage your services",
              iconBgColor: "bg-green-100",
              iconColor: "text-green-600",
            },
          ]
        : []),
      {
        icon: Calendar,
        title: isCustomer ? "My Bookings" : "Appointments",
        description: "View and manage bookings",
        iconBgColor: "bg-purple-100",
        iconColor: "text-purple-600",
      },
    ];
  }, [user.role, onProfileClick]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
      {userCards.map((card, index) => (
        <DashboardCard key={index} {...card} />
      ))}
    </div>
  );
});

UserDashboardCards.displayName = "UserDashboardCards";

// Tab Content Wrapper Component
const TabContentWrapper = memo<{
  title: string;
  subtitle: string;
  user: User;
  onLogout: () => void;
  onProfile: () => void;
  isMobileOpen: boolean;
  onMobileToggle: () => void;
  children: React.ReactNode;
}>(
  ({
    title,
    subtitle,
    user,
    onLogout,
    onProfile,
    isMobileOpen,
    onMobileToggle,
    children,
  }) => (
    <>
      <PageHeader
        title={title}
        subtitle={subtitle}
        user={user}
        onLogout={onLogout}
        onProfile={onProfile}
        showHamburger={true}
        onHamburgerClick={onMobileToggle}
        isSidebarOpen={isMobileOpen}
      />
      <div className="flex-1 p-4 sm:p-6 lg:p-8 relative xl:px-16 lg:px-12 md:px-8 px-4">
        {children}
      </div>
    </>
  )
);

TabContentWrapper.displayName = "TabContentWrapper";

// Main Dashboard Content Component
const DashboardContent = memo<TabContentProps>(
  ({
    user,
    activeTab,
    handleLogout,
    onProfile,
    onProfileFromSettings,
    onEmailChange,
    onPasswordChange,
    isMobileOpen,
    onMobileToggle,
    setActiveTab,
  }) => {
    const isAdmin = user.role === "admin";

    const handleNavigateToUsers = useCallback(() => {
      setActiveTab("users");
    }, [setActiveTab]);

    // Tab content configuration
    const tabConfig = useMemo(() => {
      const baseProps = {
        user,
        onLogout: handleLogout,
        onProfile,
        isMobileOpen,
        onMobileToggle,
      };

      if (activeTab === "dashboard") {
        return isAdmin
          ? {
              ...baseProps,
              title: "Admin Dashboard",
              subtitle: "Overview of the system",
              children: (
                <div className="space-y-6 md:space-y-8">
                  <UserStatsCards onCardClick={() => {}} />
                  <AdminQuickActions
                    onNavigateToUsers={handleNavigateToUsers}
                  />
                </div>
              ),
            }
          : {
              ...baseProps,
              title: `${user.role === "customer" ? "Customer" : "Contractor"} `,
              subtitle: "Overview of the system",
              children: (
                <UserDashboardCards user={user} onProfileClick={onProfile} />
              ),
            };
      }

      const tabConfigs = {
        users: isAdmin && {
          ...baseProps,
          title: "User Management",
          subtitle: "Manage system users",
          children: <UserManagementTable />,
        },
        properties: (user.role === "admin" || user.role === "customer") && {
          ...baseProps,
          title: "My Properties",
          subtitle: "Manage your property listings",
          children: <MyProperties userRole={user.role} />,
        },
        jobs: (user.role === "admin" || user.role === "customer") && {
          ...baseProps,
          title: "Job Management",
          subtitle: "Manage job requests and assignments",
          children: <JobManagementTable />,
        },
        settings: {
          ...baseProps,
          title: "Settings",
          subtitle: "Manage your account preferences and business settings",
          children: (
            <Settings
              user={user}
              onProfileEdit={onProfileFromSettings}
              onEmailChange={onEmailChange}
              onPasswordChange={onPasswordChange}
            />
          ),
        },
      };

      return tabConfigs[activeTab as keyof typeof tabConfigs] || null;
    }, [
      activeTab,
      isAdmin,
      user,
      handleLogout,
      onProfile,
      isMobileOpen,
      onMobileToggle,
      handleNavigateToUsers,
    ]);

    // Render tab content or default
    return tabConfig ? (
      <TabContentWrapper {...tabConfig} />
    ) : (
      <div className="bg-white rounded-lg shadow p-8 text-center mt-8">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">
          Feature Coming Soon
        </h2>
        <p className="text-gray-600">
          We're working on building this feature. Stay tuned for updates!
        </p>
      </div>
    );
  }
);

DashboardContent.displayName = "DashboardContent";

const Dashboard: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [profileViewOpen, setProfileViewOpen] = useState(false);
  const [profileFromSettings, setProfileFromSettings] = useState(false);
  const [displayUser, setDisplayUser] = useState<User | null>(null);
  const hasManuallyUpdatedDisplayUser = useRef(false);

  useEffect(() => {
    if (user && !hasManuallyUpdatedDisplayUser.current) {
      setDisplayUser(user);
    }
  }, [user]);

  const handleLogout = useCallback(() => {
    dispatch(logoutThunk());
  }, [dispatch]);

  const handleMobileToggle = useCallback(() => {
    setIsMobileOpen((prev) => !prev);
  }, []);

  const handleProfileViewOpen = useCallback(() => {
    setProfileViewOpen(true);
  }, []);

  const handleProfileViewClose = useCallback(() => {
    setProfileViewOpen(false);
  }, []);

  const handleProfileOpenFromSettings = useCallback(() => {
    setProfileFromSettings(true);
    setProfileOpen(true);
  }, []);

  const handleProfileClose = useCallback(() => {
    setProfileOpen(false);
  }, []);

  const handleEmailChange = useCallback(
    async (oldEmail: string, newEmail: string) => {
      try {
        // Validate that the old email matches the current user email
        if (oldEmail !== user?.email) {
          throw new Error("Current email does not match your account email");
        }

        const updatedUser = await dispatch(
          updateProfileThunk({
            userId: user!._id,
            profileData: { email: newEmail },
            successMessage: "Email updated successfully!",
          })
        ).unwrap();

        // Update displayUser with the new email (this updates the user dropdown)
        hasManuallyUpdatedDisplayUser.current = true;
        if (updatedUser && updatedUser.email) {
          setDisplayUser((prev) =>
            prev ? { ...prev, email: updatedUser.email } : null
          );
        } else {
          // Fallback: update with the new email directly
          setDisplayUser((prev) =>
            prev ? { ...prev, email: newEmail } : null
          );
        }
      } catch (error) {
        // Error is handled by the thunk
        throw error; // Re-throw to let the modal handle it
      }
    },
    [dispatch, user, displayUser]
  );

  const handlePasswordChange = useCallback(
    async (currentPassword: string, newPassword: string) => {
      try {
        await dispatch(
          changePasswordThunk({
            currentPassword,
            newPassword,
          })
        ).unwrap();
      } catch (error) {
        // Error is handled by the thunk
        throw error; // Re-throw to let the modal handle it
      }
    },
    [dispatch]
  );

  const handleSaveProfile = useCallback(
    async (profileData: Partial<User>) => {
      try {
        await dispatch(
          updateProfileThunk({ userId: user!._id, profileData })
        ).unwrap();

        // Update only the displayUser state for UI updates
        // This prevents triggering global re-renders that cause white screen
        hasManuallyUpdatedDisplayUser.current = true;
        if (displayUser) {
          setDisplayUser({ ...displayUser, ...profileData });
        }
      } catch (error) {
        showToast.error(handleApiError(error));
      }
    },
    [dispatch, user, displayUser]
  );

  // Memoized user role
  const userRole = useMemo(
    () => user?.role as "admin" | "customer" | "contractor",
    [user?.role]
  );

  // Memoized access check
  const canAccessDashboard = useMemo(
    () =>
      (user?.role === "admin" && user?.status === "active") ||
      (user?.role !== "admin" &&
        user?.status === "active" &&
        user?.approval === "approved"),
    [user?.role, user?.status, user?.approval]
  );

  // Conditional rendering for loading and access states
  const renderState = useMemo(() => {
    if (!user) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <p className="text-gray-600">Loading user data...</p>
          </div>
        </div>
      );
    }

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

    return null;
  }, [user, canAccessDashboard]);

  if (renderState) return renderState;

  // At this point, user is guaranteed to be non-null due to renderState check
  const userData = displayUser || user!;

  return (
    <div className="min-h-screen bg-primary-800 flex">
      <Sidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        isMobileOpen={isMobileOpen}
        onMobileToggle={handleMobileToggle}
        userRole={userRole}
      />

      <div className="flex-1 flex flex-col bg-primary-50">
        <DashboardContent
          user={userData}
          activeTab={activeTab}
          handleLogout={handleLogout}
          onProfile={handleProfileViewOpen}
          onProfileFromSettings={handleProfileOpenFromSettings}
          onEmailChange={handleEmailChange}
          onPasswordChange={handlePasswordChange}
          isMobileOpen={isMobileOpen}
          onMobileToggle={handleMobileToggle}
          setActiveTab={setActiveTab}
        />
      </div>

      <ProfileViewModal
        isOpen={profileViewOpen}
        onClose={handleProfileViewClose}
        user={userData}
      />

      <ProfileModal
        isOpen={profileOpen}
        onClose={handleProfileClose}
        onSave={handleSaveProfile}
        user={userData}
        showAllFields={profileFromSettings}
      />
    </div>
  );
};

export default memo(Dashboard);
