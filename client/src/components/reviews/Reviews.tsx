import React, { useMemo, memo, useEffect, useState, useCallback } from "react";
import { MessageSquare } from "lucide-react";
import { useSelector } from "react-redux";
import { Text, Badge } from "../reusable";
import ReviewList from "./ReviewList";
import ReviewStats from "./ReviewStats";
import DataTable from "../ui/DataTable";
import type { RootState } from "../../store";
import type {
  Review,
  ReviewStats as ReviewStatsType,
  ReviewSubmission,
} from "../../types/review";
import {
  feedbackApi,
  type PendingFeedbackJob,
} from "../../services/feedbackService";
import { formatDate } from "../../utils/date";
import { handleApiError } from "../../services/apiService";
import Loader from "../ui/Loader";
import JobDetailViewModal from "../JobDetailViewModal";
import ReviewSubmissionModal from "./ReviewSubmissionModal";
import { showToast } from "../../utils/toast";

interface ReviewsProps {
  userRole?: "customer" | "contractor" | "admin";
}

const Reviews: React.FC<ReviewsProps> = memo(() => {
  const currentUser = useSelector((state: RootState) => state.auth.user);

  const [completedReviews, setCompletedReviews] = useState<Review[]>([]);
  const [pendingJobs, setPendingJobs] = useState<PendingFeedbackJob[]>([]);
  const [activeTab, setActiveTab] = useState<"completed" | "pending">(
    "completed"
  );
  const [loadingCompleted, setLoadingCompleted] = useState(false);
  const [loadingPending, setLoadingPending] = useState(false);
  const [errorCompleted, setErrorCompleted] = useState<string | null>(null);
  const [errorPending, setErrorPending] = useState<string | null>(null);
  const [hasLoadedCompleted, setHasLoadedCompleted] = useState(false);
  const [hasLoadedPending, setHasLoadedPending] = useState(false);
  const [jobDetailOpen, setJobDetailOpen] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [selectedPendingJob, setSelectedPendingJob] =
    useState<PendingFeedbackJob | null>(null);
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);
  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false);
  const [revieweeName, setRevieweeName] = useState<string | undefined>();

  const fetchCompleted = useCallback(async () => {
    if (!currentUser?._id) return;
    setLoadingCompleted(true);
    setErrorCompleted(null);
    try {
      const data = await feedbackApi.getUserFeedback(currentUser._id);
      setCompletedReviews(
        data.map((item) => ({
          _id: item._id,
          jobRequest: item.jobRequest,
          fromUser: item.fromUser,
          toUser: item.toUser,
          fromRole: item.fromRole,
          rating: item.rating,
          comment: item.comment,
          job: item.job,
          createdAt: item.createdAt,
          updatedAt: item.updatedAt,
        }))
      );
      setHasLoadedCompleted(true);
    } catch (err) {
      setErrorCompleted(handleApiError(err));
    } finally {
      setLoadingCompleted(false);
    }
  }, [currentUser?._id]);

  const fetchPending = useCallback(async () => {
    setLoadingPending(true);
    setErrorPending(null);
    try {
      const data = await feedbackApi.getPendingFeedbackJobs();
      setPendingJobs(data);
    } catch (err) {
      setErrorPending(handleApiError(err));
    } finally {
      setLoadingPending(false);
    }
  }, []);

  // Load data when tabs are first opened
  useEffect(() => {
    if (activeTab === "completed" && !hasLoadedCompleted) {
      void fetchCompleted();
    }
    if (activeTab === "pending" && !hasLoadedPending) {
      void fetchPending();
    }
  }, [
    activeTab,
    hasLoadedCompleted,
    hasLoadedPending,
    fetchCompleted,
    fetchPending,
  ]);

  const stats: ReviewStatsType = useMemo(() => {
    if (!completedReviews.length) {
      return {
        averageRating: 0,
        totalReviews: 0,
        ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
      };
    }
    const totalReviews = completedReviews.length;
    const sumRatings = completedReviews.reduce(
      (sum, review) => sum + review.rating,
      0
    );
    const averageRating = totalReviews > 0 ? sumRatings / totalReviews : 0;
    const ratingDistribution = {
      5: completedReviews.filter((r) => r.rating === 5).length,
      4: completedReviews.filter((r) => r.rating === 4).length,
      3: completedReviews.filter((r) => r.rating === 3).length,
      2: completedReviews.filter((r) => r.rating === 2).length,
      1: completedReviews.filter((r) => r.rating === 1).length,
    };
    return {
      averageRating,
      totalReviews,
      ratingDistribution,
    };
  }, [completedReviews]);

  const reviewerNames = useMemo(() => ({} as Record<string, string>), []);
  const reviewerAvatars = useMemo(() => ({} as Record<string, string>), []);

  const handleOpenJob = useCallback(
    (jobId: string) => {
      const pending = pendingJobs.find((j) => j._id === jobId) || null;
      setSelectedPendingJob(pending);
      setSelectedJobId(jobId);
      setJobDetailOpen(true);
    },
    [pendingJobs]
  );

  const handleOpenFeedbackModal = useCallback(
    (_jobId: string, name?: string) => {
      if (!selectedPendingJob) return;
      setRevieweeName(name);
      setFeedbackModalOpen(true);
    },
    [selectedPendingJob]
  );

  const handleSubmitFeedback = useCallback(
    async (payload: ReviewSubmission) => {
      if (!selectedPendingJob) return;
      setFeedbackSubmitting(true);
      try {
        await feedbackApi.createFeedback({
          jobRequestId: selectedPendingJob._id,
          rating: payload.rating,
          comment: payload.comment,
        });
        setFeedbackModalOpen(false);
        setJobDetailOpen(false);
        showToast.success("Feedback submitted successfully!");
        // Refresh lists
        setHasLoadedCompleted(false);
        setHasLoadedPending(false);
        await Promise.all([fetchCompleted(), fetchPending()]);
      } catch (err) {
        showToast.error(handleApiError(err));
      } finally {
        setFeedbackSubmitting(false);
      }
    },
    [selectedPendingJob, fetchCompleted, fetchPending]
  );

  const pendingColumns = useMemo(
    () =>
      [
        {
          key: "title",
          header: "Job",
          accessor: (row: PendingFeedbackJob) => row.title,
        },
        {
          key: "service",
          header: "Service",
          accessor: (row: PendingFeedbackJob) => row.service,
        },
        {
          key: "estimate",
          header: "Estimate",
          render: (row: PendingFeedbackJob) =>
            new Intl.NumberFormat("en-CA", {
              style: "currency",
              currency: "CAD",
            }).format(row.estimate / 100),
        },
        {
          key: "status",
          header: "Status",
          render: () => (
            <Badge variant="success" size="sm">
              Completed
            </Badge>
          ),
        },
        {
          key: "createdAt",
          header: "Completed On",
          accessor: (row: PendingFeedbackJob) => formatDate(row.updatedAt),
          mobileLabel: "Completed",
        },
      ] as const,
    []
  );

  return (
    <div className="space-y-6">
      {/* Header + Tabs (styled like All Jobs tabs) */}
      <div className="bg-white rounded-lg shadow-sm border border-primary-200 overflow-hidden">
        <div className="px-3 sm:px-4 md:px-6 py-4 sm:py-5 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-100 rounded-lg">
              <MessageSquare className="h-6 w-6 text-primary-600" />
            </div>
            <div>
              <Text size="xl" weight="bold" className="text-primary-900">
                Reviews & Feedback
              </Text>
              <Text size="sm" className="text-gray-500">
                View your feedback and complete pending reviews
              </Text>
            </div>
          </div>
        </div>
        <div className="px-3 sm:px-4 md:px-6 py-3 sm:py-4">
          <div className="flex border-b border-gray-200">
            <button
              type="button"
              onClick={() => setActiveTab("completed")}
              className={`flex-1 px-2 sm:px-4 py-2 text-xs sm:text-sm font-medium transition-colors text-center ${
                activeTab === "completed"
                  ? "text-accent-600 border-b-2 border-accent-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Completed Feedback
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("pending")}
              className={`flex-1 px-2 sm:px-4 py-2 text-xs sm:text-sm font-medium transition-colors text-center ${
                activeTab === "pending"
                  ? "text-accent-600 border-b-2 border-accent-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Pending Feedback
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      {activeTab === "completed" ? (
        <div className="bg-white rounded-lg shadow-sm border border-primary-200 p-4 sm:p-6 transition-all duration-200 ease-out">
          <div className="flex items-center justify-between mb-4">
            <Text size="lg" weight="semibold" className="text-primary-900">
              All Feedback
            </Text>
            <Text size="sm" className="text-primary-700">
              {stats.totalReviews}{" "}
              {stats.totalReviews === 1 ? "Review" : "Reviews"}
            </Text>
          </div>
          {/* Compact stats block above list */}
          <div className="mb-6">
            <ReviewStats stats={stats} />
          </div>
          {errorCompleted && (
            <div className="mb-4 rounded-md bg-accent-50 px-4 py-2 text-sm text-accent-700">
              {errorCompleted}
            </div>
          )}
          {loadingCompleted && (
            <div className="min-h-[200px] flex items-center justify-center">
              <Loader size="large" color="accent" />
            </div>
          )}
          {!loadingCompleted && (
            <ReviewList
              reviews={completedReviews}
              reviewerNames={reviewerNames}
              reviewerAvatars={reviewerAvatars}
              showJobTitle={true}
              emptyMessage="No feedback yet"
            />
          )}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-primary-200 p-4 sm:p-6 transition-all duration-200 ease-out">
          <div className="flex items-center justify-between mb-4">
            <Text size="lg" weight="semibold" className="text-primary-900">
              Jobs Awaiting Your Feedback
            </Text>
            <Text size="sm" className="text-primary-700">
              {pendingJobs.length} pending
            </Text>
          </div>
          {errorPending && (
            <div className="mb-4 rounded-md bg-accent-50 px-4 py-2 text-sm text-accent-700">
              {errorPending}
            </div>
          )}
          <DataTable<PendingFeedbackJob>
            data={pendingJobs}
            columns={pendingColumns as any}
            loading={loadingPending}
            emptyMessage={
              loadingPending
                ? "Loading pending feedback..."
                : "No pending feedback. Great job staying up to date!"
            }
            onRowClick={(row) => handleOpenJob(row._id)}
            showRowNumbers={false}
            striped
            hoverable
          />
        </div>
      )}

      {/* Job Detail Modal with Feedback button (only for this context) */}
      {jobDetailOpen && selectedJobId && (
        <JobDetailViewModal
          isOpen={jobDetailOpen}
          onClose={() => {
            setJobDetailOpen(false);
            setSelectedJobId(null);
          }}
          job={null}
          jobId={selectedJobId}
          onRefreshJobs={fetchPending}
          shouldRefetch={false}
          showFeedbackButton
          onFeedbackClick={handleOpenFeedbackModal}
          hideBidsTab
        />
      )}

      {/* Feedback Submission Modal */}
      <ReviewSubmissionModal
        isOpen={feedbackModalOpen}
        onClose={() => setFeedbackModalOpen(false)}
        onSubmit={handleSubmitFeedback}
        jobTitle={selectedPendingJob?.title}
        revieweeName={revieweeName}
        loading={feedbackSubmitting}
      />
    </div>
  );
});

Reviews.displayName = "Reviews";

export default Reviews;
