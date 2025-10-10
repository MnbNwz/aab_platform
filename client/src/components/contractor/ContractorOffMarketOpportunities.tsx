import React, { useEffect, useState, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { RootState, AppDispatch } from "../../store";
import {
  fetchInvestmentOpportunitiesThunk,
  setFilters,
  clearFilters,
  expressInterestThunk,
  withdrawInterestThunk,
} from "../../store/slices/investmentOpportunitySlice";
import type {
  InvestmentOpportunity,
  InvestmentPropertyType,
  InvestmentStatus,
} from "../../types";
import Loader from "../ui/Loader";
import {
  Building2,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Lock,
  CheckCircle,
  MapPin,
  Heart,
} from "lucide-react";
import {
  formatInvestmentPrice,
  getInvestmentStatusBadge,
  getPropertyTypeIcon,
  CANADIAN_PROVINCES,
} from "../../utils/investmentOpportunity";
import InvestmentOpportunityDetailsModal from "../dashboard/InvestmentOpportunityDetailsModal";
import { membershipService } from "../../services/membershipService";
import { showToast } from "../../utils/toast";

const ContractorOffMarketOpportunities: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { opportunities, loading, filters, pagination } = useSelector(
    (state: RootState) => state.investmentOpportunity
  );
  const currentMembership = useSelector(
    (state: RootState) => state.membership.current
  );
  const { plans } = useSelector((state: RootState) => state.membership);

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
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedOpportunity, setSelectedOpportunity] =
    useState<InvestmentOpportunity | null>(null);
  const [upgradeLoading, setUpgradeLoading] = useState(false);
  const [togglingInterest, setTogglingInterest] = useState<string | null>(null);

  // Check if user has premium access
  const hasPremiumAccess =
    currentMembership &&
    currentMembership.status === "active" &&
    currentMembership.planId.tier === "premium";

  useEffect(() => {
    // Only fetch data if user has premium access
    if (!hasPremiumAccess) return;

    dispatch(fetchInvestmentOpportunitiesThunk(filters));
  }, [dispatch, filters, hasPremiumAccess]);

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

  const handleUpgradeClick = useCallback(async () => {
    setUpgradeLoading(true);

    try {
      // Find the premium plan for contractors
      const premiumPlan = plans.find(
        (plan: any) => plan.tier === "premium" && plan.userType === "contractor"
      );

      if (!premiumPlan) {
        showToast.error("Premium plan not found. Please contact support.");
        return;
      }

      // Create checkout session - default to monthly billing
      const checkoutPayload = {
        planId: premiumPlan._id,
        billingPeriod: "monthly" as const,
        url: `${window.location.origin}/membership/success`,
      };

      const response = await membershipService.checkout(checkoutPayload);

      if (response.success && response.data?.url) {
        // Redirect to Stripe checkout
        window.location.href = response.data.url;
      } else {
        throw new Error("No checkout URL received");
      }
    } catch (error) {
      console.error("Checkout error:", error);
      // Error is already handled by the service with toast
    } finally {
      setUpgradeLoading(false);
    }
  }, [plans]);

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

  const handleToggleInterest = useCallback(
    async (e: React.MouseEvent, opportunity: InvestmentOpportunity) => {
      e.stopPropagation(); // Prevent opening details modal

      if (togglingInterest === opportunity._id) return; // Prevent double-click

      setTogglingInterest(opportunity._id);

      try {
        // Check if user has already expressed interest
        const hasInterest = opportunity.hasExpressedInterest;

        if (hasInterest) {
          // Withdraw interest
          await dispatch(withdrawInterestThunk(opportunity._id));
        } else {
          // Express interest
          await dispatch(expressInterestThunk({ id: opportunity._id }));
        }

        // Refresh the list to get updated data
        dispatch(fetchInvestmentOpportunitiesThunk(filters));
      } catch (error) {
        console.error("Error toggling interest:", error);
      } finally {
        setTogglingInterest(null);
      }
    },
    [dispatch, togglingInterest, filters]
  );

  // Premium Gate
  if (!hasPremiumAccess) {
    return (
      <div className="space-y-6">
        {/* Premium Feature Banner */}
        <div className="bg-gradient-to-r from-primary-800 to-primary-900 rounded-lg shadow-lg p-6 text-white border border-accent-500/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="bg-accent-500/20 p-3 rounded-full">
                <Lock className="h-8 w-8 text-accent-500" />
              </div>
              <div>
                <h3 className="text-2xl font-bold mb-1 text-white">
                  Premium Feature
                </h3>
                <p className="text-white/90">
                  Unlock exclusive off-market investment opportunities
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Teaser Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow-md p-6 text-center border border-primary-200">
            <div className="text-4xl font-bold text-accent-500 mb-2">15+</div>
            <p className="text-primary-800">Available Properties</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6 text-center border border-primary-200">
            <div className="text-4xl font-bold text-accent-500 mb-2">12%</div>
            <p className="text-primary-800">Average ROI</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6 text-center border border-primary-200">
            <div className="text-4xl font-bold text-accent-500 mb-2">$450K</div>
            <p className="text-primary-800">Average Price</p>
          </div>
        </div>

        {/* Blurred Preview Cards */}
        <div>
          <h3 className="text-xl font-bold text-primary-900 mb-4">
            What You're Missing Out On
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {[1, 2, 3].map((index) => (
              <div
                key={index}
                className="bg-white rounded-lg shadow-md overflow-hidden relative"
              >
                {/* Blur Overlay */}
                <div className="absolute inset-0 backdrop-blur-sm bg-white/30 z-10 flex items-center justify-center">
                  <div className="bg-primary-900/90 text-white px-6 py-3 rounded-lg text-center">
                    <Lock className="h-6 w-6 mx-auto mb-2" />
                    <p className="font-semibold">Premium Only</p>
                  </div>
                </div>

                {/* Blurred Content */}
                <div className="h-48 bg-gray-200 flex items-center justify-center">
                  <Building2 className="h-16 w-16 text-gray-400" />
                </div>
                <div className="p-4">
                  <div className="h-6 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-3"></div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-400">Price</span>
                      <span className="font-bold text-gray-400">$XXX,XXX</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-400">ROI</span>
                      <span className="font-semibold text-gray-400">XX%</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Benefits Section */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold text-primary-900 mb-4">
            Premium Benefits for Off-Market Access
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <CheckCircle className="h-6 w-6 text-accent-500 flex-shrink-0 mt-1" />
              <div>
                <h4 className="font-semibold text-primary-900">
                  Exclusive Properties
                </h4>
                <p className="text-sm text-primary-700">
                  Access investment opportunities before they hit the market
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="h-6 w-6 text-accent-500 flex-shrink-0 mt-1" />
              <div>
                <h4 className="font-semibold text-primary-900">
                  High ROI Potential
                </h4>
                <p className="text-sm text-primary-700">
                  Properties with 10-15% projected return on investment
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="h-6 w-6 text-accent-500 flex-shrink-0 mt-1" />
              <div>
                <h4 className="font-semibold text-primary-900">
                  Direct Communication
                </h4>
                <p className="text-sm text-primary-700">
                  Express interest and connect directly with property owners
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="h-6 w-6 text-accent-500 flex-shrink-0 mt-1" />
              <div>
                <h4 className="font-semibold text-primary-900">
                  Detailed Information
                </h4>
                <p className="text-sm text-primary-700">
                  Full property details, photos, documents, and renovation needs
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="bg-gradient-to-r from-accent-500 to-accent-600 rounded-lg shadow-lg p-8 text-white text-center">
          <h3 className="text-2xl font-bold mb-3">
            Ready to Unlock Premium Features?
          </h3>
          <p className="text-white/90 mb-6 max-w-2xl mx-auto">
            Upgrade to premium membership and get access to exclusive off-market
            properties, priority job access, featured listing, and much more!
          </p>
          <button
            onClick={handleUpgradeClick}
            disabled={upgradeLoading}
            className="bg-white text-accent-500 px-8 py-3 rounded-lg font-bold hover:bg-primary-50 hover:text-accent-600 transition text-lg shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {upgradeLoading ? "Loading..." : "Upgrade to Premium Now"}
          </button>
        </div>
      </div>
    );
  }

  // Premium Content
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
              Browse exclusive investment opportunities
            </p>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="mt-6 space-y-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Search by title, location, description..."
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
          <p className="text-gray-600">
            No off-market properties available at the moment. Check back soon!
          </p>
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
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Interested?
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

                        {/* Interested? - Heart Icon */}
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <button
                            onClick={(e) =>
                              handleToggleInterest(e, opportunity)
                            }
                            disabled={togglingInterest === opportunity._id}
                            className="group relative inline-flex items-center justify-center transition-transform hover:scale-110 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                            title={
                              opportunity.hasExpressedInterest
                                ? "Withdraw Interest"
                                : "Express Interest"
                            }
                          >
                            <Heart
                              className={`h-6 w-6 transition-all duration-300 ${
                                opportunity.hasExpressedInterest
                                  ? "fill-red-500 text-red-500 animate-pulse"
                                  : "text-gray-400 hover:text-red-400 hover:fill-red-100"
                              } ${
                                togglingInterest === opportunity._id
                                  ? "animate-ping"
                                  : ""
                              }`}
                            />
                          </button>
                        </td>

                        {/* Interests */}
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {opportunity.interestCount ||
                              opportunity.interests?.length ||
                              0}
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
                  className="bg-white rounded-lg shadow-md overflow-hidden cursor-pointer hover:shadow-lg transition-shadow relative"
                >
                  {/* Heart Button - Floating on top right */}
                  <button
                    onClick={(e) => handleToggleInterest(e, opportunity)}
                    disabled={togglingInterest === opportunity._id}
                    className="absolute top-3 right-3 z-10 bg-white rounded-full p-2 shadow-lg transition-transform hover:scale-110 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                    title={
                      opportunity.hasExpressedInterest
                        ? "Withdraw Interest"
                        : "Express Interest"
                    }
                  >
                    <Heart
                      className={`h-6 w-6 transition-all duration-300 ${
                        opportunity.hasExpressedInterest
                          ? "fill-red-500 text-red-500 animate-pulse"
                          : "text-gray-600 hover:text-red-400 hover:fill-red-100"
                      } ${
                        togglingInterest === opportunity._id
                          ? "animate-ping"
                          : ""
                      }`}
                    />
                  </button>

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
                            opportunity.interests?.length ||
                            0}{" "}
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

      {/* Details Modal */}
      {showDetailsModal && selectedOpportunity && (
        <InvestmentOpportunityDetailsModal
          isOpen={showDetailsModal}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedOpportunity(null);
          }}
          opportunityId={selectedOpportunity._id}
          // Don't pass onEdit and onStatusChange for contractors (view-only)
        />
      )}
    </div>
  );
};

export default ContractorOffMarketOpportunities;
