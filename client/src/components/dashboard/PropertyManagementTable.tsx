import React, { useState, useEffect } from "react";
import Loader from "../ui/Loader";
import ConfirmModal from "../ui/ConfirmModal";
import PropertyViewModal from "./PropertyViewModal";
import { useDispatch, useSelector } from "react-redux";
import type { RootState, AppDispatch } from "../../store";
import { getMyPropertiesThunk } from "../../store/thunks/propertyThunks";
import { setPropertyInactiveThunk } from "../../store/thunks/propertyThunks";
import { searchPropertiesApi } from "../../services/propertyService";

interface Property {
  _id: string;
  title: string;
  propertyType: string;
  location: { type: string; coordinates: [number, number] };
  dimensions: { length: number; width: number };
  bedrooms: number;
  bathrooms: number;
  kitchens: number;
  description: string;
  images: string[];
  isActive: boolean;
}

interface PropertyManagementTableProps {
  filter: "all" | "active" | "inactive";
  setFilter: React.Dispatch<
    React.SetStateAction<"all" | "active" | "inactive">
  >;
  sortOrder: "asc" | "desc";
  setSortOrder: React.Dispatch<React.SetStateAction<"asc" | "desc">>;
  search: string;
  setSearch: React.Dispatch<React.SetStateAction<string>>;
  properties: Property[];
  page: number;
  setPage: React.Dispatch<React.SetStateAction<number>>;
  pageSize: number;
  onCreateNew: () => void;
}

const PropertyManagementTable: React.FC<PropertyManagementTableProps> = ({
  filter,
  setFilter,
  sortOrder,
  search,
  setSearch,
  properties: _propsProperties,
  page,
  setPage,
  pageSize,
  onCreateNew,
}) => {
  const dispatch = useDispatch<AppDispatch>();

  const [confirmInactiveId, setConfirmInactiveId] = useState<string | null>(
    null
  );
  const [inactiveLoading, setInactiveLoading] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [viewProperty, setViewProperty] = useState<Property | null>(null);

  const handleSetInactive = async (id: string) => {
    setInactiveLoading(true);
    await dispatch(setPropertyInactiveThunk(id));
    setInactiveLoading(false);
    setConfirmInactiveId(null);
  };
  const { properties, loading } = useSelector(
    (state: RootState) => state.property
  );
  const [searchResults, setSearchResults] = useState<Property[] | null>(null);

  useEffect(() => {
    dispatch(getMyPropertiesThunk());
  }, [dispatch]);

  const [searchLoading, setSearchLoading] = useState(false);
  const handleSearch = async () => {
    setSearchLoading(true);
    try {
      const res = await searchPropertiesApi(search);
      setSearchResults(res.data.properties || []);
    } catch (e) {
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };
  const filtered = (searchResults ?? properties).filter((p) => {
    if (filter === "all") return true;
    return filter === "active" ? p.isActive : !p.isActive;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sortOrder === "asc") return a.title.localeCompare(b.title);
    return b.title.localeCompare(a.title);
  });

  // Pagination logic
  const total = sorted.length;
  const totalPages = Math.ceil(total / pageSize);
  const paginated = sorted.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Controls Header */}
      <div className="p-4 sm:p-6 border-b border-gray-200">
        <div className="space-y-3 sm:space-y-0 sm:flex sm:items-center sm:justify-between sm:gap-4">
          {/* Filters and Search */}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 sm:flex-1 lg:max-w-2xl">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
              className="px-3 py-2 md:py-3 lg:py-2 border border-gray-300 rounded-lg w-full sm:w-24 md:w-28 lg:w-24 flex-shrink-0 text-sm md:text-base lg:text-sm"
            >
              <option value="all">All</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>

            <div className="relative flex-1 md:flex-[2] lg:flex-1 lg:max-w-md">
              <input
                type="text"
                placeholder="Search properties..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  if (e.target.value.trim() === "") setSearchResults(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    if (search.trim() === "") {
                      onCreateNew();
                    } else {
                      handleSearch();
                    }
                  }
                }}
                className="w-full pl-3 pr-4 py-2 md:py-3 lg:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500 text-sm md:text-base lg:text-sm"
              />
            </div>
          </div>

          {/* Action Button */}
          <div className="flex justify-center sm:justify-end">
            {search.trim() === "" ? (
              <button
                className="bg-accent-500 text-white px-4 py-2 md:py-3 lg:py-2 rounded font-semibold hover:bg-accent-600 transition w-full sm:w-auto text-sm md:text-base lg:text-sm"
                onClick={onCreateNew}
              >
                Create
              </button>
            ) : (
              <button
                className="bg-accent-500 text-white px-4 py-2 md:py-3 lg:py-2 rounded font-semibold hover:bg-accent-600 transition w-full sm:w-auto disabled:opacity-50 text-sm md:text-base lg:text-sm"
                onClick={handleSearch}
                disabled={loading || searchLoading}
              >
                Search
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="block lg:hidden">
        {loading || searchLoading ? (
          <div className="py-12">
            <div className="flex justify-center items-center w-full h-full">
              <Loader size="large" color="accent" />
            </div>
          </div>
        ) : (
          <div className="space-y-3 p-4">
            {paginated.map((property) => (
              <div
                key={property._id}
                className={`bg-white border border-gray-200 rounded-lg p-4 shadow-sm ${
                  !property.isActive ? "opacity-60" : ""
                }`}
              >
                <div className="flex justify-between items-start mb-3 gap-2">
                  <h3 className="font-semibold text-gray-900 text-sm flex-1 min-w-0">
                    <span className="block truncate" title={property.title}>
                      {property.title.length > 30
                        ? `${property.title.substring(0, 30)}...`
                        : property.title}
                    </span>
                  </h3>
                  <span
                    className={`px-2 py-1 rounded text-xs font-bold flex-shrink-0 ${
                      property.isActive
                        ? "bg-green-100 text-green-700"
                        : "bg-orange-100 text-orange-700"
                    }`}
                  >
                    {property.isActive ? "Active" : "Inactive"}
                  </span>
                </div>

                <div className="text-sm text-gray-600 mb-3">
                  <span className="font-medium">Type:</span>{" "}
                  <span
                    className="truncate block"
                    title={property.propertyType}
                  >
                    {property.propertyType.length > 25
                      ? `${property.propertyType.substring(0, 25)}...`
                      : property.propertyType}
                  </span>
                </div>

                <div className="flex gap-2">
                  <button
                    className="flex-1 bg-accent-50 text-accent-600 px-3 py-2 rounded text-sm font-medium hover:bg-accent-100 transition"
                    onClick={() => {
                      const mapped = {
                        ...property,
                        dimensions: (property as any).dimensions || {
                          length: 0,
                          width: 0,
                        },
                        isActive:
                          typeof property.isActive === "boolean"
                            ? property.isActive
                            : true,
                        images: (property.images || []).filter(
                          (img: any) => typeof img === "string"
                        ),
                      };
                      setViewProperty(mapped as Property);
                      setViewModalOpen(true);
                    }}
                  >
                    View Details
                  </button>
                  <button
                    className={`flex-1 px-3 py-2 rounded text-sm font-medium transition ${
                      property.isActive
                        ? "bg-orange-100 text-orange-800 hover:bg-orange-200"
                        : "bg-gray-100 text-gray-400 cursor-not-allowed"
                    }`}
                    disabled={!property.isActive}
                    onClick={() => {
                      if (
                        property.isActive &&
                        typeof property._id === "string"
                      ) {
                        setConfirmInactiveId(property._id);
                      }
                    }}
                  >
                    Set Inactive
                  </button>
                </div>
              </div>
            ))}
            {paginated.length === 0 && (
              <div className="text-center text-gray-500 py-8">
                No properties found.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Desktop Table View */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">
                Title
              </th>
              <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">
                Type
              </th>
              <th className="px-6 py-3 text-center font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-center font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading || searchLoading ? (
              <tr>
                <td colSpan={4} className="py-12">
                  <div className="flex justify-center items-center w-full h-full">
                    <Loader size="large" color="accent" />
                  </div>
                </td>
              </tr>
            ) : paginated.length === 0 ? (
              <tr>
                <td colSpan={4} className="text-center text-gray-500 py-8">
                  No properties found.
                </td>
              </tr>
            ) : (
              paginated.map((property) => (
                <tr
                  key={property._id}
                  className={`hover:bg-gray-50 ${
                    !property.isActive ? "opacity-60" : ""
                  }`}
                >
                  <td className="px-6 py-4 font-semibold text-gray-900 max-w-xs">
                    <span className="block truncate" title={property.title}>
                      {property.title.length > 40
                        ? `${property.title.substring(0, 40)}...`
                        : property.title}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-700">
                    {property.propertyType}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span
                      className={`px-2 py-1 rounded text-xs font-bold ${
                        property.isActive
                          ? "bg-green-100 text-green-700"
                          : "bg-orange-100 text-orange-700"
                      }`}
                    >
                      {property.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex justify-center gap-2">
                      <button
                        className="text-accent-600 hover:underline text-sm"
                        onClick={() => {
                          const mapped = {
                            ...property,
                            dimensions: (property as any).dimensions || {
                              length: 0,
                              width: 0,
                            },
                            isActive:
                              typeof property.isActive === "boolean"
                                ? property.isActive
                                : true,
                            images: (property.images || []).filter(
                              (img: any) => typeof img === "string"
                            ),
                          };
                          setViewProperty(mapped as Property);
                          setViewModalOpen(true);
                        }}
                      >
                        View
                      </button>
                      <span className="text-primary-300">|</span>
                      <button
                        className={`text-sm ${
                          property.isActive
                            ? "text-orange-600 hover:underline cursor-pointer"
                            : "text-gray-400 cursor-not-allowed"
                        }`}
                        disabled={!property.isActive}
                        onClick={() => {
                          if (
                            property.isActive &&
                            typeof property._id === "string"
                          ) {
                            setConfirmInactiveId(property._id);
                          }
                        }}
                      >
                        Inactive
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Confirm Modal for Inactive */}
      <ConfirmModal
        isOpen={!!confirmInactiveId}
        title="Set Property Inactive?"
        message="Do you want to set this property as inactive?"
        confirmText="Confirm"
        cancelText="Cancel"
        loading={inactiveLoading}
        onCancel={() => setConfirmInactiveId(null)}
        onConfirm={() => {
          if (confirmInactiveId) handleSetInactive(confirmInactiveId);
        }}
      />
      {/* Pagination */}
      {total > 0 && (
        <div className="px-4 sm:px-6 py-4 border-t border-gray-200">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-sm text-gray-700 order-2 sm:order-1">
              Showing {(page - 1) * pageSize + 1} to{" "}
              {Math.min(page * pageSize, total)} of {total} properties
            </div>
            <div className="flex items-center gap-2 order-1 sm:order-2">
              <button
                onClick={() => setPage(page - 1)}
                disabled={page === 1 || totalPages <= 1}
                className="px-3 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 text-sm font-medium min-w-[44px]"
              >
                Previous
              </button>
              <div className="flex items-center gap-1">
                {totalPages > 1 ? (
                  Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (page <= 3) {
                      pageNum = i + 1;
                    } else if (page >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = page - 2 + i;
                    }

                    return (
                      <button
                        key={pageNum}
                        onClick={() => setPage(pageNum)}
                        className={`px-3 py-2 text-sm font-medium rounded-lg min-w-[40px] ${
                          page === pageNum
                            ? "bg-accent-500 text-white"
                            : "text-gray-700 hover:bg-gray-100"
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })
                ) : (
                  <span className="px-3 py-2 text-sm font-medium text-gray-500">
                    Page 1 of 1
                  </span>
                )}
              </div>
              <button
                onClick={() => setPage(page + 1)}
                disabled={page === totalPages || totalPages <= 1}
                className="px-3 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 text-sm font-medium min-w-[44px]"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Property View Modal */}
      {viewModalOpen && (
        <PropertyViewModal
          isOpen={viewModalOpen}
          onClose={() => {
            setViewModalOpen(false);
            setViewProperty(null);
          }}
          property={viewProperty}
        />
      )}
    </div>
  );
};

export default PropertyManagementTable;
