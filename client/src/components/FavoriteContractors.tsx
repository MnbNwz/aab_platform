import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  Heart,
  Trash2,
  User,
  Search,
  X,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  Award,
  FileText,
} from "lucide-react";
import type { RootState, AppDispatch } from "../store";
import {
  fetchFavoritesThunk,
  removeFavoriteThunk,
} from "../store/thunks/favoritesThunks";
import Loader from "./ui/Loader";
import ConfirmModal from "./ui/ConfirmModal";

const FavoriteContractors: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { favorites, totalFavorites, maxFavorites, loading, removing } =
    useSelector((state: RootState) => state.favorites);

  useEffect(() => {
    dispatch(fetchFavoritesThunk());
  }, [dispatch]);

  const [searchTerm, setSearchTerm] = useState("");
  const [confirmModal, setConfirmModal] = useState<{
    open: boolean;
    contractor: any | null;
  }>({ open: false, contractor: null });

  const handleRemoveFavorite = (contractor: any) => {
    setConfirmModal({ open: true, contractor });
  };

  const confirmRemoveFavorite = () => {
    if (confirmModal.contractor) {
      dispatch(removeFavoriteThunk(confirmModal.contractor._id));
      setConfirmModal({ open: false, contractor: null });
    }
  };

  const filteredFavorites = favorites.filter((contractor) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      contractor.firstName.toLowerCase().includes(searchLower) ||
      contractor.lastName.toLowerCase().includes(searchLower) ||
      contractor.email.toLowerCase().includes(searchLower) ||
      contractor.contractor?.companyName?.toLowerCase().includes(searchLower) ||
      contractor.contractor?.services?.some((s: string) =>
        s.toLowerCase().includes(searchLower)
      )
    );
  });

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Header */}
      <div className="p-4 sm:p-6 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-4">
          <div className="flex-1">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-primary-900 flex items-center gap-2">
              <Heart className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 text-accent-500 fill-accent-500" />
              Favorite Contractors
            </h1>
            <p className="text-xs sm:text-sm text-gray-600 mt-1 sm:mt-2">
              Manage your favorite contractors for quick access
            </p>
          </div>
          <div className="text-left sm:text-right">
            <div className="text-xs sm:text-sm text-gray-500">
              Total Favorites
            </div>
            <div className="text-xl sm:text-2xl font-bold text-primary-900">
              {totalFavorites}
              <span className="text-gray-400">/{maxFavorites}</span>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, company, or services..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 sm:pl-10 pr-9 sm:pr-10 py-2 sm:py-3 border border-primary-200 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500 text-sm sm:text-base text-primary-900 placeholder-gray-500"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
          )}
        </div>
      </div>

      {/* Loading State */}
      {loading && favorites.length === 0 && (
        <div className="flex justify-center items-center py-16">
          <Loader size="large" />
        </div>
      )}

      {/* Empty State */}
      {!loading && favorites.length === 0 && (
        <div className="text-center py-12 sm:py-16 px-4">
          <Heart className="h-16 w-16 sm:h-20 sm:w-20 lg:h-24 lg:w-24 text-gray-300 mx-auto mb-3 sm:mb-4" />
          <h3 className="text-lg sm:text-xl font-semibold text-primary-900 mb-2">
            No Favorite Contractors Yet
          </h3>
          <p className="text-sm sm:text-base text-gray-600">
            Start adding contractors to your favorites for quick access later
          </p>
        </div>
      )}

      {/* No Search Results */}
      {favorites.length > 0 && filteredFavorites.length === 0 && (
        <div className="text-center py-12 sm:py-16 px-4">
          <Search className="h-16 w-16 sm:h-20 sm:w-20 lg:h-24 lg:w-24 text-gray-300 mx-auto mb-3 sm:mb-4" />
          <h3 className="text-lg sm:text-xl font-semibold text-primary-900 mb-2">
            No Results Found
          </h3>
          <p className="text-sm sm:text-base text-gray-600">
            Try adjusting your search terms to find what you're looking for
          </p>
        </div>
      )}

      {/* Contractors List */}
      <div className="p-4 sm:p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {filteredFavorites.map((contractor) => (
            <div
              key={contractor._id}
              className="bg-white border border-primary-200 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden"
            >
              {/* Card Header */}
              <div className="bg-gradient-to-r from-primary-700 to-primary-800 p-3 sm:p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
                    {contractor.profileImage ? (
                      <img
                        src={contractor.profileImage}
                        alt={`${contractor.firstName} ${contractor.lastName}`}
                        className="h-10 w-10 sm:h-12 sm:w-12 rounded-full border-2 border-white object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full border-2 border-white bg-white flex items-center justify-center flex-shrink-0">
                        <User className="h-5 w-5 sm:h-6 sm:w-6 text-accent-500" />
                      </div>
                    )}
                    <div className="text-white min-w-0 flex-1">
                      <h3 className="font-semibold text-xs sm:text-sm">
                        {contractor.firstName} {contractor.lastName}
                      </h3>
                      {contractor.contractor?.companyName && (
                        <p className="text-primary-100 text-xs truncate">
                          {contractor.contractor.companyName}
                        </p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemoveFavorite(contractor)}
                    disabled={removing[contractor._id]}
                    className="p-1.5 sm:p-2 hover:bg-white/20 rounded-full transition-colors disabled:opacity-50 flex-shrink-0"
                    title="Remove from favorites"
                  >
                    {removing[contractor._id] ? (
                      <Loader size="small" color="white" />
                    ) : (
                      <Trash2 className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                    )}
                  </button>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-3 sm:p-4 space-y-3">
                {/* Contact Info */}
                <div className="space-y-2">
                  <div className="flex items-center text-sm text-gray-600">
                    <Mail className="h-4 w-4 mr-2 text-gray-400" />
                    <span className="truncate">{contractor.email}</span>
                  </div>
                  {contractor.phone && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Phone className="h-4 w-4 mr-2 text-gray-400" />
                      <span>{contractor.phone}</span>
                    </div>
                  )}
                </div>

                {/* License & Tax ID */}
                {(contractor.contractor?.license ||
                  contractor.contractor?.taxId) && (
                  <div className="pt-3 border-t border-gray-100 space-y-2">
                    {contractor.contractor.license && (
                      <div className="flex items-center text-sm text-gray-600">
                        <Award className="h-4 w-4 mr-2 text-gray-400" />
                        <span className="text-xs">
                          License: {contractor.contractor.license}
                        </span>
                      </div>
                    )}
                    {contractor.contractor.taxId && (
                      <div className="flex items-center text-sm text-gray-600">
                        <Briefcase className="h-4 w-4 mr-2 text-gray-400" />
                        <span className="text-xs">
                          Tax ID: {contractor.contractor.taxId}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Services */}
                {contractor.contractor?.services &&
                  contractor.contractor.services.length > 0 && (
                    <div className="pt-3 border-t border-gray-100">
                      <h4 className="text-xs font-medium text-gray-700 mb-2">
                        Services:
                      </h4>
                      <div className="flex flex-wrap gap-1">
                        {contractor.contractor.services.map(
                          (service: string, idx: number) => (
                            <span
                              key={idx}
                              className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700"
                            >
                              {service}
                            </span>
                          )
                        )}
                      </div>
                    </div>
                  )}

                {/* Documents */}
                {contractor.contractor?.docs &&
                  contractor.contractor.docs.length > 0 && (
                    <div className="pt-3 border-t border-gray-100">
                      <h4 className="text-xs font-medium text-gray-700 mb-2">
                        Documents:
                      </h4>
                      <div className="space-y-1">
                        {contractor.contractor.docs.map(
                          (doc: any, idx: number) => (
                            <a
                              key={idx}
                              href={doc.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center text-xs text-blue-600 hover:text-blue-800 transition-colors"
                            >
                              <FileText className="h-3 w-3 mr-1" />
                              <span className="truncate">{doc.name}</span>
                            </a>
                          )
                        )}
                      </div>
                    </div>
                  )}

                {/* Location */}
                {contractor.geoHome && (
                  <div className="pt-3 border-t border-gray-100">
                    <div className="flex items-center text-sm text-gray-600">
                      <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                      <span className="text-xs">
                        {contractor.geoHome.coordinates[1].toFixed(4)},{" "}
                        {contractor.geoHome.coordinates[0].toFixed(4)}
                      </span>
                    </div>
                  </div>
                )}

                {/* Approval Status */}
                <div className="pt-3 border-t border-gray-100">
                  <span
                    className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      contractor.approval === "approved"
                        ? "bg-green-50 text-green-700"
                        : contractor.approval === "pending"
                        ? "bg-yellow-50 text-yellow-700"
                        : "bg-red-50 text-red-700"
                    }`}
                  >
                    {contractor.approval}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Confirm Remove Modal */}
      <ConfirmModal
        isOpen={confirmModal.open}
        title="Remove from Favorites"
        message={
          confirmModal.contractor
            ? `Are you sure you want to remove ${confirmModal.contractor.firstName} ${confirmModal.contractor.lastName} from your favorites?`
            : ""
        }
        confirmText="Yes, Remove"
        cancelText="Cancel"
        onConfirm={confirmRemoveFavorite}
        onCancel={() => setConfirmModal({ open: false, contractor: null })}
        loading={
          confirmModal.contractor
            ? removing[confirmModal.contractor._id]
            : false
        }
      />
    </div>
  );
};

export default FavoriteContractors;
