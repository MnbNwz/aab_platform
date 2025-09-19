import React, { useState } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useLocationSearch, useMapClickGeocoding } from "../hooks/useGeocoding";

// Fix for default markers in Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

interface LocationSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onLocationSelect: (location: {
    lat: number;
    lng: number;
    address: string;
  }) => void;
}

interface Location {
  lat: number;
  lng: number;
  address: string;
}

// Component to handle map clicks
const MapClickHandler: React.FC<{
  onLocationChange: (location: Location) => void;
}> = ({ onLocationChange }) => {
  const { handleMapClick } = useMapClickGeocoding();

  useMapEvents({
    click: async (e) => {
      const { lat, lng } = e.latlng;
      const result = await handleMapClick(lat, lng);
      if (result) {
        onLocationChange(result);
      }
    },
  });

  return null;
};

const LocationSelector: React.FC<LocationSelectorProps> = ({
  isOpen,
  onClose,
  onLocationSelect,
}) => {
  const [selectedLocation, setSelectedLocation] = useState<Location>({
    lat: 43.6532,
    lng: -79.3832,
    address: "Toronto, ON, Canada",
  });
  const [searchQuery, setSearchQuery] = useState("");

  // Use the unified location search hook
  const {
    results: searchResults,
    loading: isLoading,
    search,
    clearResults,
  } = useLocationSearch();

  // Search for locations using the unified utility
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    await search(searchQuery, 5);

    // Auto-select first result if available
    if (searchResults.length > 0) {
      setSelectedLocation(searchResults[0]);
    }
  };

  const handleLocationChange = (location: Location) => {
    setSelectedLocation(location);
    clearResults();
  };

  const handleConfirm = () => {
    onLocationSelect(selectedLocation);
    onClose();
  };

  const selectSearchResult = (location: Location) => {
    setSelectedLocation(location);
    clearResults();
    setSearchQuery("");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        <div className="p-6 border-b border-gray-200 flex-shrink-0">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Select Location
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ×
            </button>
          </div>

          <div className="relative">
            <div className="flex gap-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                placeholder="Search for a location (e.g., Toronto, New York, London)..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                disabled={isLoading}
              />
              <button
                onClick={handleSearch}
                disabled={isLoading || !searchQuery.trim()}
                className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? "Searching..." : "Search"}
              </button>
            </div>

            {/* Search Results Dropdown */}
            {searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 bg-white border border-gray-300 rounded-md shadow-lg mt-1 z-10 max-h-48 overflow-y-auto">
                {searchResults.map((result, index) => (
                  <button
                    key={index}
                    onClick={() => selectSearchResult(result)}
                    className="w-full px-3 py-2 text-left hover:bg-gray-100 border-b border-gray-100 last:border-b-0"
                  >
                    <div className="text-sm font-medium text-gray-900 truncate">
                      {result.address}
                    </div>
                    <div className="text-xs text-gray-500">
                      {result.lat.toFixed(4)}, {result.lng.toFixed(4)}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="w-full h-64 sm:h-80 md:h-96 rounded-lg border overflow-hidden">
            <MapContainer
              center={[selectedLocation.lat, selectedLocation.lng]}
              zoom={13}
              style={{ height: "100%", width: "100%" }}
              key={`${selectedLocation.lat}-${selectedLocation.lng}`}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <Marker position={[selectedLocation.lat, selectedLocation.lng]} />
              <MapClickHandler onLocationChange={handleLocationChange} />
            </MapContainer>
          </div>

          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">
              Selected Location:
            </h4>
            <p className="text-sm text-gray-600 mb-1">
              {selectedLocation.address}
            </p>
            <p className="text-xs text-gray-500">
              Coordinates: {selectedLocation.lat.toFixed(6)},{" "}
              {selectedLocation.lng.toFixed(6)}
            </p>
          </div>

          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-700">
              💡 <strong>Tip:</strong> Click anywhere on the map to select a
              location, or use the search box above.
            </p>
          </div>
        </div>

        {/* Fixed Footer with Action Buttons */}
        <div className="p-6 border-t border-gray-200 flex-shrink-0">
          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
            >
              Confirm Location
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LocationSelector;
