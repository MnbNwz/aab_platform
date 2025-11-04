import React, { useState, useEffect } from "react";
import { X, ChevronLeft, ChevronRight, Check } from "lucide-react";

interface RenovationCalculatorProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (calculatorData: any) => void;
}

type RoomType = "kitchen" | "bathroom" | "flooring" | null;

interface CalculatorData {
  roomType: RoomType;
  dimensions: {
    width: number;
    length: number;
    squareFeet: number;
  };
  kitchen?: {
    cabinets: {
      type: "melamine" | "wood" | null;
      length: number;
    };
    countertop: {
      type: "quartz" | "marble" | "ceramic" | "laminate" | null;
    };
    backsplash: {
      material: string;
      squareFeet: number;
    };
    flooring: {
      type: "ceramic" | "wood" | "laminate" | "vinyl" | null;
      tileSize: string;
    };
    island: {
      hasIsland: boolean;
      width: number;
      length: number;
    };
    sink: "single" | "double" | null;
    otherWork: {
      painting: boolean;
      drywall: boolean;
      plumbing: boolean;
    };
  };
  bathroom?: {
    bathtub: "standard" | "podium" | null;
    shower: {
      size: "30x30" | "30x60" | "custom" | null;
      glassType: "fully_glass" | "partial_wall" | "sliding_glass" | null;
    };
    vanity: {
      size: number;
      countertopType: "quartz" | "granite" | null;
    };
    toilet: boolean;
    flooring: {
      heated: boolean;
      material: "ceramic" | "vinyl" | "other" | null;
    };
    otherWork: {
      painting: boolean;
      drywall: boolean;
      plumbing: boolean;
    };
  };
  flooringOnly?: {
    material: "hardwood" | "ceramic" | "laminate" | "vinyl" | null;
    additionalOptions: {
      refinishing: boolean;
      subfloorRepair: boolean;
    };
  };
}

const RenovationCalculator: React.FC<RenovationCalculatorProps> = ({
  isOpen,
  onClose,
  onComplete,
}) => {
  const [step, setStep] = useState(1);
  const [calculatorData, setCalculatorData] = useState<CalculatorData>({
    roomType: null,
    dimensions: {
      width: 0,
      length: 0,
      squareFeet: 0,
    },
  });

  const baseRate = parseFloat(
    import.meta.env.VITE_BASE_RENOVATION_RATE || "50"
  );

  const totalSteps = 3; // Room Type, Dimensions, Review

  // Reset calculator when modal closes
  useEffect(() => {
    if (!isOpen) {
      setStep(1);
      setCalculatorData({
        roomType: null,
        dimensions: {
          width: 0,
          length: 0,
          squareFeet: 0,
        },
      });
    }
  }, [isOpen]);

  const handleDimensionChange = (field: "width" | "length", value: string) => {
    const numValue = parseFloat(value) || 0;
    const newDimensions = {
      ...calculatorData.dimensions,
      [field]: numValue,
    };
    newDimensions.squareFeet = newDimensions.width * newDimensions.length;

    setCalculatorData({
      ...calculatorData,
      dimensions: newDimensions,
    });
  };

  const calculateEstimate = (): number => {
    const { dimensions } = calculatorData;
    const total = dimensions.squareFeet * baseRate;
    return total;
  };

  const handleNext = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      // Final step - complete and pass data to property form
      const estimate = calculateEstimate();

      // Map calculator data to PropertyFormModal fields
      const propertyData = {
        title: `${calculatorData.roomType
          ?.charAt(0)
          .toUpperCase()}${calculatorData.roomType?.slice(1)} Renovation`,
        propertyType: "apartment", // Can be customized in the form
        location: { type: "Point", coordinates: [0, 0], address: "" }, // User will set this
        area: calculatorData.dimensions.squareFeet,
        areaUnit: "sqft",
        totalRooms: 0, // User will set this
        bedrooms: 0,
        bathrooms: calculatorData.roomType === "bathroom" ? 1 : 0,
        kitchens: calculatorData.roomType === "kitchen" ? 1 : 0,
        description: `Renovation project for ${
          calculatorData.roomType
        }. Estimated cost: $${estimate.toFixed(2)}. Room size: ${
          calculatorData.dimensions.width
        } × ${
          calculatorData.dimensions.length
        } ft (${calculatorData.dimensions.squareFeet.toFixed(2)} sq ft).`,
        images: [""],
        isActive: true,
        estimatedCost: estimate, // Custom field for reference
        calculatorData: calculatorData, // Store original calculator data
      };

      onComplete(propertyData);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const canProceed = () => {
    if (step === 1) return calculatorData.roomType !== null;
    if (step === 2)
      return (
        calculatorData.dimensions.width > 0 &&
        calculatorData.dimensions.length > 0
      );
    return true;
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-2 xs:p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-2xl mx-auto my-4 flex flex-col max-h-[95vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 xs:p-6 border-b border-gray-200">
          <div className="flex-1">
            <h2 className="text-lg xs:text-xl font-semibold text-gray-900">
              Renovation Calculator
            </h2>
            <p className="text-xs xs:text-sm text-gray-600 mt-1">
              Step {step} of {totalSteps}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5 xs:h-6 xs:w-6" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="px-4 xs:px-6 pt-4">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-accent-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(step / totalSteps) * 100}%` }}
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 xs:p-6">
          {/* Step 1: Room Type */}
          {step === 1 && (
            <div className="space-y-4">
              <h3 className="text-base xs:text-lg font-semibold text-gray-900 mb-4">
                Select Room Type
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { value: "kitchen", label: "Kitchen", icon: "🍳" },
                  { value: "bathroom", label: "Bathroom", icon: "🚿" },
                  { value: "flooring", label: "Flooring Only", icon: "📐" },
                ].map((room) => (
                  <button
                    key={room.value}
                    onClick={() =>
                      setCalculatorData({
                        ...calculatorData,
                        roomType: room.value as RoomType,
                      })
                    }
                    className={`p-4 border-2 rounded-lg text-left transition-all duration-200 ${
                      calculatorData.roomType === room.value
                        ? "border-accent-500 bg-accent-50"
                        : "border-gray-200 hover:border-accent-300"
                    }`}
                  >
                    <div className="text-2xl mb-2">{room.icon}</div>
                    <div className="font-semibold text-gray-900 text-sm xs:text-base">
                      {room.label}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Room Dimensions */}
          {step === 2 && (
            <div className="space-y-4">
              <h3 className="text-base xs:text-lg font-semibold text-gray-900 mb-4">
                Enter Room Size
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Width (feet)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={calculatorData.dimensions.width || ""}
                    onChange={(e) =>
                      handleDimensionChange("width", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500 placeholder-gray-300"
                    placeholder="e.g., 10"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Length (feet)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={calculatorData.dimensions.length || ""}
                    onChange={(e) =>
                      handleDimensionChange("length", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500 placeholder-gray-300"
                    placeholder="e.g., 12"
                  />
                </div>
              </div>
              {calculatorData.dimensions.squareFeet > 0 && (
                <div className="mt-4 p-4 bg-accent-50 rounded-lg border border-accent-200">
                  <p className="text-sm text-gray-700">
                    Total Square Footage:{" "}
                    <span className="font-semibold text-accent-700">
                      {calculatorData.dimensions.squareFeet.toFixed(2)} sq ft
                    </span>
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Review & Estimate */}
          {step === 3 && (
            <div className="space-y-4">
              <h3 className="text-base xs:text-lg font-semibold text-gray-900 mb-4">
                Review & Estimate
              </h3>
              <div className="space-y-3">
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700">
                      Room Type:
                    </span>
                    <span className="text-sm text-gray-900 capitalize">
                      {calculatorData.roomType}
                    </span>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700">
                      Room Size:
                    </span>
                    <span className="text-sm text-gray-900">
                      {calculatorData.dimensions.width} ×{" "}
                      {calculatorData.dimensions.length} ft (
                      {calculatorData.dimensions.squareFeet.toFixed(2)} sq ft)
                    </span>
                  </div>
                </div>

                <div className="p-4 bg-accent-50 rounded-lg border-2 border-accent-200">
                  <div className="flex justify-between items-center">
                    <span className="text-base font-semibold text-gray-900">
                      Estimated Cost:
                    </span>
                    <span className="text-xl font-bold text-accent-700">
                      ${calculateEstimate().toFixed(2)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 mt-2">
                    * This is an estimate. Final pricing may vary.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-3 xs:p-4 sm:p-6 border-t border-gray-200 gap-2 xs:gap-3">
          <button
            onClick={handleBack}
            disabled={step === 1}
            className="flex items-center px-3 xs:px-4 py-2 text-xs xs:text-sm font-semibold text-gray-700 bg-white border-2 border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
          >
            <ChevronLeft className="h-3 w-3 xs:h-4 xs:w-4 mr-1" />
            <span className="hidden xs:inline">Back</span>
          </button>

          <button
            onClick={handleNext}
            disabled={!canProceed()}
            className="flex items-center px-3 xs:px-4 py-2 text-xs xs:text-sm font-medium text-white bg-accent-500 rounded-lg hover:bg-accent-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {step === totalSteps ? (
              <>
                <Check className="h-3 w-3 xs:h-4 xs:w-4 mr-1" />
                Complete
              </>
            ) : (
              <>
                <span className="hidden xs:inline">Next</span>
                <span className="xs:hidden">Next</span>
                <ChevronRight className="h-3 w-3 xs:h-4 xs:w-4 ml-1" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RenovationCalculator;
