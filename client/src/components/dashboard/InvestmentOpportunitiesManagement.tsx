import React, { useEffect, useState, useCallback, useMemo, memo } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { RootState, AppDispatch } from "../../store";
import {
  fetchInvestmentOpportunitiesThunk,
  updateInvestmentOpportunityThunk,
  setFilters,
} from "../../store/slices/investmentOpportunitySlice";
import type {
  InvestmentOpportunity,
  InvestmentPropertyType,
  InvestmentStatus,
} from "../../types";
import ConfirmModal from "../ui/ConfirmModal";
import FilterPanel from "../ui/FilterPanel";
import {
  FilterConfigs,
  createSelectFieldWithAll,
  createNumberField,
} from "../ui/FilterPanel.utils";
import { Plus } from "lucide-react";
import {
  formatInvestmentPrice,
  getInvestmentStatusBadge,
  getPropertyTypeIcon,
} from "../../utils/investmentOpportunity";
import { useProvinces } from "../../constants";
import InvestmentOpportunityModal from "./InvestmentOpportunityModal";
import InvestmentOpportunityDetailsModal from "./InvestmentOpportunityDetailsModal";
import DataTable, { TableColumn } from "../ui/DataTable";
import type { PaginationInfo } from "../ui/DataTable";

const InvestmentOpportunitiesManagement: React.FC = memo(() => {
  const dispatch = useDispatch<AppDispatch>();
  const { opportunities, loading, filters, pagination } = useSelector(
    (state: RootState) => state.investmentOpportunity
  );

  // Use memoized provinces from constants
  const provinces = useProvinces(true); // common provinces only

  const [statusFilter, setStatusFilter] = useState<string>("");
  const [propertyTypeFilter, setPropertyTypeFilter] = useState<string>("");
  const [provinceFilter, setProvinceFilter] = useState<string>("");
  const [maxPriceFilter, setMaxPriceFilter] = useState<string>("");
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

  // Reset page to 1 when filters change
  useEffect(() => {
    dispatch(
      setFilters({
        page: 1,
        limit: 10,
        status: (statusFilter || undefined) as InvestmentStatus | undefined,
        propertyType: (propertyTypeFilter || undefined) as
          | InvestmentPropertyType
          | undefined,
        province: provinceFilter || undefined,
        maxPrice: maxPriceFilter ? Number(maxPriceFilter) : undefined,
      })
    );
  }, [
    dispatch,
    statusFilter,
    propertyTypeFilter,
    provinceFilter,
    maxPriceFilter,
  ]);

  // Fetch data when filters change
  useEffect(() => {
    dispatch(fetchInvestmentOpportunitiesThunk(filters));
  }, [dispatch, filters]);

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

  // Memoized columns
  const columns = useMemo<
    TableColumn<InvestmentOpportunity & Record<string, unknown>>[]
  >(
    () => [
      {
        key: "property",
        header: "Property",
        render: (opportunity) => (
          <div>
            <div className="text-sm font-medium text-gray-900">
              {opportunity.title}
            </div>
            <div className="text-xs text-gray-500 capitalize flex items-center gap-1">
              {renderPropertyTypeIcon(opportunity.propertyType)}
              {opportunity.propertyType}
            </div>
          </div>
        ),
        mobileLabel: "Property",
        mobileRender: (opportunity) => (
          <div className="mb-3">
            <h3 className="text-sm font-semibold text-gray-900 truncate">
              {opportunity.title}
            </h3>
            <div className="text-xs text-gray-500 truncate">
              {opportunity.propertyType}
            </div>
          </div>
        ),
      },
      {
        key: "price",
        header: "Price",
        render: (opportunity) => (
          <div className="text-sm font-semibold text-gray-900">
            {formatInvestmentPrice(opportunity.askingPrice)}
          </div>
        ),
        mobileLabel: "Price",
        mobileRender: (opportunity) => (
          <div className="flex justify-between items-center">
            <span className="text-gray-500">Price:</span>
            <span className="font-medium text-gray-900">
              {formatInvestmentPrice(opportunity.askingPrice)}
            </span>
          </div>
        ),
      },
      {
        key: "roi",
        header: "ROI",
        render: (opportunity) => (
          <div className="text-sm font-semibold text-green-600">
            {opportunity.projectedROI ? `${opportunity.projectedROI}%` : "-"}
          </div>
        ),
        mobileLabel: "ROI",
        mobileRender: (opportunity) => (
          <div className="flex justify-between items-center">
            <span className="text-gray-500">ROI:</span>
            <span className="font-medium text-green-600">
              {opportunity.projectedROI ? `${opportunity.projectedROI}%` : "-"}
            </span>
          </div>
        ),
      },
      {
        key: "status",
        header: "Status",
        render: (opportunity) => renderStatusBadge(opportunity.status),
        mobileLabel: "Status",
        mobileRender: (opportunity) => (
          <div className="flex justify-between items-center">
            <span className="text-gray-500">Status:</span>
            {renderStatusBadge(opportunity.status)}
          </div>
        ),
      },
      {
        key: "interests",
        header: "Interests",
        render: (opportunity) => (
          <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            {opportunity.interestCount || opportunity.interests.length}
          </span>
        ),
        mobileLabel: "Interests",
        mobileRender: (opportunity) => (
          <div className="flex justify-between items-center">
            <span className="text-gray-500">Interests:</span>
            <span className="font-medium text-gray-900">
              {opportunity.interestCount || opportunity.interests.length}
            </span>
          </div>
        ),
      },
    ],
    [renderStatusBadge, renderPropertyTypeIcon]
  );

  // Pagination info
  const paginationInfo = useMemo<PaginationInfo | undefined>(() => {
    if (!pagination || pagination.total === 0) return undefined;
    return {
      currentPage: pagination.page,
      totalPages: pagination.pages,
      totalCount: pagination.total,
      limit: pagination.limit,
      hasNextPage: pagination.page < pagination.pages,
      hasPrevPage: pagination.page > 1,
    };
  }, [pagination]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-primary-200">
        <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
                Off Market Properties
              </h2>
              <p className="text-sm text-gray-500 mt-1">
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
        </div>

        {/* Filters */}
        <FilterPanel
          mode="inline"
          fields={[
            FilterConfigs.investmentStatus(statusFilter),
            FilterConfigs.propertyType(propertyTypeFilter),
            createSelectFieldWithAll(
              "province",
              "Province",
              provinces,
              provinceFilter
            ),
            createNumberField(
              "maxPrice",
              "Max Price ($)",
              maxPriceFilter,
              "Enter max price"
            ),
          ]}
          values={{
            status: statusFilter,
            propertyType: propertyTypeFilter,
            province: provinceFilter,
            maxPrice: maxPriceFilter,
          }}
          onChange={(newValues) => {
            setStatusFilter(newValues.status || "");
            setPropertyTypeFilter(newValues.propertyType || "");
            setProvinceFilter(newValues.province || "");
            setMaxPriceFilter(newValues.maxPrice || "");
          }}
          showFilterIcon={true}
          columns={{ mobile: 1, tablet: 2, desktop: 4 }}
        />
      </div>

      {/* Opportunities List */}
      <div className="bg-white rounded-lg shadow-sm border border-primary-200">
        <DataTable<InvestmentOpportunity & Record<string, unknown>>
          data={
            (opportunities || []) as (InvestmentOpportunity &
              Record<string, unknown>)[]
          }
          columns={columns}
          loading={loading}
          emptyMessage={
            statusFilter ||
            propertyTypeFilter ||
            provinceFilter ||
            maxPriceFilter
              ? "No opportunities match the selected filters."
              : "Get started by creating your first investment opportunity"
          }
          emptyIcon={<div className="text-gray-400 text-4xl mb-4">🏢</div>}
          onRowClick={handleViewDetails}
          pagination={paginationInfo}
          onPageChange={handlePageChange}
          paginationLabel={({ startItem, endItem, totalCount }) =>
            `Showing ${startItem} to ${endItem} of ${totalCount} results`
          }
          getRowKey={(opportunity) => opportunity._id}
          hoverable
        />
      </div>

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
});

InvestmentOpportunitiesManagement.displayName =
  "InvestmentOpportunitiesManagement";

export default InvestmentOpportunitiesManagement;
