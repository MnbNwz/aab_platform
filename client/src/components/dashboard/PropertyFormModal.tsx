import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "../../store";
import { createPropertyThunk } from "../../store/thunks/propertyThunks";
import LocationSelector from "../LocationSelector";
import { MapPin } from "lucide-react";

interface PropertyFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
}

const initialState = {
  title: "",
  propertyType: "apartment",
  location: { type: "Point", coordinates: [0, 0], address: "" },
  area: 0,
  areaUnit: "sqft",
  totalRooms: 0,
  bedrooms: 0,
  bathrooms: 0,
  kitchens: 0,
  description: "",
  images: [""],
  isActive: true,
};

const PropertyFormModal: React.FC<PropertyFormProps> = ({
  isOpen,
  onClose,
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const { loading, error } = useSelector((state: RootState) => state.property);
  const [form, setForm] = useState(initialState);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [imageError, setImageError] = useState<string>("");
  const [formError, setFormError] = useState<string>("");

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    if (name === "isActive") {
      const checked = (e.target as HTMLInputElement).checked;
      setForm((prev) => ({ ...prev, isActive: checked }));
    } else if (name === "area" || name === "areaUnit") {
      setForm((prev) => ({
        ...prev,
        [name]: name === "area" ? Number(value) : value,
      }));
    } else if (name.startsWith("location.")) {
      const idx = name.endsWith("0") ? 0 : 1;
      setForm((prev) => ({
        ...prev,
        location: {
          ...prev.location,
          coordinates:
            idx === 0
              ? [Number(value), prev.location.coordinates[1]]
              : [prev.location.coordinates[0], Number(value)],
        },
      }));
    } else if (
      ["totalRooms", "bedrooms", "bathrooms", "kitchens"].includes(name)
    ) {
      setForm((prev) => ({ ...prev, [name]: Number(value) }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  // Remove image from carousel
  const handleRemoveImage = (idx: number) => {
    const newFiles = imageFiles.filter((_, i) => i !== idx);
    setImageFiles(newFiles);
    setCarouselIndex((prev) => (prev > 0 ? prev - 1 : 0));
    setForm((prev) => ({ ...prev, images: newFiles.map(() => "") }));
  };

  // When picking new images, replace all
  const handleReplaceImages = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    if (files.length > 15) {
      setImageError("You can only select up to 15 images.");
      return;
    }
    const validImages = files.filter((file) => file.type.startsWith("image/"));
    if (validImages.length !== files.length) {
      setImageError("Only image files are allowed.");
      return;
    }
    setImageFiles(validImages);
    setCarouselIndex(0);
    setImageError("");
    setForm((prev) => ({ ...prev, images: validImages.map(() => "") }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    // Validation: area must be > 0, location must have valid lat/lng
    const [lng, lat] = form.location.coordinates;
    if (!form.area || form.area <= 0) {
      setFormError("Area must be greater than zero.");
      return;
    }
    if (!lng || !lat) {
      setFormError("Please select a valid location on the map.");
      return;
    }
    // Attach images to form data
    const submitData = {
      ...form,
      images: imageFiles,
      propertyType: form.propertyType as "apartment" | "house" | "villa",
      areaUnit: form.areaUnit as "sqft" | "sqm" | "marla" | "kanal",
      location: {
        ...form.location,
        type: "Point" as const,
        coordinates: [
          Number(form.location.coordinates[0]) || 0,
          Number(form.location.coordinates[1]) || 0,
        ] as [number, number],
      },
    };

    await dispatch(createPropertyThunk(submitData))
      .unwrap()
      .then(() => {
        setForm(initialState);
        setImageFiles([]);
        onClose();
      })
      .catch(() => {
        // error handled by redux state
      });
  };

  useEffect(() => {
    if (!isOpen) {
      setForm(initialState);
      setImageFiles([]);
      setCarouselIndex(0);
      setImageError("");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const getInputClassName = () =>
    "w-full rounded-lg px-3 py-2 sm:py-3 border border-primary-300 bg-white text-primary-900 focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-accent-500 text-sm sm:text-base";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="bg-white rounded-lg shadow-2xl w-full max-w-4xl mx-auto relative flex flex-col max-h-[95vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-primary-200">
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-primary-900">
            Create New Property
          </h2>
          <button
            className="text-primary-400 hover:text-primary-600 text-2xl sm:text-3xl font-bold p-2"
            onClick={onClose}
          >
            &#10005;
          </button>
        </div>
        {/* Form Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              <div>
                <label className="block text-primary-700 font-medium mb-1 text-sm sm:text-base">
                  Title
                </label>
                <input
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                  required
                  className={getInputClassName()}
                />
              </div>
              <div>
                <label className="block text-primary-900 font-medium mb-1">
                  Type
                </label>
                <select
                  name="propertyType"
                  value={form.propertyType}
                  onChange={handleChange}
                  required
                  className={getInputClassName() + " appearance-none"}
                >
                  <option value="apartment">Apartment</option>
                  <option value="house">House</option>
                  <option value="villa">Villa</option>
                </select>
              </div>
              {/* Address field removed */}
              <div className="md:col-span-2">
                <label className="block text-primary-900 font-medium mb-1">
                  Location
                </label>
                <div>
                  <button
                    type="button"
                    onClick={() => setShowLocationModal(true)}
                    className="w-full flex items-center justify-between rounded-lg px-4 py-3 border border-primary-200 bg-primary-50 text-primary-900 hover:bg-primary-100 transition-colors"
                  >
                    <span className="text-left">
                      {form.location.coordinates[1] !== 0 ||
                      form.location.coordinates[0] !== 0
                        ? `${form.location.coordinates[1].toFixed(
                            6
                          )}, ${form.location.coordinates[0].toFixed(6)}`
                        : "Choose on Map"}
                    </span>
                    <span className="text-accent-500">
                      <MapPin className="h-5 w-5" />
                    </span>
                  </button>
                </div>
                <LocationSelector
                  isOpen={showLocationModal}
                  onClose={() => setShowLocationModal(false)}
                  onLocationSelect={({ lat, lng }) => {
                    setForm((prev) => ({
                      ...prev,
                      location: {
                        ...prev.location,
                        coordinates: [lng, lat],
                      },
                    }));
                    setShowLocationModal(false);
                  }}
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-primary-900 font-medium mb-1">
                  Area
                </label>
                <div className="flex gap-2">
                  <input
                    name="area"
                    type="number"
                    min={0}
                    value={form.area}
                    onChange={handleChange}
                    className={getInputClassName() + " w-1/2"}
                    placeholder="Enter area"
                    required
                  />
                  <select
                    name="areaUnit"
                    value={form.areaUnit}
                    onChange={handleChange}
                    required
                    className={getInputClassName() + " w-1/2 appearance-none"}
                  >
                    <option value="sqft">Square Feet (sqft)</option>
                    <option value="sqm">Square Meters (sqm)</option>
                    <option value="marla">Marla</option>
                    <option value="kanal">Kanal</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-primary-900 font-medium mb-1">
                  Total Rooms
                </label>
                <input
                  name="totalRooms"
                  type="number"
                  value={form.totalRooms}
                  onChange={handleChange}
                  className={getInputClassName()}
                />
              </div>
              <div>
                <label className="block text-primary-900 font-medium mb-1">
                  Bedrooms
                </label>
                <input
                  name="bedrooms"
                  type="number"
                  value={form.bedrooms}
                  onChange={handleChange}
                  className={getInputClassName()}
                />
              </div>
              <div>
                <label className="block text-primary-900 font-medium mb-1">
                  Bathrooms
                </label>
                <input
                  name="bathrooms"
                  type="number"
                  value={form.bathrooms}
                  onChange={handleChange}
                  className={getInputClassName()}
                />
              </div>
              <div>
                <label className="block text-primary-900 font-medium mb-1">
                  Kitchens
                </label>
                <input
                  name="kitchens"
                  type="number"
                  value={form.kitchens}
                  onChange={handleChange}
                  className={getInputClassName()}
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-primary-900 font-medium mb-1">
                  Description
                </label>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  rows={2}
                  required
                  className={getInputClassName()}
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-primary-900 font-medium mb-1">
                  Images (max 15)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  required
                  onChange={handleReplaceImages}
                  className={
                    getInputClassName() +
                    " file:bg-accent-500 file:text-white file:rounded file:px-2 file:py-1 file:text-sm file:font-semibold file:border-0 file:mr-2 file:cursor-pointer file:hover:bg-accent-600"
                  }
                />
                {imageError && (
                  <div className="text-red-500 text-xs mt-1">{imageError}</div>
                )}
                {imageFiles.length > 0 && (
                  <div className="mt-4 flex flex-col items-center">
                    <div className="relative w-full max-w-xl flex items-center justify-center bg-primary-100 rounded-lg overflow-hidden py-4">
                      <button
                        type="button"
                        className="absolute left-2 top-1/2 -translate-y-1/2 bg-white bg-opacity-70 rounded-full p-1 shadow"
                        onClick={() =>
                          setCarouselIndex((prev) => Math.max(prev - 1, 0))
                        }
                        disabled={carouselIndex === 0}
                      >
                        &#8592;
                      </button>
                      <div className="flex gap-4 w-full justify-center">
                        {imageFiles
                          .slice(carouselIndex, carouselIndex + 3)
                          .map((file, idx) => (
                            <div
                              key={carouselIndex + idx}
                              className="relative w-32 h-24 flex-shrink-0"
                            >
                              <img
                                src={URL.createObjectURL(file)}
                                alt={`Selected ${carouselIndex + idx + 1}`}
                                className="object-contain w-full h-full rounded border border-primary-200"
                              />
                              <button
                                type="button"
                                className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-7 h-7 flex items-center justify-center shadow hover:bg-red-600 transition-colors border-2 border-white"
                                style={{ aspectRatio: "1/1" }}
                                onClick={() =>
                                  handleRemoveImage(carouselIndex + idx)
                                }
                              >
                                <span className="text-lg leading-none">
                                  &times;
                                </span>
                              </button>
                            </div>
                          ))}
                      </div>
                      <button
                        type="button"
                        className="absolute right-2 top-1/2 -translate-y-1/2 bg-white bg-opacity-70 rounded-full p-1 shadow"
                        onClick={() =>
                          setCarouselIndex((prev) =>
                            Math.min(prev + 1, imageFiles.length - 3)
                          )
                        }
                        disabled={
                          carouselIndex >= imageFiles.length - 3 ||
                          imageFiles.length <= 3
                        }
                      >
                        &#8594;
                      </button>
                    </div>
                    <div className="mt-2 text-xs text-primary-700">
                      Showing {carouselIndex + 1} -{" "}
                      {Math.min(carouselIndex + 3, imageFiles.length)} of{" "}
                      {imageFiles.length}
                    </div>
                  </div>
                )}
              </div>
              {/* Active checkbox removed: property is always active by default */}
            </div>
            <div className="pt-4 sm:pt-6">
              <button
                type="submit"
                className="w-full px-4 py-2 sm:py-3 rounded-lg bg-accent-500 text-white font-semibold hover:bg-accent-600 transition-colors disabled:opacity-60 text-sm sm:text-base"
                disabled={loading}
              >
                {loading ? "Creating Property..." : "Create Property"}
              </button>
              {(formError || error) && (
                <div className="text-red-500 text-center mt-2 text-sm">
                  {formError || error}
                </div>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PropertyFormModal;
