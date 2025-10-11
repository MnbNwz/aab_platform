import React, { useEffect, useState, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { RootState, AppDispatch } from "../../store";
import {
  fetchInvestmentOpportunitiesThunk,
  updateInvestmentOpportunityThunk,
  setFilters,
  clearFilters,
} from "../../store/slices/investmentOpportunitySlice";
import type {
  InvestmentOpportunity,
  InvestmentPropertyType,
  InvestmentStatus,
} from "../../types";
import Loader from "../ui/Loader";
import ConfirmModal from "../ui/ConfirmModal";
import {
  Building2,
  Plus,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  MapPin,
} from "lucide-react";
import {
  formatInvestmentPrice,
  getInvestmentStatusBadge,
  getPropertyTypeIcon,
  CANADIAN_PROVINCES,
} from "../../utils/investmentOpportunity";
import InvestmentOpportunityModal from "./InvestmentOpportunityModal";
import InvestmentOpportunityDetailsModal from "./InvestmentOpportunityDetailsModal";

const InvestmentOpportunitiesManagement: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { opportunities, loading, filters, pagination } = useSelector(
    (state: RootState) => state.investmentOpportunity
  );

  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<InvestmentStatus | "">(
    ""
  );
  const [selectedPropertyType, setSelectedPropertyType] = useState<
    InvestmentPropertyType | ""
  >("");
  const [selectedProvince, setSelectedProvince] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedOpportunity, setSelectedOpportunity] =
    useState<InvestmentOpportunity | null>(null);
  const [changeStatusModal, setChangeStatusModal] = useState<{
    open: boolean;
    opportunityId: string;
    newStatus: InvestmentStatus;
  }>({ open: false, opportunityId: "", newStatus: "available" });

  useEffect(() => {
    dispatch(fetchInvestmentOpportunitiesThunk(filters));
  }, [dispatch, filters]);

  const handleSearch = useCallback(() => {
    dispatch(
      setFilters({
        ...filters,
        search: searchTerm,
        page: 1,
      })
    );
  }, [dispatch, filters, searchTerm]);

  const handleApplyFilters = useCallback(() => {
    const newFilters: any = {
      page: 1,
    };
    if (selectedStatus) newFilters.status = selectedStatus;
    if (selectedPropertyType) newFilters.propertyType = selectedPropertyType;
    if (selectedProvince) newFilters.province = selectedProvince;
    if (maxPrice) newFilters.maxPrice = Number(maxPrice);

    dispatch(setFilters(newFilters));
    setShowFilters(false);
  }, [
    dispatch,
    selectedStatus,
    selectedPropertyType,
    selectedProvince,
    maxPrice,
  ]);

  const handleClearFilters = useCallback(() => {
    setSelectedStatus("");
    setSelectedPropertyType("");
    setSelectedProvince("");
    setMaxPrice("");
    setSearchTerm("");
    dispatch(clearFilters());
  }, [dispatch]);

  const handlePageChange = useCallback(
    (newPage: number) => {
      dispatch(setFilters({ ...filters, page: newPage }));
    },
    [dispatch, filters]
  );

  const handleViewDetails = useCallback(
    (opportunity: InvestmentOpportunity) => {
      setSelectedOpportunity(opportunity);
      setShowDetailsModal(true);
    },
    []
  );

  const handleEditFromModal = useCallback(() => {
    if (selectedOpportunity) {
      // Open edit modal (view modal stays open in background)
      setShowEditModal(true);
    }
  }, [selectedOpportunity]);

  const handleBackToView = useCallback(() => {
    // Just close edit modal, view modal is still open
    setShowEditModal(false);
  }, []);

  const handleStatusChangeFromModal = useCallback(
    (newStatus: InvestmentStatus) => {
      if (selectedOpportunity) {
        setChangeStatusModal({
          open: true,
          opportunityId: selectedOpportunity._id,
          newStatus,
        });
      }
    },
    [selectedOpportunity]
  );

  const confirmStatusChange = useCallback(async () => {
    // Create FormData with just the status field
    const formData = new FormData();
    formData.append("status", changeStatusModal.newStatus);

    await dispatch(
      updateInvestmentOpportunityThunk({
        id: changeStatusModal.opportunityId,
        updateData: formData,
      })
    );
    setChangeStatusModal({
      open: false,
      opportunityId: "",
      newStatus: "available",
    });
  }, [dispatch, changeStatusModal]);

  const renderStatusBadge = useCallback((status: InvestmentStatus) => {
    const { className, label } = getInvestmentStatusBadge(status);
    return (
      <span
        className={`px-3 py-1 rounded-full text-xs font-medium ${className}`}
      >
        {label}
      </span>
    );
  }, []);

  const renderPropertyTypeIcon = useCallback((type: InvestmentPropertyType) => {
    const IconComponent = getPropertyTypeIcon(type);
    return <IconComponent className="h-4 w-4" />;
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-primary-900">
              Off Market Properties
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Manage investment opportunities for contractors
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-accent-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-accent-600 transition flex items-center justify-center gap-2"
          >
            <Plus className="h-5 w-5" />
            <span>Create Opportunity</span>
          </button>
        </div>

        {/* Search and Filters */}
        <div className="mt-6 space-y-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Search by title, description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500"
              />
              <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            </div>
            <button
              onClick={handleSearch}
              className="bg-primary-700 text-white px-6 py-2 rounded-lg font-semibold hover:bg-primary-800 transition"
            >
              Search
            </button>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="bg-primary-800 text-white px-4 py-2 rounded-lg font-semibold hover:bg-primary-900 transition flex items-center justify-center gap-2"
            >
              <Filter className="h-5 w-5" />
              <span>Filters</span>
            </button>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="bg-gray-50 p-4 rounded-lg space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    value={selectedStatus}
                    onChange={(e) =>
                      setSelectedStatus(e.target.value as InvestmentStatus | "")
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-500"
                  >
                    <option value="">All Statuses</option>
                    <option value="available">Available</option>
                    <option value="under_offer">Under Offer</option>
                    <option value="sold">Sold</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Property Type
                  </label>
                  <select
                    value={selectedPropertyType}
                    onChange={(e) =>
                      setSelectedPropertyType(
                        e.target.value as InvestmentPropertyType | ""
                      )
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-500"
                  >
                    <option value="">All Types</option>
                    <option value="house">House</option>
                    <option value="duplex">Duplex</option>
                    <option value="triplex">Triplex</option>
                    <option value="sixplex">Sixplex</option>
                    <option value="land">Land</option>
                    <option value="commercial">Commercial</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Province
                  </label>
                  <select
                    value={selectedProvince}
                    onChange={(e) => setSelectedProvince(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-500"
                  >
                    <option value="">All Provinces</option>
                    {CANADIAN_PROVINCES.map((province) => (
                      <option key={province} value={province}>
                        {province}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Max Price ($)
                  </label>
                  <input
                    type="number"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    placeholder="∞"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-500"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleApplyFilters}
                  className="bg-accent-500 text-white px-6 py-2 rounded-lg font-semibold hover:bg-accent-600 transition"
                >
                  Apply Filters
                </button>
                <button
                  onClick={handleClearFilters}
                  className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg font-semibold hover:bg-gray-300 transition"
                >
                  Clear All
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Opportunities List */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <Loader size="large" color="accent" />
        </div>
      ) : !opportunities || opportunities.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <Building2 className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            No Investment Opportunities
          </h3>
          <p className="text-gray-600 mb-6">
            Get started by creating your first investment opportunity
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-accent-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-accent-600 transition"
          >
            Create First Opportunity
          </button>
        </div>
      ) : (
        <>
          {/* Desktop/Tablet Table View - Hidden on mobile */}
          <div className="hidden md:block bg-white rounded-lg shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Property
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Price
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ROI
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Interests
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {opportunities &&
                    opportunities.map((opportunity) => (
                      <tr
                        key={opportunity._id}
                        onClick={() => handleViewDetails(opportunity)}
                        className="hover:bg-gray-50 transition-colors cursor-pointer"
                      >
                        {/* Property */}
                        <td className="px-6 py-4">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {opportunity.title}
                            </div>
                            <div className="text-xs text-gray-500 capitalize flex items-center gap-1">
                              {renderPropertyTypeIcon(opportunity.propertyType)}
                              {opportunity.propertyType}
                            </div>
                          </div>
                        </td>

                        {/* Price */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-semibold text-gray-900">
                            {formatInvestmentPrice(opportunity.askingPrice)}
                          </div>
                        </td>

                        {/* ROI */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-semibold text-green-600">
                            {opportunity.projectedROI
                              ? `${opportunity.projectedROI}%`
                              : "-"}
                          </div>
                        </td>

                        {/* Status */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          {renderStatusBadge(opportunity.status)}
                        </td>

                        {/* Interests */}
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {opportunity.interestCount ||
                              opportunity.interests.length}
                          </span>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Card View - Visible only on mobile */}
          <div className="md:hidden space-y-4">
            {opportunities &&
              opportunities.map((opportunity) => (
                <div
                  key={opportunity._id}
                  onClick={() => handleViewDetails(opportunity)}
                  className="bg-white rounded-lg shadow-md overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
                >
                  {/* Property Image */}
                  {opportunity.photos && opportunity.photos.length > 0 ? (
                    <div className="h-48 overflow-hidden">
                      <img
                        src={opportunity.photos[0].url}
                        alt={opportunity.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="h-48 bg-gray-200 flex items-center justify-center">
                      <Building2 className="h-16 w-16 text-gray-400" />
                    </div>
                  )}

                  {/* Property Details */}
                  <div className="p-4">
                    {/* Title and Type */}
                    <div className="mb-3">
                      <h3 className="text-lg font-semibold text-primary-900 mb-2">
                        {opportunity.title}
                      </h3>
                      <div className="flex items-center gap-2 text-xs text-gray-500 capitalize">
                        {renderPropertyTypeIcon(opportunity.propertyType)}
                        <span>{opportunity.propertyType}</span>
                      </div>
                    </div>

                    {/* Location */}
                    {opportunity.location && (
                      <div className="flex items-center text-sm text-gray-600 mb-3">
                        <MapPin className="h-4 w-4 mr-1 flex-shrink-0" />
                        <span className="truncate">
                          {opportunity.location.city &&
                          opportunity.location.province
                            ? `${opportunity.location.city}, ${opportunity.location.province}`
                            : "Location available"}
                        </span>
                      </div>
                    )}

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div>
                        <span className="text-xs text-gray-600">Price</span>
                        <div className="text-base font-bold text-primary-900">
                          {formatInvestmentPrice(opportunity.askingPrice)}
                        </div>
                      </div>
                      <div>
                        <span className="text-xs text-gray-600">ROI</span>
                        <div className="text-base font-semibold text-green-600">
                          {opportunity.projectedROI
                            ? `${opportunity.projectedROI}%`
                            : "-"}
                        </div>
                      </div>
                    </div>

                    {/* Status and Interests */}
                    <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                      {renderStatusBadge(opportunity.status)}
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {opportunity.interestCount ||
                            opportunity.interests.length}{" "}
                          Interests
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
          </div>

          {/* Pagination */}
          {pagination && pagination.total > 0 && (
            <div className="bg-white rounded-lg shadow-md px-4 sm:px-6 py-3 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-sm text-gray-700">
                Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
                {Math.min(pagination.page * pagination.limit, pagination.total)}{" "}
                of {pagination.total}{" "}
                {pagination.total === 1 ? "opportunity" : "opportunities"}
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1 || loading}
                  className="p-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors duration-200"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="px-3 py-1 text-sm">
                  Page {pagination.page} of {pagination.pages}
                </span>
                <button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page === pagination.pages || loading}
                  className="p-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors duration-200"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Create/Edit Modal */}
      {(showCreateModal || showEditModal) && (
        <InvestmentOpportunityModal
          isOpen={showCreateModal || showEditModal}
          onClose={() => {
            setShowCreateModal(false);
            setShowEditModal(false);
            setSelectedOpportunity(null);
          }}
          opportunity={showEditModal ? selectedOpportunity : null}
          onBack={showEditModal ? handleBackToView : undefined}
        />
      )}

      {/* Details Modal */}
      {showDetailsModal && selectedOpportunity && (
        <InvestmentOpportunityDetailsModal
          isOpen={showDetailsModal}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedOpportunity(null);
          }}
          opportunityId={selectedOpportunity._id}
          onEdit={handleEditFromModal}
          onStatusChange={handleStatusChangeFromModal}
        />
      )}

      {/* Status Change Confirmation */}
      <ConfirmModal
        isOpen={changeStatusModal.open}
        onCancel={() =>
          setChangeStatusModal({
            open: false,
            opportunityId: "",
            newStatus: "available",
          })
        }
        onConfirm={confirmStatusChange}
        title="Confirm Status Change"
        message={`Are you sure you want to change the status to "${changeStatusModal.newStatus.replace(
          "_",
          " "
        )}"?`}
        confirmText="Confirm"
        cancelText="Cancel"
      />
    </div>
  );
};

export default InvestmentOpportunitiesManagement;
