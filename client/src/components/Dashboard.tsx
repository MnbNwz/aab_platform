import MyProperties from "./MyProperties";
import React, {
  useState,
  useCallback,
  useMemo,
  memo,
  useEffect,
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
import UserManagementTable from "./dashboard/UserManagementTable";
import CustomerDashboardCards from "./dashboard/CustomerDashboardCards";
import ContractorDashboardCards from "./dashboard/ContractorDashboardCards";
import PlatformDashboardCards from "./dashboard/PlatformDashboardCards";
import { fetchDashboardThunk } from "../store/thunks/dashboardThunks";
import { useDashboardRefresh } from "../hooks/useDashboardRefresh";
import { AppDispatch, RootState } from "../store";
import { fetchInvestmentStatisticsThunk } from "../store/slices/investmentOpportunitySlice";
import ProfileEditModal from "./ProfileEditModal";
import {
  isAdmin,
  isCustomer,
  isContractor,
  isAdminOrCustomer,
  isCustomerOrContractor,
} from "../utils";
import ProfileViewModal from "./ProfileViewModal";
import Settings from "./Settings";
import JobManagementTable from "./dashboard/JobManagementTable";
import AvailableJobs from "./dashboard/AvailableJobs";
import StartedJobs from "./dashboard/StartedJobs";
import CompletedJobs from "./dashboard/CompletedJobs";
import FavoriteContractors from "./FavoriteContractors";
import MyBids from "./MyBids";
import InvestmentOpportunitiesManagement from "./dashboard/InvestmentOpportunitiesManagement";
import ContractorOffMarketOpportunities from "./contractor/ContractorOffMarketOpportunities";
import InterestedProperties from "./contractor/InterestedProperties";
import Analytics from "./dashboard/Analytics";
import BillingHistoryTable from "./dashboard/BillingHistoryTable";
import type { User, DashboardCardProps } from "../types";
import { handleApiError } from "../services/apiService";
import {
  updateProfileWithFormDataThunk,
  changePasswordThunk,
} from "../store/thunks/userThunks";
import { buildProfileFormDataFromUser } from "../utils/profileFormData";
import { showToast } from "../utils/toast";

// Extended DashboardCardProps to include disabled property
interface ExtendedDashboardCardProps extends DashboardCardProps {
  disabled?: boolean;
}

// Reusable Dashboard Card Component
const DashboardCard = memo<ExtendedDashboardCardProps>(
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
  const isCustomerRole = useMemo(() => isCustomer(user.role), [user.role]);
  const isContractorRole = useMemo(() => isContractor(user.role), [user.role]);

  const userCards = useMemo(() => {
    return [
      {
        icon: isCustomerRole ? ShoppingCart : Briefcase,
        title: "Profile",
        description: "Manage your account",
        onClick: onProfileClick,
        iconBgColor: "bg-blue-100",
        iconColor: "text-blue-600",
      },
      // Conditional contractor services card
      ...(isContractorRole
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
        title: isCustomerRole ? "My Bookings" : "Appointments",
        description: "View and manage bookings",
        iconBgColor: "bg-purple-100",
        iconColor: "text-purple-600",
      },
    ];
  }, [isCustomerRole, isContractorRole, onProfileClick]);

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

// Jobs Tabs Wrapper - handles switching between Available, Started, and Completed Jobs
const JobsTabsWrapper = memo(() => {
  const [activeTab, setActiveTab] = useState<
    "available" | "started" | "completed"
  >("available");

  return (
    <div className="w-full space-y-4 sm:space-y-6">
      {/* Tab Navigation */}
      <div className="bg-white rounded-lg shadow-sm border border-primary-200 overflow-hidden">
        <div className="px-3 sm:px-4 md:px-6 py-3 sm:py-4">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab("available")}
              className={`flex-1 px-2 sm:px-4 py-2 text-xs sm:text-sm font-medium transition-colors text-center ${
                activeTab === "available"
                  ? "text-accent-600 border-b-2 border-accent-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Available Jobs
            </button>
            <button
              onClick={() => setActiveTab("started")}
              className={`flex-1 px-2 sm:px-4 py-2 text-xs sm:text-sm font-medium transition-colors text-center ${
                activeTab === "started"
                  ? "text-accent-600 border-b-2 border-accent-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Started Jobs
            </button>
            <button
              onClick={() => setActiveTab("completed")}
              className={`flex-1 px-2 sm:px-4 py-2 text-xs sm:text-sm font-medium transition-colors text-center ${
                activeTab === "completed"
                  ? "text-accent-600 border-b-2 border-accent-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Completed Jobs
            </button>
          </div>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === "available" ? (
        <AvailableJobs />
      ) : activeTab === "started" ? (
        <StartedJobs />
      ) : (
        <CompletedJobs />
      )}
    </div>
  );
});

JobsTabsWrapper.displayName = "JobsTabsWrapper";

// Main Dashboard Content Component
interface DashboardContentProps {
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
  manualRefresh: () => void;
  unifiedData: any;
  unifiedLoading: boolean;
  customerData: any;
  contractorData: any;
  platformData: any;
  setActiveTab: (tab: string) => void;
}

const DashboardContent = memo<DashboardContentProps>(
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
    manualRefresh,
    unifiedData,
    unifiedLoading,
    customerData,
    contractorData,
    platformData,
    setActiveTab: _setActiveTab,
  }) => {
    // Memoize role checks to avoid repeated calculations
    const isAdminRole = useMemo(() => isAdmin(user.role), [user.role]);
    const isCustomerRole = useMemo(() => isCustomer(user.role), [user.role]);
    const isContractorRole = useMemo(
      () => isContractor(user.role),
      [user.role]
    );
    const isAdminOrCustomerRole = useMemo(
      () => isAdminOrCustomer(user.role),
      [user.role]
    );
    const isCustomerOrContractorRole = useMemo(
      () => isCustomerOrContractor(user.role),
      [user.role]
    );

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
        if (isAdminRole) {
          return {
            ...baseProps,
            title: "Platform Dashboard",
            subtitle: "Platform overview",
            children: (
              <PlatformDashboardCards
                key="platform-dashboard"
                data={unifiedData || platformData}
                onRefresh={manualRefresh}
              />
            ),
          };
        } else if (isCustomerRole) {
          return {
            ...baseProps,
            title: "Customer Dashboard",
            subtitle: "Your analytics",
            children: (
              <CustomerDashboardCards
                data={unifiedData || customerData}
                loading={unifiedLoading}
                onRefresh={manualRefresh}
              />
            ),
          };
        } else if (isContractorRole) {
          return {
            ...baseProps,
            title: "Contractor Dashboard",
            subtitle: "Your analytics",
            children: (
              <ContractorDashboardCards
                data={unifiedData || contractorData}
                loading={unifiedLoading}
                onRefresh={manualRefresh}
              />
            ),
          };
        }
      }

      const tabConfigs = {
        users: isAdminRole && {
          ...baseProps,
          title: "User Management",
          subtitle: "User management",
          children: <UserManagementTable />,
        },
        analytics: isAdminRole && {
          ...baseProps,
          title: "Analytics",
          subtitle: "Analytics",
          children: <Analytics />,
        },
        properties: isAdminRole
          ? {
              ...baseProps,
              title: "Off Market Properties",
              subtitle: "Investment opportunities",
              children: <InvestmentOpportunitiesManagement />,
            }
          : isCustomerRole
          ? {
              ...baseProps,
              title: "My Properties",
              subtitle: "Your properties",
              children: <MyProperties userRole={user.role} />,
            }
          : null,
        jobs: isAdminOrCustomerRole && {
          ...baseProps,
          title: "Job Management",
          subtitle: "Job management",
          children: <JobManagementTable />,
        },
        favorites: isCustomerRole && {
          ...baseProps,
          title: "Favorite Contractors",
          subtitle: "Favorite contractors",
          children: <FavoriteContractors />,
        },
        "billing-history": isCustomerOrContractorRole && {
          ...baseProps,
          title: "Billing History",
          subtitle: "Payment history and receipts",
          children: <BillingHistoryTable />,
        },
        // Contractor job requests
        ...(isContractorRole
          ? {
              jobs: {
                ...baseProps,
                title: "Jobs",
                subtitle: "Browse and apply to jobs",
                children: <JobsTabsWrapper key="jobs" />,
              },
              bids: {
                ...baseProps,
                title: "My Bids",
                subtitle: "Your bids",
                children: <MyBids />,
              },
              offMarket: {
                ...baseProps,
                title: "Off Market Opportunities",
                subtitle: "Investment opportunities",
                children: <ContractorOffMarketOpportunities />,
              },
              interestedProperties: {
                ...baseProps,
                title: "Interested Properties",
                subtitle: "Interested properties",
                children: <InterestedProperties />,
              },
            }
          : {}),
        settings: {
          ...baseProps,
          title: "Settings",
          subtitle: "Account settings",
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
      isAdminRole,
      isCustomerRole,
      isContractorRole,
      isAdminOrCustomerRole,
      isCustomerOrContractorRole,
      user,
      handleLogout,
      onProfile,
      isMobileOpen,
      onMobileToggle,
      onProfileFromSettings,
      onEmailChange,
      onPasswordChange,
      manualRefresh,
      unifiedData,
      unifiedLoading,
      customerData,
      contractorData,
      platformData,
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

  // Load dashboard data once when user is available and dashboard tab is active
  const {
    data: unifiedData,
    loading: unifiedLoading,
    customerData,
    contractorData,
    platformData,
  } = useSelector((state: RootState) => state.dashboard);

  // Manual refresh functionality for dashboard
  const dashboardUserRole = useMemo(
    () => user?.role as "admin" | "customer" | "contractor",
    [user?.role]
  );
  const { manualRefresh } = useDashboardRefresh(dashboardUserRole);

  // Track if we've already loaded data for this user session
  const hasLoadedRef = useRef<boolean>(false);

  useEffect(() => {
    if (user && activeTab === "dashboard" && !hasLoadedRef.current) {
      // Only call unified API once per component mount to prevent multiple calls
      hasLoadedRef.current = true;

      if (!unifiedData) {
        dispatch(fetchDashboardThunk({ showToast: false })); // Silent initial load, no toast
      }

      // Fetch investment statistics in parallel for admin users (independent of unifiedData)
      if (user.role === "admin") {
        dispatch(fetchInvestmentStatisticsThunk());
      }
    }
  }, [dispatch, user, activeTab, unifiedData]);

  const handleLogout = useCallback(() => {
    dispatch(logoutThunk()).then(() => {
      window.history.replaceState(null, "", "/login");
    });
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
      // Validate that the old email matches the current user email
      if (oldEmail !== user?.email) {
        throw new Error("Current email does not match your account email");
      }

      // Build FormData for email update
      const formData = buildProfileFormDataFromUser(user!, {
        email: newEmail,
      });

      const result = await dispatch(
        updateProfileWithFormDataThunk({
          userId: user!._id,
          formData,
          successMessage: "Email updated successfully!",
        })
      );

      // Redux auth slice will automatically update the user state
      // Let the thunk handle errors
      if (updateProfileWithFormDataThunk.rejected.match(result)) {
        throw new Error(result.payload as string);
      }
    },
    [dispatch, user]
  );

  const handlePasswordChange = useCallback(
    async (currentPassword: string, newPassword: string) => {
      await dispatch(
        changePasswordThunk({
          currentPassword,
          newPassword,
        })
      ).unwrap();
    },
    [dispatch]
  );

  // Remove unused handleProfileImageUpdate - Settings handles it internally via Redux

  const handleSaveProfile = useCallback(
    async (profileData: Partial<User>) => {
      try {
        // Convert User data to ProfileFormDataParams format
        const formDataParams: Partial<
          import("../utils/profileFormData").ProfileFormDataParams
        > = {
          firstName: profileData.firstName,
          lastName: profileData.lastName,
          phone: profileData.phone,
          email: profileData.email,
          geoHome: profileData.geoHome
            ? {
                type: "Point" as const,
                coordinates: profileData.geoHome.coordinates,
              }
            : undefined,
          customer: profileData.customer
            ? {
                defaultPropertyType: profileData.customer
                  .defaultPropertyType as "domestic" | "commercial",
              }
            : undefined,
          contractor: profileData.contractor,
        };

        // Build FormData from the profile data
        const formData = buildProfileFormDataFromUser(user!, formDataParams);

        await dispatch(
          updateProfileWithFormDataThunk({
            userId: user!._id,
            formData,
            successMessage: "Profile updated successfully!",
          })
        ).unwrap();

        // Redux auth slice will automatically update the user state
        // No need for manual displayUser updates
      } catch (error) {
        // Don't update state on error - just show error message
        showToast.error(handleApiError(error));
      }
    },
    [dispatch, user]
  );

  // Memoized user role for sidebar
  const sidebarUserRole = useMemo(
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
        <div className="aas-loader-container-mobile">
          <div className="text-center">
            <p className="text-gray-600">Loading user data...</p>
          </div>
        </div>
      );
    }

    if (!canAccessDashboard) {
      return (
        <div className="aas-loader-container-mobile bg-primary-800">
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
  const userData = user!;

  return (
    <div className="min-h-screen bg-primary-800 flex">
      <Sidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        isMobileOpen={isMobileOpen}
        onMobileToggle={handleMobileToggle}
        userRole={sidebarUserRole}
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
          manualRefresh={manualRefresh}
          unifiedData={unifiedData}
          unifiedLoading={unifiedLoading}
          customerData={customerData}
          contractorData={contractorData}
          platformData={platformData}
          setActiveTab={setActiveTab}
        />
      </div>

      <ProfileViewModal
        isOpen={profileViewOpen}
        onClose={handleProfileViewClose}
        user={userData}
      />

      <ProfileEditModal
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
