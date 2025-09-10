
import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "../store";

const categories = [
  "painting",
  "plumbing",
  "electrical",
  "cleaning",
  "renovation",
  "hvac",
  "other",
];

const JobCreate: React.FC = () => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState(categories[0]);
  // Remove type/property from form state, set automatically
  const [jobType, setJobType] = useState<string>("");
  const user = useSelector((state: RootState) => state.auth.user);
  // membership may be null or an object with a 'tier' property
  const membership = useSelector((state: RootState) => state.membership.current) as { tier?: string } | null;
  const [budget, setBudget] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 5) {
      setError("You can upload up to 5 images only.");
      return;
    }
    setImages(files);
    setError(null);
  };

  useEffect(() => {
    if (!user) return;
    if (user.role === "admin") {
      setJobType("off_market");
    } else if (user.role === "customer") {
      // membership?.tier: 'basic' => 'domestic', else 'commercial'
  const tier = membership && typeof membership === 'object' && 'tier' in membership ? membership.tier : "";
  setJobType(tier === "basic" ? "domestic" : "commercial");
    } else {
      setJobType("");
    }
  }, [user, membership]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    if (title.length < 5 || title.length > 100) {
      setError("Title must be 5-100 characters.");
      return;
    }
    if (description.length < 10 || description.length > 2000) {
      setError("Description must be 10-2000 characters.");
      return;
    }
    if (images.length > 5) {
      setError("You can upload up to 5 images only.");
      return;
    }
    if (!jobType) {
      setError("Job type could not be determined.");
      return;
    }
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("description", description);
      formData.append("category", category);
      formData.append("type", jobType);
      if (budget) formData.append("budget", budget);
      images.forEach((file) => formData.append("images", file));
      const res = await fetch("/api/job-request", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "Failed to create job");
      }
      setSuccess(true);
      setTitle("");
      setDescription("");
      setCategory(categories[0]);
      setBudget("");
      setImages([]);
    } catch (err: any) {
      setError(err.message || "Failed to create job");
    } finally {
      setLoading(false);
    }
  };

  return (
  <div className="max-w-4xl mx-auto w-full bg-white rounded-2xl border border-white/20 shadow-xl p-10 md:p-12 mt-8 mb-8">
  <h2 className="text-3xl font-bold text-primary-900 mb-8 text-center tracking-tight">Create a Job Request</h2>
      <form className="space-y-5" onSubmit={handleSubmit}>
  {error && <div className="text-red-400 text-sm font-medium text-center">{error}</div>}
  {success && <div className="text-green-500 text-sm font-medium text-center">Job created successfully!</div>}
        <div>
          <label className="block text-primary-900 text-sm font-medium mb-2">Title *</label>
          <input
            className="w-full px-4 py-3 rounded-lg border-2 border-primary-200 bg-white text-primary-900 placeholder-primary-400 transition-colors focus:border-accent-500 focus:ring-2 focus:ring-accent-500/20"
            value={title}
            onChange={e => setTitle(e.target.value)}
            minLength={5}
            maxLength={100}
            required
            placeholder="Enter job title"
          />
        </div>
        <div>
          <label className="block text-primary-900 text-sm font-medium mb-2">Description *</label>
          <textarea
            className="w-full px-4 py-3 rounded-lg border-2 border-primary-200 bg-white text-primary-900 placeholder-primary-400 transition-colors focus:border-accent-500 focus:ring-2 focus:ring-accent-500/20"
            value={description}
            onChange={e => setDescription(e.target.value)}
            minLength={10}
            maxLength={2000}
            required
            placeholder="Describe the job in detail"
            rows={4}
          />
        </div>
        <div>
          <label className="block text-primary-900 text-sm font-medium mb-2">Category *</label>
          <select
            className="w-full px-4 py-3 rounded-lg border-2 border-primary-200 bg-white text-primary-900 transition-colors focus:border-accent-500 focus:ring-2 focus:ring-accent-500/20"
            value={category}
            onChange={e => setCategory(e.target.value)}
            required
          >
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
            ))}
          </select>
        </div>
  {/* Type and Property ID fields removed, type is set automatically */}
        <div>
          <label className="block text-primary-900 text-sm font-medium mb-2">Budget</label>
          <input
            className="w-full px-4 py-3 rounded-lg border-2 border-primary-200 bg-white text-primary-900 placeholder-primary-400 transition-colors focus:border-accent-500 focus:ring-2 focus:ring-accent-500/20"
            type="number"
            value={budget}
            onChange={e => setBudget(e.target.value)}
            min={0}
            placeholder="Estimated budget (optional)"
          />
        </div>
        <div>
          <label className="block text-primary-900 text-sm font-medium mb-2">Images (up to 5)</label>
          <input
            className="w-full px-4 py-2 rounded-lg border-2 border-primary-200 bg-white text-primary-900 file:bg-accent-500 file:text-white file:rounded file:px-3 file:py-1"
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageChange}
          />
          {images.length > 0 && (
            <ul className="mt-2 flex flex-wrap gap-2">
              {images.map((img, idx) => (
                <li key={idx} className="text-xs bg-primary-100 text-primary-900 px-2 py-1 rounded">
                  {img.name}
                </li>
              ))}
            </ul>
          )}
        </div>
        <button
          type="submit"
          className="w-full py-3 px-4 rounded-lg font-semibold text-white bg-accent-500 hover:bg-accent-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed mt-2 shadow-md"
          disabled={loading}
        >
          {loading ? "Creating..." : "Create Job"}
        </button>
      </form>
    </div>
  );
};

export default JobCreate;
