import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "../store";
import PropertyManagementTable from "./dashboard/PropertyManagementTable";
import PropertyFormModal from "./dashboard/PropertyFormModal";
import RenovationCalculator from "./RenovationCalculator";

interface MyPropertiesProps {
  userRole: string;
}

const MyProperties: React.FC<MyPropertiesProps> = ({ userRole }) => {
  if (userRole !== "admin" && userRole !== "customer") return null;

  const [propertyModalOpen, setPropertyModalOpen] = useState(false);
  const [createOptionsModalOpen, setCreateOptionsModalOpen] = useState(false);
  const [calculatorOpen, setCalculatorOpen] = useState(false);
  const [calculatorData, setCalculatorData] = useState<any>(null);
  const [filter, setFilter] = useState<"all" | "active" | "inactive">("all");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // Get properties from Redux store instead of local state
  const { properties } = useSelector((state: RootState) => state.property);

  // Reset filters on component unmount
  useEffect(() => {
    return () => {
      setFilter("all");
      setSortOrder("asc");
      setSearch("");
      setPage(1);
    };
  }, []);

  const handleCreateNew = () => {
    // For customers, show options modal
    if (userRole === "customer") {
      setCreateOptionsModalOpen(true);
    } else {
      // For admin, directly open property form
      setPropertyModalOpen(true);
    }
  };

  const handleCalculatorOption = () => {
    setCreateOptionsModalOpen(false);
    setCalculatorOpen(true);
  };

  const handleCalculatorComplete = (data: any) => {
    setCalculatorData(data);
    setCalculatorOpen(false);
    setPropertyModalOpen(true);
  };

  const handleCustomPropertyOption = () => {
    setCreateOptionsModalOpen(false);
    setPropertyModalOpen(true);
  };

  return (
    <div>
      <PropertyManagementTable
        filter={filter}
        setFilter={setFilter}
        sortOrder={sortOrder}
        setSortOrder={setSortOrder}
        search={search}
        setSearch={setSearch}
        properties={properties as any}
        page={page}
        setPage={setPage}
        pageSize={pageSize}
        onCreateNew={handleCreateNew}
      />

      {/* Create Options Modal for Customers */}
      {userRole === "customer" && createOptionsModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-2 xs:p-4"
          onClick={() => setCreateOptionsModalOpen(false)}
        >
          <div
            className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-auto p-4 xs:p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg xs:text-xl font-semibold text-gray-900 mb-3 xs:mb-4">
              Create
            </h2>
            <p className="text-xs xs:text-sm text-gray-600 mb-4 xs:mb-6">
              Choose how you want to create your property:
            </p>

            <div className="space-y-2 xs:space-y-3">
              <button
                onClick={handleCalculatorOption}
                className="w-full flex items-center justify-between p-3 xs:p-4 border-2 border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-all duration-200"
              >
                <div className="text-left flex-1">
                  <div className="font-semibold text-gray-900 text-sm xs:text-base">
                    Create through Cost Calculator
                  </div>
                  <div className="text-xs xs:text-sm text-gray-600 mt-1">
                    Calculate costs and create property automatically
                  </div>
                </div>
                <svg
                  className="w-4 h-4 xs:w-5 xs:h-5 text-gray-400 ml-2 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>

              <button
                onClick={handleCustomPropertyOption}
                className="w-full flex items-center justify-between p-3 xs:p-4 border-2 border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-all duration-200"
              >
                <div className="text-left flex-1">
                  <div className="font-semibold text-gray-900 text-sm xs:text-base">
                    Create Custom Property
                  </div>
                  <div className="text-xs xs:text-sm text-gray-600 mt-1">
                    Manually enter property details
                  </div>
                </div>
                <svg
                  className="w-4 h-4 xs:w-5 xs:h-5 text-gray-400 ml-2 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>
            </div>

            <button
              onClick={() => setCreateOptionsModalOpen(false)}
              className="w-full mt-3 xs:mt-4 px-4 py-2 text-sm xs:text-base text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-200"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <RenovationCalculator
        isOpen={calculatorOpen}
        onClose={() => setCalculatorOpen(false)}
        onComplete={handleCalculatorComplete}
      />

      <PropertyFormModal
        isOpen={propertyModalOpen}
        onClose={() => {
          setPropertyModalOpen(false);
          setCalculatorData(null);
        }}
        onSave={() => {
          setPropertyModalOpen(false);
          setCalculatorData(null);
        }}
        initialData={calculatorData}
      />
    </div>
  );
};

export default MyProperties;
