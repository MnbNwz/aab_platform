import React, { useEffect, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { RootState, AppDispatch } from "../store";
import { jobApi } from "../services/jobService";
import { getServicesThunk } from "../store/thunks/servicesThunks";
import { useForm, Controller } from "react-hook-form";

interface JobFormInputs {
  title: string;
  description: string;
  category: string;
  budget?: string;
  images: File[];
}

const JobCreate: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const {
    services,
    isLoading: servicesLoading,
    isInitialized,
  } = useSelector((state: RootState) => state.services);
  const user = useSelector((state: RootState) => state.auth.user);
  const membership = useSelector(
    (state: RootState) => state.membership.current
  ) as { tier?: string } | null;
  const [jobType, setJobType] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const {
    control,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<JobFormInputs>({
    defaultValues: {
      title: "",
      description: "",
      category: "",
      budget: "",
      images: [],
    },
  });

  useEffect(() => {
    if (!isInitialized && !servicesLoading) {
      dispatch(getServicesThunk())
        .unwrap()
        .catch(() => {});
    }
  }, [isInitialized, servicesLoading, dispatch]);

  useEffect(() => {
    if (services.length > 0) {
      setValue("category", services[0]);
    }
  }, [services, setValue]);

  useEffect(() => {
    if (!user) return;
    if (user.role === "admin") {
      setJobType("off_market");
    } else if (user.role === "customer") {
      const tier =
        membership && typeof membership === "object" && "tier" in membership
          ? membership.tier
          : "";
      setJobType(tier === "basic" ? "domestic" : "commercial");
    } else {
      setJobType("");
    }
  }, [user, membership]);

  const onSubmit = async (data: JobFormInputs) => {
    setError(null);
    setSuccess(false);
    if (!jobType) {
      setError("Job type could not be determined.");
      return;
    }
    if (data.images.length > 5) {
      setError("You can upload up to 5 images only.");
      return;
    }
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("title", data.title);
      formData.append("description", data.description);
      formData.append("category", data.category);
      formData.append("type", jobType);
      if (data.budget) formData.append("budget", data.budget);
      data.images.forEach((file) => formData.append("images", file));
      const res = await jobApi.createJob(formData);
      if (!res || res.errors) {
        throw new Error(
          res?.errors ? JSON.stringify(res.errors) : "Failed to create job"
        );
      }
      setSuccess(true);
      reset();
    } catch (err: any) {
      setError(err.message || "Failed to create job");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      <h2 className="text-2xl sm:text-3xl font-bold text-primary-800 mb-6 text-center">
        Create Job Request
      </h2>
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-4 sm:space-y-6"
      >
        {error && (
          <div className="text-red-400 text-sm font-medium text-center">
            {error}
          </div>
        )}
        {success && (
          <div className="text-green-500 text-sm font-medium text-center">
            Job created successfully!
          </div>
        )}
        <div>
          <label className="block text-gray-700 font-medium mb-2 text-sm sm:text-base">
            Title *
          </label>
          <Controller
            name="title"
            control={control}
            rules={{
              required: "Title is required",
              minLength: { value: 5, message: "Min 5 characters" },
              maxLength: { value: 100, message: "Max 100 characters" },
            }}
            render={({ field }) => (
              <input
                {...field}
                className="w-full rounded-lg px-3 py-2 sm:py-3 border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white text-sm sm:text-base"
                minLength={5}
                maxLength={100}
                required
                placeholder="Enter job title"
              />
            )}
          />
          {errors.title && (
            <span className="text-red-500 text-xs mt-1">
              {errors.title.message}
            </span>
          )}
        </div>
        <div>
          <label className="block text-gray-700 font-medium mb-2 text-sm sm:text-base">
            Description *
          </label>
          <Controller
            name="description"
            control={control}
            rules={{
              required: "Description is required",
              minLength: { value: 10, message: "Min 10 characters" },
              maxLength: { value: 2000, message: "Max 2000 characters" },
            }}
            render={({ field }) => (
              <textarea
                {...field}
                className="w-full rounded-lg px-3 py-2 sm:py-3 border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white text-sm sm:text-base resize-none"
                minLength={10}
                maxLength={2000}
                required
                placeholder="Describe the job in detail"
                rows={4}
              />
            )}
          />
          {errors.description && (
            <span className="text-red-500 text-xs mt-1">
              {errors.description.message}
            </span>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-gray-700 font-medium mb-2 text-sm sm:text-base">
              Category *
            </label>
            <Controller
              name="category"
              control={control}
              rules={{ required: "Category is required" }}
              render={({ field }) => (
                <select
                  {...field}
                  className="w-full rounded-lg px-3 py-2 sm:py-3 border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white text-sm sm:text-base"
                  required
                >
                  <option value="">Select category</option>
                  {services.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </option>
                  ))}
                </select>
              )}
            />
            {errors.category && (
              <span className="text-red-500 text-xs mt-1">
                {errors.category.message}
              </span>
            )}
          </div>
          <div>
            <label className="block text-gray-700 font-medium mb-2 text-sm sm:text-base">
              Estimated Budget (USD)
            </label>
            <Controller
              name="budget"
              control={control}
              render={({ field }) => (
                <input
                  {...field}
                  className="w-full rounded-lg px-3 py-2 sm:py-3 border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white text-sm sm:text-base"
                  type="number"
                  min={0}
                  placeholder="Optional"
                />
              )}
            />
          </div>
        </div>
        <div>
          <label className="block text-gray-700 font-medium mb-2 text-sm sm:text-base">
            Images (up to 5)
          </label>
          <Controller
            name="images"
            control={control}
            render={({ field: { onChange, value } }) => (
              <>
                <input
                  className="w-full rounded-lg px-3 py-2 sm:py-3 border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white file:bg-primary-500 file:text-white file:rounded file:px-3 file:py-1 file:border-0 file:text-sm file:font-medium text-sm sm:text-base"
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => {
                    const files = Array.from(e.target.files || []);
                    onChange(files);
                  }}
                />
                {value && value.length > 0 && (
                  <ul className="mt-2 flex flex-wrap gap-2">
                    {value.map((img: File, idx: number) => (
                      <li
                        key={idx}
                        className="text-xs bg-primary-100 text-primary-900 px-2 py-1 rounded"
                      >
                        {img.name}
                      </li>
                    ))}
                  </ul>
                )}
              </>
            )}
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-accent-500 text-white font-semibold py-2 sm:py-3 rounded-lg mt-4 hover:bg-accent-600 transition-colors duration-200 text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Creating..." : "Create Job"}
        </button>
      </form>
    </div>
  );
};

export default JobCreate;
