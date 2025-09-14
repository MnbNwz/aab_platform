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

  const handleSearch = async () => {
    try {
      const res = await searchPropertiesApi(search);
      setSearchResults(res.data || []);
    } catch (e) {
      setSearchResults([]);
    }
  };
  const filtered = (searchResults ?? properties)
    .filter((p) => {
      if (filter === "all") return true;
      return filter === "active" ? p.isActive : !p.isActive;
    })
    .filter((p) => p.title.toLowerCase().includes(search.toLowerCase()));

  const sorted = [...filtered].sort((a, b) => {
    if (sortOrder === "asc") return a.title.localeCompare(b.title);
    return b.title.localeCompare(a.title);
  });

  // Pagination logic
  const total = sorted.length;
  const totalPages = Math.ceil(total / pageSize);
  const paginated = sorted.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="bg-white rounded-lg shadow mt-2 md:mt-0">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 md:gap-4 flex-wrap">
          <h2 className="text-xl font-semibold text-green-600 text-center md:text-left">
            My Properties
          </h2>
          <div className="flex flex-col w-full gap-2 md:flex-row md:items-center md:gap-4 md:w-auto md:space-x-0">
            {/* Filters and search row */}
            <div className="flex flex-row w-full gap-2 md:w-auto md:flex-1">
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-lg w-28 flex-shrink-0"
              >
                <option value="all">All</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>

              <div className="relative flex-grow w-full">
                <input
                  type="text"
                  placeholder="Search properties..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full md:w-auto pl-3 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500"
                />
              </div>
            </div>
            {/* Button row: right-aligned on md+, next line on mobile */}
            <div className="flex md:flex-1 md:justify-end">
              {search.trim() === "" ? (
                <button
                  className="bg-accent-500 text-white px-4 py-2 rounded font-semibold hover:bg-accent-600 transition w-full md:w-auto mt-2 md:mt-0"
                  onClick={onCreateNew}
                >
                  Create
                </button>
              ) : (
                <button
                  className="bg-accent-500 text-white px-4 py-2 rounded font-semibold hover:bg-accent-600 transition w-full md:w-auto mt-2 md:mt-0 disabled:opacity-50"
                  onClick={handleSearch}
                  disabled={loading}
                >
                  Search
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 md:px-6 md:py-3 text-center font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                Title
              </th>
              <th className="px-3 py-2 md:px-6 md:py-3 text-center font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                Type
              </th>
              <th className="px-3 py-2 md:px-6 md:py-3 text-center font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                Status
              </th>
              <th className="px-3 py-2 md:px-6 md:py-3 text-center font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                Action
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={4} className="py-12">
                  <div className="flex justify-center items-center w-full h-full">
                    <Loader size="large" color="accent" />
                  </div>
                </td>
              </tr>
            ) : (
              <>
                {paginated.map((property) => (
                  <tr
                    key={property._id}
                    className={`hover:bg-gray-50 ${
                      !property.isActive ? "opacity-60" : ""
                    }`}
                  >
                    <td className="px-3 py-2 md:px-6 md:py-4 font-semibold text-gray-900 max-w-[10rem] truncate text-center">
                      {property.title}
                    </td>
                    <td className="px-3 py-2 md:px-6 md:py-4 text-gray-700 whitespace-nowrap text-center">
                      {property.propertyType}
                    </td>
                    <td className="px-3 py-2 md:px-6 md:py-4 text-center">
                      <span
                        className={`px-2 py-1 rounded text-xs font-bold ${
                          property.isActive
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {property.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-3 py-2 md:px-6 md:py-4 text-gray-700 whitespace-nowrap text-center">
                      <button
                        className="text-blue-600 hover:underline mr-2"
                        onClick={() => {
                          // Map property to Property type if needed
                          // Ensure property matches Property type for modal
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
                      {"|  "}
                      <button
                        className={`text-red-600 ${
                          property.isActive
                            ? "hover:underline cursor-pointer"
                            : "opacity-50 cursor-not-allowed"
                        } `}
                        disabled={!property.isActive}
                        tabIndex={property.isActive ? 0 : -1}
                        style={
                          !property.isActive
                            ? {
                                pointerEvents: "none",
                                filter: "grayscale(0.5)",
                                background: "rgba(0,0,0,0.02)",
                              }
                            : {}
                        }
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
                          if (confirmInactiveId)
                            handleSetInactive(confirmInactiveId);
                        }}
                      />
                    </td>
                  </tr>
                ))}
                {paginated.length === 0 && (
                  <tr>
                    <td colSpan={4} className="text-center text-gray-500 py-8">
                      No properties found.
                    </td>
                  </tr>
                )}
              </>
            )}
          </tbody>
        </table>
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-3 md:px-6 py-3 border-t border-gray-200 flex flex-col md:flex-row items-center justify-between gap-2 text-xs md:text-sm">
            <div className="text-gray-700">
              Showing {(page - 1) * pageSize + 1} to{" "}
              {Math.min(page * pageSize, total)} of {total} properties
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
                className="p-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                &lt;
              </button>
              <span className="px-2 md:px-3 py-1">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage(page + 1)}
                disabled={page === totalPages}
                className="p-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                &gt;
              </button>
            </div>
          </div>
        )}
      </div>
      {/* Property View Modal */}
      <PropertyViewModal
        isOpen={viewModalOpen}
        onClose={() => {
          setViewModalOpen(false);
          setViewProperty(null);
        }}
        property={viewProperty}
      />
    </div>
  );
};

export default PropertyManagementTable;
