import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Heart, User as UserIcon, Search, X, Phone, Mail } from "lucide-react";
import type { RootState, AppDispatch } from "../store";
import { fetchFavoritesThunk } from "../store/thunks/favoritesThunks";
import Loader from "./ui/Loader";
import DataTable, { TableColumn } from "./ui/DataTable";
import ProfileViewModal from "./ProfileViewModal";
import type { User } from "../types";

interface FavoriteContractorTable extends Record<string, unknown> {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  profileImage?: string;
  contractor?: {
    companyName?: string;
    services?: string[];
    license?: string;
    taxId?: string;
    docs?: any[];
  };
  approval?: string;
  geoHome?: {
    coordinates: [number, number];
  };
}

const FavoriteContractors: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { favorites, totalFavorites, maxFavorites, loading } = useSelector(
    (state: RootState) => state.favorites
  );

  useEffect(() => {
    dispatch(fetchFavoritesThunk());
  }, [dispatch]);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedContractor, setSelectedContractor] = useState<User | null>(
    null
  );
  const [profileModalOpen, setProfileModalOpen] = useState(false);

  const handleRowClick = useCallback((contractor: FavoriteContractorTable) => {
    const contractorUser: User = {
      _id: contractor._id,
      email: contractor.email,
      firstName: contractor.firstName,
      lastName: contractor.lastName,
      phone: contractor.phone || undefined,
      profileImage: contractor.profileImage || undefined,
      role: "contractor" as const,
      status: "active" as const,
      approval:
        (contractor.approval as "approved" | "pending" | "rejected") ||
        "approved",
      emailVerified: true,
      createdAt: (contractor as any).createdAt || new Date().toISOString(),
      updatedAt: (contractor as any).updatedAt || new Date().toISOString(),
      contractor: contractor.contractor
        ? {
            companyName: contractor.contractor.companyName || "",
            services: contractor.contractor.services || [],
            license: contractor.contractor.license || "",
            taxId: contractor.contractor?.taxId || "",
            docs: contractor.contractor?.docs || [],
          }
        : undefined,
      geoHome: contractor.geoHome
        ? {
            type: "Point",
            coordinates: contractor.geoHome.coordinates,
          }
        : undefined,
    };
    setSelectedContractor(contractorUser);
    setProfileModalOpen(true);
  }, []);

  const filteredFavorites = useMemo(() => {
    if (!searchTerm) return favorites;
    const searchLower = searchTerm.toLowerCase();
    return favorites.filter((contractor) => {
      return (
        contractor.firstName.toLowerCase().includes(searchLower) ||
        contractor.lastName.toLowerCase().includes(searchLower) ||
        contractor.email.toLowerCase().includes(searchLower) ||
        contractor.contractor?.companyName
          ?.toLowerCase()
          .includes(searchLower) ||
        contractor.contractor?.services?.some((s: string) =>
          s.toLowerCase().includes(searchLower)
        )
      );
    });
  }, [favorites, searchTerm]);

  const columns: TableColumn<FavoriteContractorTable>[] = useMemo(
    () => [
      {
        key: "contractor",
        header: "Contractor",
        render: (contractor) => (
          <div className="flex items-center gap-3">
            {contractor.profileImage ? (
              <img
                src={contractor.profileImage}
                alt={`${contractor.firstName} ${contractor.lastName}`}
                className="h-10 w-10 rounded-full object-cover flex-shrink-0"
              />
            ) : (
              <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                <UserIcon className="h-5 w-5 text-primary-600" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="font-semibold text-primary-900 truncate">
                {contractor.firstName} {contractor.lastName}
              </div>
              {contractor.contractor?.companyName &&
                !contractor.contractor.companyName
                  .toLowerCase()
                  .startsWith(contractor.firstName.toLowerCase()) && (
                  <div className="text-sm text-gray-500 truncate">
                    {contractor.contractor.companyName}
                  </div>
                )}
            </div>
          </div>
        ),
        mobileRender: (contractor) => (
          <div className="flex items-center gap-3">
            {contractor.profileImage ? (
              <img
                src={contractor.profileImage}
                alt={`${contractor.firstName} ${contractor.lastName}`}
                className="h-10 w-10 rounded-full object-cover flex-shrink-0"
              />
            ) : (
              <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                <UserIcon className="h-5 w-5 text-primary-600" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-primary-900 truncate">
                {contractor.firstName} {contractor.lastName}
              </div>
              {contractor.contractor?.companyName &&
                !contractor.contractor.companyName
                  .toLowerCase()
                  .startsWith(contractor.firstName.toLowerCase()) && (
                  <div className="text-sm text-gray-500 truncate">
                    {contractor.contractor.companyName}
                  </div>
                )}
            </div>
          </div>
        ),
        mobileLabel: "", // Hide label in mobile view to avoid duplication
      },
      {
        key: "email",
        header: "Email",
        render: (contractor) => (
          <div className="flex items-center gap-2 text-sm text-gray-700 min-w-0">
            <Mail className="h-4 w-4 text-gray-400 flex-shrink-0" />
            <span className="truncate">{contractor.email}</span>
          </div>
        ),
        mobileLabel: "Email",
        mobileRender: (contractor) => (
          <div className="flex items-center gap-2 text-sm text-gray-700 min-w-0 w-full">
            <Mail className="h-4 w-4 text-gray-400 flex-shrink-0" />
            <span className="truncate min-w-0">{contractor.email}</span>
          </div>
        ),
        hideOnMobile: true,
      },
      {
        key: "phone",
        header: "Phone",
        render: (contractor) =>
          contractor.phone ? (
            <div className="flex items-center gap-2 text-sm text-gray-700 min-w-0">
              <Phone className="h-4 w-4 text-gray-400 flex-shrink-0" />
              <span className="truncate">{contractor.phone}</span>
            </div>
          ) : (
            <span className="text-gray-400 text-sm">-</span>
          ),
        mobileLabel: "Phone",
        mobileRender: (contractor) =>
          contractor.phone ? (
            <div className="flex items-center gap-2 text-sm text-gray-700 min-w-0 w-full">
              <Phone className="h-4 w-4 text-gray-400 flex-shrink-0" />
              <span className="truncate min-w-0">{contractor.phone}</span>
            </div>
          ) : (
            <span className="text-gray-400 text-sm">-</span>
          ),
        hideOnMobile: true,
      },
    ],
    []
  );

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
            className="w-full pl-9 sm:pl-10 pr-9 sm:pr-10 py-2 sm:py-3 border border-primary-200 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500 text-sm sm:text-base text-primary-900 placeholder-gray-300"
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

      {/* Contractors Table */}
      <div className="p-4 sm:p-6">
        <DataTable<FavoriteContractorTable>
          data={filteredFavorites as FavoriteContractorTable[]}
          columns={columns}
          loading={loading}
          emptyMessage="No favorite contractors found"
          emptyIcon={<Heart className="h-16 w-16 text-gray-300 mx-auto" />}
          onRowClick={handleRowClick}
          hoverable
          getRowKey={(contractor) => contractor._id}
        />
      </div>

      {/* Profile View Modal */}
      {selectedContractor && (
        <ProfileViewModal
          user={selectedContractor}
          isOpen={profileModalOpen}
          onClose={() => {
            setProfileModalOpen(false);
            setSelectedContractor(null);
          }}
        />
      )}
    </div>
  );
};

export default FavoriteContractors;
