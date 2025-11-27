import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useSelector, useDispatch } from "react-redux";
import { User } from "../types";
import { CheckCircle, Edit, X, Heart, MessageSquare } from "lucide-react";
import { motion } from "framer-motion";
import { useGeocoding } from "../hooks/useGeocoding";
import { isContractor, isCustomer, isAdmin } from "../utils";
import { capitalizeFirst } from "../utils/badgeColors";
import { BaseModal, Badge, Text, InfoField } from "./reusable";
import type { RootState, AppDispatch } from "../store";
import {
  fetchFavoritesThunk,
  addFavoriteThunk,
  removeFavoriteThunk,
} from "../store/thunks/favoritesThunks";
import ConfirmModal from "./ui/ConfirmModal";
import Loader from "./ui/Loader";
import UserFeedbackModal from "./reviews/UserFeedbackModal";

interface ProfileViewModalProps {
  user: User;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: () => void;
  isLoading?: boolean;
  hideEditForAdmin?: boolean; // New prop to hide edit button for admin users
  showFeedbackButton?: boolean; // Show feedback button for specific scenarios
}

const ProfileViewModal: React.FC<ProfileViewModalProps> = ({
  user,
  isOpen,
  onClose,
  onEdit,
  isLoading = false,
  hideEditForAdmin = false,
  showFeedbackButton = false,
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const { user: currentUser } = useSelector((state: RootState) => state.auth);
  const {
    favoriteIds,
    loading: favoritesLoading,
    adding,
    removing,
  } = useSelector((state: RootState) => state.favorites);

  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);

  const isViewingContractor = isContractor(user.role);
  const isCurrentUserCustomer = currentUser?.role
    ? isCustomer(currentUser.role)
    : false;
  const canFavorite = isCurrentUserCustomer && isViewingContractor;

  const isFavorited = useMemo(() => {
    if (!canFavorite || !user._id) return false;
    return favoriteIds.includes(user._id);
  }, [canFavorite, user._id, favoriteIds]);

  useEffect(() => {
    if (isOpen && canFavorite && user._id) {
      dispatch(fetchFavoritesThunk());
    }
  }, [isOpen, canFavorite, user._id, dispatch]);

  const handleFavoriteClick = useCallback(() => {
    if (!user._id) return;

    if (isFavorited) {
      setShowRemoveConfirm(true);
    } else {
      dispatch(addFavoriteThunk(user._id));
    }
  }, [user._id, isFavorited, dispatch]);

  const handleConfirmRemove = useCallback(() => {
    if (user._id) {
      dispatch(removeFavoriteThunk(user._id));
      setShowRemoveConfirm(false);
    }
  }, [user._id, dispatch]);

  const handleCancelRemove = useCallback(() => {
    setShowRemoveConfirm(false);
  }, []);

  const isFavoriteActionLoading = adding[user._id] || removing[user._id];

  // Memoized actionable email component
  const ActionableEmail = useMemo(() => {
    if (!user.email) return null;
    return (
      <a
        href={`mailto:${user.email}`}
        className="font-medium text-primary-900 text-sm xs:text-base truncate hover:text-primary-600 cursor-pointer transition-colors"
        onClick={(e) => e.stopPropagation()}
      >
        {user.email}
      </a>
    );
  }, [user.email]);

  // Memoized actionable phone component
  const ActionablePhone = useMemo(() => {
    if (!user.phone) return null;
    return (
      <a
        href={`tel:${user.phone}`}
        className="font-medium text-primary-900 text-sm xs:text-base hover:text-primary-600 cursor-pointer transition-colors"
        onClick={(e) => e.stopPropagation()}
      >
        {user.phone}
      </a>
    );
  }, [user.phone]);

  // Get readable address from coordinates
  const { address: locationAddress, loading: addressLoading } = useGeocoding(
    user.geoHome?.coordinates && user.geoHome.coordinates.length === 2
      ? { lat: user.geoHome.coordinates[1], lng: user.geoHome.coordinates[0] }
      : null
  );

  if (!isOpen) return null;

  const getRoleVariant = (role: string): "primary" | "info" | "success" => {
    switch (role) {
      case "admin":
        return "primary";
      case "contractor":
        return "info";
      case "customer":
        return "success";
      default:
        return "info";
    }
  };

  const getStatusVariant = (
    status: string
  ): "success" | "warning" | "danger" => {
    switch (status) {
      case "active":
        return "success";
      case "pending":
        return "warning";
      case "revoke":
        return "danger";
      default:
        return "warning";
    }
  };

  const modalFooter = [
    {
      label: "Close",
      onClick: onClose,
      variant: "secondary" as const,
      leftIcon: <X className="h-4 w-4" />,
    },
    ...(onEdit && !(hideEditForAdmin && isAdmin(user.role))
      ? [
          {
            label: "Edit",
            onClick: onEdit,
            variant: "primary" as const,
            leftIcon: <Edit className="h-4 w-4" />,
          },
        ]
      : []),
    ...(showFeedbackButton
      ? [
          {
            label: "View Feedback",
            onClick: () => setFeedbackModalOpen(true),
            variant: "primary" as const,
            leftIcon: <MessageSquare className="h-4 w-4" />,
          },
        ]
      : []),
  ];

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Profile Information"
      maxWidth="4xl"
      footer={modalFooter}
      showFooter={true}
    >
      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10 rounded-lg">
          <div className="flex flex-col items-center space-y-3">
            <div className="w-8 h-8 border-4 border-accent-500 border-t-transparent rounded-full animate-spin"></div>
            <Text size="sm" className="text-primary-600 font-medium">
              Loading profile details...
            </Text>
          </div>
        </div>
      )}

      <div className="space-y-4 xs:space-y-6">
        {/* Profile Header */}
        <div className="flex items-center justify-between space-x-3 xs:space-x-4 p-3 xs:p-4 bg-gradient-to-r from-primary-50 to-accent-50 rounded-lg">
          <div className="flex items-center space-x-3 xs:space-x-4 flex-1 min-w-0">
            <div className="w-12 h-12 xs:w-14 xs:h-14 sm:w-16 sm:h-16 rounded-full shadow-lg flex-shrink-0 overflow-hidden">
              {user.profileImage ? (
                <img
                  src={user.profileImage}
                  alt={`${user.firstName} ${user.lastName}`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                    e.currentTarget.nextElementSibling?.classList.remove(
                      "hidden"
                    );
                  }}
                />
              ) : null}
              <div
                className={`w-full h-full bg-gradient-to-br from-primary-500 to-accent-500 rounded-full flex items-center justify-center ${
                  user.profileImage ? "hidden" : ""
                }`}
              >
                <span className="text-white text-sm xs:text-base sm:text-xl font-bold">
                  {user.firstName?.charAt(0)}
                  {user.lastName?.charAt(0)}
                </span>
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <Text
                size="lg"
                weight="bold"
                className="text-primary-900 truncate"
              >
                {user.firstName} {user.lastName}
              </Text>
              <div className="flex items-center space-x-2 mt-1 flex-wrap">
                <Badge variant={getRoleVariant(user.role)} size="sm">
                  {user.role?.charAt(0).toUpperCase() + user.role?.slice(1)}
                </Badge>
                {user.status === "active" && (
                  <div className="flex items-center text-green-600">
                    <CheckCircle className="h-3 w-3 xs:h-4 xs:w-4 mr-1" />
                    <Text size="sm" weight="medium">
                      Active
                    </Text>
                  </div>
                )}
              </div>
            </div>
          </div>
          {canFavorite && (
            <button
              onClick={handleFavoriteClick}
              disabled={isFavoriteActionLoading || favoritesLoading}
              className="flex-shrink-0 p-2 hover:bg-white/50 rounded-full transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              title={isFavorited ? "Remove from favorites" : "Add to favorites"}
            >
              {isFavoriteActionLoading ? (
                <Loader size="small" color="primary" />
              ) : (
                <motion.div
                  animate={
                    isFavorited
                      ? {
                          scale: [1, 1.2, 1],
                          rotate: [0, 10, -10, 0],
                        }
                      : {}
                  }
                  transition={{
                    duration: 0.5,
                    repeat: isFavorited ? Infinity : 0,
                    repeatDelay: 2,
                  }}
                >
                  <Heart
                    className={`h-6 w-6 xs:h-7 xs:w-7 sm:h-8 sm:w-8 transition-all duration-200 ${
                      isFavorited
                        ? "fill-red-500 text-red-500"
                        : "text-gray-400 hover:text-red-400"
                    }`}
                  />
                </motion.div>
              )}
            </button>
          )}
        </div>

        {/* Contact Information */}
        <div className="space-y-3 xs:space-y-4">
          <Text
            size="lg"
            weight="semibold"
            className="text-primary-900 border-b border-primary-200 pb-2"
          >
            Contact Information
          </Text>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 xs:gap-4">
            {user.email && (
              <InfoField
                label="Email"
                value={ActionableEmail}
                containerClassName="p-2 xs:p-3 bg-primary-50 rounded-lg"
                labelClassName="text-xs xs:text-sm text-primary-600"
                valueClassName="font-medium text-primary-900 text-sm xs:text-base truncate"
              />
            )}

            {user.phone && (
              <InfoField
                label="Phone"
                value={ActionablePhone}
                containerClassName="p-2 xs:p-3 bg-primary-50 rounded-lg"
                labelClassName="text-xs xs:text-sm text-primary-600"
                valueClassName="font-medium text-primary-900 text-sm xs:text-base"
              />
            )}

            {user.geoHome?.coordinates && (
              <InfoField
                label="Location"
                value={
                  addressLoading ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 border-2 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
                      <Text size="sm">Loading address...</Text>
                    </div>
                  ) : (
                    locationAddress ||
                    `${user.geoHome.coordinates[1].toFixed(
                      4
                    )}, ${user.geoHome.coordinates[0].toFixed(4)}`
                  )
                }
                containerClassName="p-2 xs:p-3 bg-primary-50 rounded-lg sm:col-span-2"
                labelClassName="text-xs xs:text-sm text-primary-600"
                valueClassName="font-medium text-primary-900 text-xs xs:text-sm break-all"
              />
            )}
          </div>
        </div>

        {/* Account Status */}
        <div className="space-y-3 xs:space-y-4">
          <Text
            size="lg"
            weight="semibold"
            className="text-primary-900 border-b border-primary-200 pb-2"
          >
            Account Status
          </Text>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 xs:gap-4">
            <InfoField
              label="Status"
              value={
                <Badge variant={getStatusVariant(user.status || "")} size="sm">
                  {capitalizeFirst(user.status || "")}
                </Badge>
              }
              containerClassName="p-2 xs:p-3 bg-primary-50 rounded-lg"
              labelClassName="text-xs xs:text-sm text-primary-600"
            />

            {user.approval && (
              <InfoField
                label="Approval"
                value={
                  user.approval === "approved"
                    ? "Approved"
                    : capitalizeFirst(user.approval || "")
                }
                containerClassName="p-2 xs:p-3 bg-primary-50 rounded-lg"
                labelClassName="text-xs xs:text-sm text-primary-600"
                valueClassName="font-medium text-primary-900 text-sm xs:text-base"
              />
            )}
          </div>
        </div>

        {/* Role-specific Information */}
        {isContractor(user.role) && user.contractor && (
          <div className="space-y-3 xs:space-y-4">
            <Text
              size="lg"
              weight="semibold"
              className="text-primary-900 border-b border-primary-200 pb-2"
            >
              Business Information
            </Text>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 xs:gap-4">
              {user.contractor.companyName && (
                <InfoField
                  label="Company Name"
                  value={user.contractor.companyName}
                  containerClassName="p-2 xs:p-3 bg-primary-50 rounded-lg"
                  labelClassName="text-xs xs:text-sm text-primary-600"
                  valueClassName="font-medium text-primary-900 text-sm xs:text-base truncate"
                />
              )}

              {user.contractor.license && (
                <InfoField
                  label="License"
                  value={user.contractor.license}
                  containerClassName="p-2 xs:p-3 bg-primary-50 rounded-lg"
                  labelClassName="text-xs xs:text-sm text-primary-600"
                  valueClassName="font-medium text-primary-900 text-sm xs:text-base"
                />
              )}

              {user.contractor.services &&
                user.contractor.services.length > 0 && (
                  <div className="p-2 xs:p-3 bg-primary-50 rounded-lg sm:col-span-2">
                    <Text size="sm" className="text-primary-600 mb-1">
                      Services
                    </Text>
                    <div className="flex flex-wrap gap-1 xs:gap-2 mt-1">
                      {user.contractor.services.map((service, index) => (
                        <Badge key={index} variant="info" size="sm">
                          {service}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

              {user.contractor.docs && user.contractor.docs.length > 0 && (
                <div className="p-2 xs:p-3 bg-primary-50 rounded-lg sm:col-span-2">
                  <Text size="sm" className="text-primary-600 mb-2">
                    Documents
                  </Text>
                  <div className="mt-2 space-y-2">
                    {user.contractor.docs.map((doc: any, index: number) => (
                      <div
                        key={index}
                        className="flex items-center justify-between bg-white p-2 rounded border"
                      >
                        <Text
                          size="sm"
                          className="text-primary-700 truncate flex-1 mr-2"
                        >
                          Attachment
                        </Text>
                        <a
                          href={doc.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary-600 hover:text-primary-800 text-sm font-medium underline"
                        >
                          View
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {isCustomer(user.role) && user.customer && (
          <div className="space-y-3 xs:space-y-4">
            <Text
              size="lg"
              weight="semibold"
              className="text-primary-900 border-b border-primary-200 pb-2"
            >
              Customer Information
            </Text>

            <InfoField
              label="Default Property Type"
              value={user.customer.defaultPropertyType}
              containerClassName="p-2 xs:p-3 bg-primary-50 rounded-lg"
              labelClassName="text-xs xs:text-sm text-primary-600"
              valueClassName="font-medium text-primary-900 text-sm xs:text-base capitalize"
            />
          </div>
        )}
      </div>

      {/* Remove Favorite Confirmation Modal */}
      {showRemoveConfirm && (
        <ConfirmModal
          isOpen={showRemoveConfirm}
          onCancel={handleCancelRemove}
          onConfirm={handleConfirmRemove}
          title="Remove from Favorites"
          message={`Are you sure you want to remove ${user.firstName} ${user.lastName} from your favorite contractors?`}
          confirmText="Remove"
          cancelText="Cancel"
        />
      )}

      {/* User Feedback Modal */}
      {feedbackModalOpen && (
        <UserFeedbackModal
          isOpen={feedbackModalOpen}
          onClose={() => setFeedbackModalOpen(false)}
          userId={user._id}
          userName={`${user.firstName} ${user.lastName}`}
        />
      )}
    </BaseModal>
  );
};

export default ProfileViewModal;
