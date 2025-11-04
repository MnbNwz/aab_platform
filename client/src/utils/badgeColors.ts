// Standardized badge colors for consistent styling across the application
import type { BadgeConfig } from "./types";
import type {
  UserStatus,
  UserApproval,
  InvestmentStatus,
  ContactStatus,
} from "../types";
import type {
  JobStatusType,
  BidStatusType,
  PaymentStatusType,
} from "../constants";

export type { BadgeConfig };

export const capitalizeFirst = (text: string): string => {
  if (!text) return text;
  return text.charAt(0).toUpperCase() + text.slice(1);
};

const formatStatusLabel = (status: string): string => {
  const statusMap: Record<string, string> = {
    inprogress: "in-progress",
    in_progress: "in-progress",
    under_offer: "under offer",
  };

  const normalizedStatus =
    statusMap[status.toLowerCase()] || status.toLowerCase();
  return capitalizeFirst(normalizedStatus);
};

const getSemanticBadge = (status: string): BadgeConfig => {
  const normalizedStatus = status.toLowerCase();

  if (
    ["completed", "accepted", "succeeded", "available"].includes(
      normalizedStatus
    )
  ) {
    return {
      className: "bg-green-100 text-green-800",
      label: formatStatusLabel(status),
      borderClassName: "border-green-200",
    };
  }

  if (["active", "approved"].includes(normalizedStatus)) {
    return {
      className: "bg-green-100 text-green-800",
      label: formatStatusLabel(status),
      borderClassName: "border-green-200",
    };
  }

  if (["pending", "under_offer", "under offer"].includes(normalizedStatus)) {
    return {
      className: "bg-yellow-100 text-yellow-800",
      label: formatStatusLabel(status),
      borderClassName: "border-yellow-200",
    };
  }

  if (
    ["rejected", "failed", "cancelled", "revoke"].includes(normalizedStatus)
  ) {
    return {
      className: "bg-red-100 text-red-800",
      label: formatStatusLabel(status),
      borderClassName: "border-red-200",
    };
  }

  if (normalizedStatus === "open") {
    return {
      className: "bg-accent-100 text-accent-800",
      label: formatStatusLabel(status),
      borderClassName: "border-accent-200",
    };
  }

  if (["inprogress", "in_progress", "in-progress"].includes(normalizedStatus)) {
    return {
      className: "bg-green-100 text-green-800",
      label: "In-progress",
      borderClassName: "border-green-200",
    };
  }

  return {
    className: "bg-gray-100 text-gray-800",
    label: formatStatusLabel(status),
    borderClassName: "border-gray-200",
  };
};

export const getJobStatusBadge = (status: JobStatusType | string): string => {
  const normalizedStatus = status === "inprogress" ? "in_progress" : status;
  const config = getSemanticBadge(normalizedStatus);
  return config.className;
};

export const getJobStatusBadgeWithLabel = (
  status: JobStatusType | string
): BadgeConfig => {
  return getSemanticBadge(status);
};

export const formatJobStatusText = (status: JobStatusType | string): string => {
  return getSemanticBadge(status).label;
};

export const getBidStatusBadge = (status: BidStatusType | string): string => {
  return getSemanticBadge(status).className;
};

export const getBidStatusBadgeWithBorder = (
  status: BidStatusType | string
): string => {
  const config = getSemanticBadge(status);
  return `${config.className} ${config.borderClassName || "border-gray-200"}`;
};

export const getPaymentStatusBadge = (
  status: PaymentStatusType | string
): string => {
  const normalizedStatus = status.toLowerCase();

  if (normalizedStatus === "refunded") {
    return "bg-purple-100 text-purple-800";
  }

  return getSemanticBadge(status).className;
};

export const getUserStatusBadge = (
  status: UserStatus | string,
  approval?: UserApproval | string
): string => {
  const normalizedStatus = status.toLowerCase();
  const normalizedApproval = approval?.toLowerCase();

  if (normalizedStatus === "revoke") {
    return "bg-red-100 text-red-800";
  }

  if (normalizedApproval === "pending") {
    return "bg-yellow-100 text-yellow-800";
  }

  if (normalizedApproval === "rejected") {
    return "bg-red-100 text-red-800";
  }

  if (normalizedApproval === "approved" && normalizedStatus === "active") {
    return "bg-green-100 text-green-800";
  }

  return getSemanticBadge(status).className;
};

export const getInvestmentStatusBadge = (status: InvestmentStatus): string => {
  return getSemanticBadge(status).className;
};

export const getContactStatusBadge = (status: ContactStatus): string => {
  return getSemanticBadge(status).className;
};

// Get badge colors for dark backgrounds (white text on colored backgrounds)
export const getJobStatusBadgeForDarkBg = (
  status: JobStatusType | string
): string => {
  const normalizedStatus =
    status === "inprogress" ? "in_progress" : status.toLowerCase();

  if (
    ["completed", "accepted", "succeeded", "available"].includes(
      normalizedStatus
    )
  ) {
    return "bg-green-500 text-white";
  }

  if (["active", "approved"].includes(normalizedStatus)) {
    return "bg-green-500 text-white";
  }

  if (["pending", "under_offer", "under offer"].includes(normalizedStatus)) {
    return "bg-yellow-500 text-white";
  }

  if (
    ["rejected", "failed", "cancelled", "revoke"].includes(normalizedStatus)
  ) {
    return "bg-red-500 text-white";
  }

  if (normalizedStatus === "open") {
    return "bg-accent-500 text-white";
  }

  if (["inprogress", "in_progress", "in-progress"].includes(normalizedStatus)) {
    return "bg-green-500 text-white";
  }

  return "bg-gray-500 text-white";
};
