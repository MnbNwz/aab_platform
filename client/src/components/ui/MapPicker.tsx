import React, { useState } from "react";
import { MapPin, Search } from "lucide-react";

interface MapPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectLocation: (lat: number, lng: number) => void;
  initialLocation?: { lat: number; lng: number };
}

export const MapPicker: React.FC<MapPickerProps> = ({
  isOpen,
  onClose,
  onSelectLocation,
  initialLocation,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);

  const handleSearch = async () => {
    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
          searchQuery
        )}.json?access_token=YOUR_MAPBOX_TOKEN&limit=5`
      );
      const data = await response.json();
      setSearchResults(data.features || []);
    } catch (error) {
      console.error("Error searching locations:", error);
    }
  };

  const handleSelectPlace = (feature: any) => {
    const [lng, lat] = feature.center;
    onSelectLocation(lat, lng);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Fixed Header */}
        <div className="p-6 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Select Location
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500 text-2xl"
            >
              ×
            </button>
          </div>

          {/* Search Box */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleSearch();
                  }
                }}
                placeholder="Search for a location..."
                className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-500"
              />
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            </div>
            <button
              onClick={handleSearch}
              disabled={!searchQuery.trim()}
              className="px-4 py-2 bg-accent-500 text-white rounded-lg hover:bg-accent-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Search
            </button>
          </div>
        </div>

        {/* Scrollable Search Results */}
        <div className="flex-1 overflow-y-auto">
          {searchResults.length > 0 ? (
            <div className="p-4">
              <h4 className="text-sm font-medium text-gray-700 mb-3">
                Search Results:
              </h4>
              <div className="space-y-1">
                {searchResults.map((result) => (
                  <button
                    key={result.id}
                    onClick={() => handleSelectPlace(result)}
                    className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 transition-colors rounded-lg group"
                  >
                    <MapPin className="h-5 w-5 text-accent-500 group-hover:scale-110 transition-transform flex-shrink-0" />
                    <div className="text-left flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">
                        {result.place_name}
                      </p>
                      <p className="text-sm text-gray-500 truncate">
                        {result.place_type.join(", ")}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-gray-500">
              <MapPin className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p className="text-lg font-medium mb-1">Search for a location</p>
              <p className="text-sm">
                Enter a place name or address above to get started
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MapPicker;
