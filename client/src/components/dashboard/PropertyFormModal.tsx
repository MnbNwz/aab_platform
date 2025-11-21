import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "../../store";
import { createPropertyThunk } from "../../store/thunks/propertyThunks";
import LocationSelector from "../LocationSelector";
import { MapPin, X, Plus } from "lucide-react";
import {
  compressMultipleImages,
  PROPERTY_IMAGE_OPTIONS,
} from "../../utils/imageCompression";
import { useGeocoding } from "../../hooks/useGeocoding";
import { getCurrentLocation } from "../../utils/geocoding";
import { showToast } from "../../utils/toast";
import {
  BaseModal,
  type ModalButton,
  TextInput,
  NumberInput,
  TextareaInput,
  FormField,
  Text,
  Button,
} from "../reusable";
import { PropertyTypeSelect } from "../reusable/dropdowns";

interface PropertyFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  initialData?: any;
}

interface PropertyFormState {
  title: string;
  propertyType: string;
  location: { type: string; coordinates: number[]; address: string };
  area: number;
  areaUnit: string;
  totalRooms: number;
  bedrooms: number;
  bathrooms: number;
  kitchens: number;
  description: string;
  images: string[];
  isActive: boolean;
}

const initialState: PropertyFormState = {
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
  initialData,
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const { loading, error } = useSelector((state: RootState) => state.property);
  const [form, setForm] = useState(initialData || initialState);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [imageError, setImageError] = useState<string>("");
  const [formError, setFormError] = useState<string>("");
  const [fetchingLocation, setFetchingLocation] = useState(false);

  // Reset form and fetch location when modal opens
  useEffect(() => {
    if (!isOpen) return;

    if (initialData) {
      setForm({ ...initialState, ...initialData, areaUnit: "sqft" });
    } else {
      setForm(initialState);
      const fetchLocation = async () => {
        setFetchingLocation(true);
        try {
          const location = await getCurrentLocation();
          setForm((prev: PropertyFormState) => ({
            ...prev,
            location: {
              type: "Point",
              coordinates: [location.lng, location.lat],
              address: location.address || "",
            },
          }));
        } catch {
          // Silently fail, user can set location manually
        } finally {
          setFetchingLocation(false);
        }
      };
      fetchLocation();
    }

    setImageFiles([]);
    setCarouselIndex(0);
    setImageError("");
    setFormError("");
  }, [isOpen, initialData]);

  const { address: locationAddress, loading: addressLoading } = useGeocoding(
    isOpen &&
      (form.location.coordinates[0] !== 0 || form.location.coordinates[1] !== 0)
      ? { lat: form.location.coordinates[1], lng: form.location.coordinates[0] }
      : null
  );

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    const numberFields = [
      "area",
      "totalRooms",
      "bedrooms",
      "bathrooms",
      "kitchens",
    ];

    setForm((prev: PropertyFormState) => {
      if (name === "area") {
        return { ...prev, area: Number(value), areaUnit: "sqft" };
      }
      if (numberFields.includes(name)) {
        return { ...prev, [name]: Number(value) };
      }
      return { ...prev, [name]: value };
    });
  };

  const handleRemoveImage = (idx: number) => {
    const newFiles = imageFiles.filter((_, i) => i !== idx);
    setImageFiles(newFiles);
    setCarouselIndex((prev) => Math.max(0, prev - (prev >= idx ? 1 : 0)));
    setForm((prev: PropertyFormState) => ({
      ...prev,
      images: newFiles.map(() => ""),
    }));
  };

  const handleReplaceImages = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = Array.from(e.target.files || []);
    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
      "image/gif",
    ];
    const maxSize = 5 * 1024 * 1024;

    if (files.length > 15) {
      setImageError("You can only select up to 15 images.");
      return;
    }

    const validImages = files.filter(
      (file) =>
        file.type.startsWith("image/") && allowedTypes.includes(file.type)
    );

    if (validImages.length !== files.length) {
      setImageError("Only image files (JPEG, PNG, WebP, GIF) are allowed.");
      return;
    }

    const oversizedFiles = validImages.filter((file) => file.size > maxSize);
    if (oversizedFiles.length > 0) {
      setImageError("Each image must be smaller than 5MB.");
      return;
    }

    try {
      setImageError("");
      const compressionResults = await compressMultipleImages(
        validImages,
        PROPERTY_IMAGE_OPTIONS
      );
      const compressedFiles = compressionResults.map(
        (result) => result.compressedFile
      );
      setImageFiles(compressedFiles);
      setCarouselIndex(0);
      setForm((prev: PropertyFormState) => ({
        ...prev,
        images: compressedFiles.map(() => ""),
      }));
    } catch (error) {
      console.error("Image compression failed:", error);
      showToast.error("Failed to process images. Please try again.");
      setImageError("Failed to process images. Please try again.");
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setFormError("");
    const [lng, lat] = form.location.coordinates;

    if (!form.area || form.area <= 0) {
      setFormError("Area must be greater than zero.");
      return;
    }
    if (!lng || !lat) {
      setFormError("Please select a valid location on the map.");
      return;
    }

    const submitData = {
      ...form,
      images: imageFiles,
      propertyType: form.propertyType as "apartment" | "house" | "villa",
      areaUnit: "sqft" as const,
      location: {
        ...form.location,
        type: "Point" as const,
        coordinates: [Number(lng) || 0, Number(lat) || 0] as [number, number],
      },
    };

    try {
      await dispatch(createPropertyThunk(submitData)).unwrap();
      setForm(initialState);
      setImageFiles([]);
      onClose();
    } catch {
      // error handled by redux state
    }
  };

  // Footer buttons
  const footerButtons: ModalButton[] = [
    {
      label: "Cancel",
      onClick: onClose,
      variant: "secondary",
      disabled: loading,
      leftIcon: <X className="h-4 w-4" />,
    },
    {
      label: "Create Property",
      onClick: () => handleSubmit(),
      variant: "primary",
      loading: loading,
      disabled: loading,
      leftIcon: <Plus className="h-4 w-4" />,
    },
  ];

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Create New Property"
      maxWidth="4xl"
      footer={footerButtons}
    >
      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
        {/* Title - Full Width */}
        <TextInput
          label="Title"
          name="title"
          value={form.title}
          onChange={handleChange}
          required
        />

        {/* Area and Type - Same Line */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          <NumberInput
            label="Area (sqft)"
            name="area"
            value={form.area}
            onChange={handleChange}
            min={0}
            placeholder="Enter area in square feet"
            required
          />
          <PropertyTypeSelect
            value={form.propertyType}
            onChange={(value) =>
              setForm((prev: PropertyFormState) => ({
                ...prev,
                propertyType: value,
              }))
            }
            required
          />
        </div>

        {/* Location - Full Width */}
        <FormField
          label={
            <>
              Location
              {fetchingLocation && (
                <Text
                  size="xs"
                  color="accent"
                  weight="normal"
                  className="ml-2 inline"
                  as="span"
                >
                  (Auto-detecting from IP...)
                </Text>
              )}
            </>
          }
        >
          <Button
            type="button"
            onClick={() => setShowLocationModal(true)}
            variant="ghost"
            fullWidth
            className="justify-between px-4 py-3 border border-primary-200 bg-primary-50 text-primary-900 hover:bg-primary-100"
          >
            <div className="text-left">
              {fetchingLocation ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-accent-600 border-t-transparent rounded-full animate-spin"></div>
                  <Text size="sm">Detecting your location...</Text>
                </div>
              ) : addressLoading ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
                  <Text size="sm">Loading address...</Text>
                </div>
              ) : locationAddress ? (
                <Text>{locationAddress}</Text>
              ) : form.location.coordinates[1] !== 0 ||
                form.location.coordinates[0] !== 0 ? (
                <Text>
                  {`${form.location.coordinates[1].toFixed(
                    4
                  )}, ${form.location.coordinates[0].toFixed(4)}`}
                </Text>
              ) : (
                <Text>Choose on Map</Text>
              )}
            </div>
            <div className="text-accent-500">
              <MapPin className="h-5 w-5" />
            </div>
          </Button>
          <LocationSelector
            isOpen={showLocationModal}
            onClose={() => setShowLocationModal(false)}
            onLocationSelect={({ lat, lng }) => {
              setForm((prev: PropertyFormState) => ({
                ...prev,
                location: {
                  ...prev.location,
                  coordinates: [lng, lat],
                },
              }));
              setShowLocationModal(false);
            }}
          />
        </FormField>

        {/* Rest of the form fields */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {(["Total Rooms", "Bedrooms", "Bathrooms", "Kitchens"] as const).map(
            (label) => (
              <NumberInput
                key={label}
                label={label}
                name={
                  label
                    .toLowerCase()
                    .replace(" ", "") as keyof PropertyFormState
                }
                value={
                  form[
                    label
                      .toLowerCase()
                      .replace(" ", "") as keyof PropertyFormState
                  ] as number
                }
                onChange={handleChange}
              />
            )
          )}
          <div className="md:col-span-2">
            <TextareaInput
              label="Description"
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={2}
              required
            />
          </div>
          <div className="md:col-span-2">
            <FormField
              label="Images (max 15, max 5MB each, JPEG/PNG/WebP/GIF only)"
              error={imageError}
            >
              <input
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                multiple
                required
                onChange={handleReplaceImages}
                className="w-full rounded-lg px-3 py-2 sm:py-3 border border-primary-300 focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-accent-500 text-sm sm:text-base bg-white text-primary-900 placeholder-gray-300 file:bg-accent-500 file:text-white file:rounded file:px-2 file:py-1 file:text-sm file:font-semibold file:border-0 file:mr-2 file:cursor-pointer file:hover:bg-accent-600"
              />
            </FormField>
            {imageFiles.length > 0 && (
              <div className="mt-4 flex flex-col items-center">
                <div className="relative w-full max-w-xl flex items-center justify-center bg-primary-100 rounded-lg overflow-hidden py-4">
                  {carouselIndex > 0 && (
                    <Button
                      type="button"
                      variant="icon"
                      size="sm"
                      circular
                      iconOnly
                      className="absolute left-2 top-1/2 -translate-y-1/2"
                      onClick={() => setCarouselIndex((prev) => prev - 1)}
                      aria-label="Previous image"
                    >
                      <Text size="base">&#8592;</Text>
                    </Button>
                  )}
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
                          <Button
                            type="button"
                            variant="danger"
                            size="xs"
                            circular
                            iconOnly
                            className="absolute top-1 right-1 w-7 h-7 border-2 border-white"
                            onClick={() =>
                              handleRemoveImage(carouselIndex + idx)
                            }
                            aria-label="Remove image"
                          >
                            <Text size="sm" weight="bold">
                              &times;
                            </Text>
                          </Button>
                        </div>
                      ))}
                  </div>
                  {carouselIndex < imageFiles.length - 3 && (
                    <Button
                      type="button"
                      variant="icon"
                      size="sm"
                      circular
                      iconOnly
                      className="absolute right-2 top-1/2 -translate-y-1/2"
                      onClick={() => setCarouselIndex((prev) => prev + 1)}
                      aria-label="Next image"
                    >
                      <Text size="base">&#8594;</Text>
                    </Button>
                  )}
                </div>
                <Text size="xs" color="primary" className="mt-2" align="center">
                  Showing {carouselIndex + 1} -{" "}
                  {Math.min(carouselIndex + 3, imageFiles.length)} of{" "}
                  {imageFiles.length}
                </Text>
              </div>
            )}
          </div>
          {/* Active checkbox removed: property is always active by default */}
        </div>
        {(formError || error) && (
          <Text variant="error" size="sm" align="center" className="mt-2">
            {formError || error}
          </Text>
        )}
      </form>
    </BaseModal>
  );
};

export default PropertyFormModal;
