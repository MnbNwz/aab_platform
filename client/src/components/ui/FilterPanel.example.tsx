import { useState } from "react";
import FilterPanel from "./FilterPanel";
import {
  FilterConfigs,
  createSelectFieldWithAll,
  createNumberField,
} from "./FilterPanel.utils";
import { useProvinces, SORT_OPTIONS } from "../../constants";

export const BillingHistoryFiltersSimplified = () => {
  const [filters, setFilters] = useState({
    status: "",
    type: "",
  });

  return (
    <FilterPanel
      mode="inline"
      fields={[
        FilterConfigs.paymentStatus(filters.status),
        FilterConfigs.paymentType(filters.type),
      ]}
      values={filters}
      onChange={(newFilters) => setFilters(newFilters as typeof filters)}
      showFilterIcon={true}
      columns={{ mobile: 1, tablet: 2, desktop: 2 }}
    />
  );
};

export const CustomFiltersWithHelpers = () => {
  const [filters, setFilters] = useState({
    role: "",
    status: "",
    maxPrice: "",
  });

  return (
    <FilterPanel
      mode="collapsible"
      fields={[
        FilterConfigs.userRole(filters.role),
        FilterConfigs.userApproval(filters.status),
        createNumberField(
          "maxPrice",
          "Max Price ($)",
          filters.maxPrice,
          "Enter amount"
        ),
      ]}
      values={filters}
      onChange={(newFilters) => setFilters(newFilters as typeof filters)}
      showApplyButton={true}
      showClearButton={true}
      columns={{ mobile: 1, tablet: 2, desktop: 3 }}
    />
  );
};

export const InvestmentOpportunitiesSimplified = () => {
  const [filters, setFilters] = useState({
    status: "",
    propertyType: "",
    province: "",
    maxPrice: "",
  });

  // Use memoized provinces from constants
  const provinces = useProvinces(true); // common provinces only

  return (
    <FilterPanel
      mode="inline"
      fields={[
        FilterConfigs.investmentStatus(filters.status),
        FilterConfigs.propertyType(filters.propertyType),
        createSelectFieldWithAll(
          "province",
          "Province",
          provinces,
          filters.province
        ),
        createNumberField("maxPrice", "Max Price ($)", filters.maxPrice, "∞"),
      ]}
      values={filters}
      onChange={(newFilters) => setFilters(newFilters as typeof filters)}
      showFilterIcon={true}
      columns={{ mobile: 1, tablet: 2, desktop: 4 }}
    />
  );
};

export const UserManagementSimplified = () => {
  const [filters, setFilters] = useState({
    role: "",
    status: "",
    approval: "",
    sortBy: "createdAt",
  });

  return (
    <FilterPanel
      mode="collapsible"
      fields={[
        FilterConfigs.userRole(filters.role),
        FilterConfigs.userApproval(filters.approval),
        FilterConfigs.investmentStatus(filters.status),
        createSelectFieldWithAll(
          "sortBy",
          "Sort By",
          SORT_OPTIONS,
          filters.sortBy
        ),
      ]}
      values={filters}
      onChange={(newFilters) => setFilters(newFilters as typeof filters)}
      columns={{ mobile: 1, tablet: 2, desktop: 4 }}
    />
  );
};
