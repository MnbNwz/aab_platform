import type { User } from "./index";
import type { PropertyFormData } from "./property";

export interface ConfirmModalProps {
  isOpen: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  default?: boolean;
}

export interface DashboardCardProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  onClick?: () => void;
  iconBgColor: string;
  iconColor: string;
}

export interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  iconBgColor: string;
  iconColor: string;
  loading?: boolean;
}

export interface TabContentProps {
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
}

export interface ProfileEditModalProps {
  user: User;
  isOpen: boolean;
  onClose: () => void;
  onSave: (formData: FormData) => Promise<void>;
}

export interface ProfileViewModalProps {
  user: User;
  isOpen: boolean;
  onClose: () => void;
}

// OLD DUPLICATE INTERFACES REMOVED - See lines 143-174 for correct definitions

export interface UserDropdownProps {
  user: User;
  onProfileClick: () => void;
  onSettingsClick?: () => void;
  onLogout: () => void;
  darkMode?: boolean;
  onToggleSidebar?: () => void;
  isSidebarOpen?: boolean;
  prominent?: boolean;
}

export interface PageHeaderProps {
  title: string;
  subtitle?: string;
  user: User;
  onProfileClick: () => void;
  onSettingsClick?: () => void;
  onLogout: () => void;
  darkMode?: boolean;
  onToggleSidebar?: () => void;
  isSidebarOpen?: boolean;
}

export interface ImagePreviewModalProps {
  isOpen: boolean;
  imageFile: File;
  onContinue: () => void;
  onCancel: () => void;
  onRetake: () => void;
  isUploading?: boolean;
}

export interface MyPropertiesProps {
  userRole: string;
}

export interface PropertyViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  property: {
    _id: string;
    title: string;
    propertyType: string;
    address?: {
      street: string;
      city: string;
      state: string;
      zipCode: string;
      country: string;
    };
    area: number;
    areaUnit: string;
    totalRooms: number;
    bedrooms: number;
    bathrooms: number;
    kitchens: number;
    description?: string;
    images?: string[];
  } | null;
}

// Settings Component Types
export interface SettingsProps {
  user: User;
  onProfileEdit?: () => void;
  onEmailChange?: (oldEmail: string, newEmail: string) => Promise<void>;
  onPasswordChange?: (
    currentPassword: string,
    newPassword: string
  ) => Promise<void>;
}

export interface SettingsSection {
  id: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  disabled?: boolean;
  items: SettingsItem[];
}

export type SettingsItemType =
  | "toggle"
  | "select"
  | "input"
  | "button"
  | "info"
  | "text"
  | "number";

export interface SettingsItem {
  id: string;
  label: string;
  description?: string;
  type: SettingsItemType;
  value?: string | number | boolean;
  options?: { value: string; label: string }[];
  disabled?: boolean;
  onClick?: () => void;
  onChange?: (value: string | number | boolean) => void;
}

// Job Create Component Types
export interface JobCreateProps {
  properties?: PropertyFormData[];
  onClose?: () => void;
  initialProperty?: any; // Property to pre-select
  initialEstimate?: number | null; // Estimate to pre-fill
}

// My Properties Component Types
export interface MyPropertiesProps {
  userRole: string;
}

// Sidebar Component Types
export interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  isMobileOpen?: boolean;
  onClose?: () => void;
  user?: User;
}

// Dashboard Card Component Types
export interface DashboardCardProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  onClick?: () => void;
  iconBgColor: string;
  iconColor: string;
}

// Tab Content Component Types
export interface TabContentProps {
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
  onProfileImageUpdate?: (profileImage: string) => void;
  isMobileOpen?: boolean;
  onMobileToggle?: () => void;
  setActiveTab?: (tab: string) => void;
}
