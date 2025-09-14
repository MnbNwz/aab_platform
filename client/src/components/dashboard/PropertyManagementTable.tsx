import { ChevronDown } from "lucide-react";
import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "../../store";
import { getMyPropertiesThunk } from "../../store/thunks/propertyThunks";
import { searchPropertiesApi } from "../../services/propertyService";
// Placeholder for property data type
interface Property {
  _id: string;
  title: string;
  propertyType: string;
  location: { type: string; coordinates: [number, number] };
  dimensions: { length: number; width: number };
  totalRooms: number;
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
  setSortOrder,
  search,
  setSearch,
  properties: _propsProperties, // unused, now from redux
  page,
  setPage,
  pageSize,
  onCreateNew,
}) => {
  const dispatch = useDispatch<AppDispatch>();
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

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <span className="text-accent-500 text-lg font-semibold">
          Loading properties...
        </span>
      </div>
    );
  }

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
              {/* <div className="relative w-32 flex-shrink-0">
                <select
                  value={sortOrder || ""}
                  onChange={(e) => setSortOrder(e.target.value as any)}
                  className="appearance-none px-3 py-2 border border-gray-300 rounded-lg pr-8 text-gray-700 font-medium w-full"
                >
                  <option value="" disabled hidden>
                    Sort By
                  </option>
                  <option value="asc">Ascending</option>
                  <option value="desc">Descending</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-3 h-4 w-4 text-gray-400" />
              </div> */}
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
              <th className="px-3 py-2 md:px-6 md:py-3 text-left font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                Title
              </th>
              <th className="px-3 py-2 md:px-6 md:py-3 text-left font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                Type
              </th>
              {/* Address column removed */}
              <th className="px-3 py-2 md:px-6 md:py-3 text-left font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                Rooms
              </th>
              <th className="px-3 py-2 md:px-6 md:py-3 text-left font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {paginated.map((property) => (
              <tr key={property._id} className="hover:bg-gray-50">
                <td className="px-3 py-2 md:px-6 md:py-4 font-semibold text-gray-900 max-w-[10rem] truncate">
                  {property.title}
                </td>
                <td className="px-3 py-2 md:px-6 md:py-4 text-gray-700 whitespace-nowrap">
                  {property.propertyType}
                </td>
                {/* Address cell removed */}
                <td className="px-3 py-2 md:px-6 md:py-4 text-gray-700 whitespace-nowrap">
                  {property.totalRooms}
                </td>
                <td className="px-3 py-2 md:px-6 md:py-4">
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
              </tr>
            ))}
            {paginated.length === 0 && (
              <tr>
                <td colSpan={4} className="text-center text-gray-500 py-8">
                  No properties found.
                </td>
              </tr>
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
    </div>
  );
};

export default PropertyManagementTable;
