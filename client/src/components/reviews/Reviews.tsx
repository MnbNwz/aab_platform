import React, { memo, useCallback, useEffect } from "react";
import { useSelector } from "react-redux";
import { Text } from "../reusable";
import type { RootState } from "../../store";
import type { ReviewSubmission } from "../../types/review";
import { feedbackApi } from "../../services/feedbackService";
import { handleApiError } from "../../services/apiService";
import JobDetailViewModal from "../JobDetailViewModal";
import ReviewSubmissionModal from "./ReviewSubmissionModal";
import ProfileViewModal from "../ProfileViewModal";
import CompletedFeedback from "./CompletedFeedback";
import PendingFeedback from "./PendingFeedback";
import { showToast } from "../../utils/toast";
import {
  useReviewsState,
  useFeedbackData,
  useNavigationHandlers,
} from "./hooks";
import { useInfiniteFeedback } from "./hooks/useInfiniteFeedback";

const Reviews: React.FC = memo(() => {
  const currentUser = useSelector((state: RootState) => state.auth.user);

  const { state, actions } = useReviewsState();

  const {
    reviews: completedReviews,
    loading: loadingCompleted,
    error: errorCompleted,
    pagination: completedPagination,
    loadMore: loadMoreCompleted,
    initialLoad: initialLoadCompleted,
    refresh: refreshCompleted,
  } = useInfiniteFeedback({ userId: currentUser?._id });

  const { fetchPending } = useFeedbackData({
    userId: currentUser?._id,
    activeTab: state.activeTab,
    completedPage: 1,
    pendingPage: state.pending.pagination?.page || 1,
    onCompletedStart: actions.fetchCompletedStart,
    onCompletedSuccess: actions.fetchCompletedSuccess,
    onCompletedError: actions.fetchCompletedError,
    onPendingStart: actions.fetchPendingStart,
    onPendingSuccess: actions.fetchPendingSuccess,
    onPendingError: actions.fetchPendingError,
  });

  const { handleProfileClick } = useNavigationHandlers({
    onOpenProfileModal: actions.openProfileModal,
  });

  useEffect(() => {
    if (state.activeTab === "completed") {
      initialLoadCompleted();
    }
  }, [state.activeTab, initialLoadCompleted]);

  const handleOpenPendingJob = useCallback(
    (jobId: string) => {
      const pendingJob =
        state.pending.data.find((j) => j._id === jobId) || null;
      actions.openJobDetail(jobId, { pendingJob, isFromCompleted: false });
    },
    [state.pending.data, actions]
  );

  const handleJobClickFromCompleted = useCallback(
    (jobId: string) => {
      actions.openJobDetail(jobId, { isFromCompleted: true });
    },
    [actions]
  );

  const handleOpenFeedbackModal = useCallback(
    (_jobId: string, name?: string) => {
      if (!state.modals.jobDetail.selectedPendingJob) return;
      actions.openFeedbackModal(name);
    },
    [state.modals.jobDetail.selectedPendingJob, actions]
  );

  const handleSubmitFeedback = useCallback(
    async (payload: ReviewSubmission) => {
      const { selectedPendingJob } = state.modals.jobDetail;
      if (!selectedPendingJob) return;

      actions.setFeedbackSubmitting(true);
      try {
        await feedbackApi.createFeedback({
          jobRequestId: selectedPendingJob._id,
          rating: payload.rating,
          comment: payload.comment,
        });
        actions.closeFeedbackModal();
        actions.closeJobDetail();
        showToast.success("Feedback submitted successfully!");
        await Promise.all([
          refreshCompleted(),
          fetchPending(state.pending.pagination?.page || 1),
        ]);
      } catch (err) {
        showToast.error(handleApiError(err));
      } finally {
        actions.setFeedbackSubmitting(false);
      }
    },
    [state, actions, refreshCompleted, fetchPending]
  );

  const handlePendingPageChange = useCallback(
    (newPage: number) => {
      actions.setPendingPage(newPage);
    },
    [actions]
  );

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-primary-200 overflow-hidden">
        <div className="px-3 sm:px-4 md:px-6 py-4 sm:py-5 border-b border-gray-200">
          <div className="flex items-center justify-center align-middle">
            <Text size="xl" weight="bold" className="text-primary-900">
              View your feedback and complete pending reviews
            </Text>
          </div>
        </div>
        <div className="px-3 sm:px-4 md:px-6 py-3 sm:py-4">
          <div className="flex border-b border-gray-200">
            <button
              type="button"
              onClick={() => actions.setTab("completed")}
              className={`flex-1 px-2 sm:px-4 py-2 text-xs sm:text-sm font-medium transition-colors text-center ${
                state.activeTab === "completed"
                  ? "text-accent-600 border-b-2 border-accent-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Completed Feedback
            </button>
            <button
              type="button"
              onClick={() => actions.setTab("pending")}
              className={`flex-1 px-2 sm:px-4 py-2 text-xs sm:text-sm font-medium transition-colors text-center ${
                state.activeTab === "pending"
                  ? "text-accent-600 border-b-2 border-accent-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Pending Feedback
            </button>
          </div>
        </div>
      </div>

      {state.activeTab === "completed" ? (
        <CompletedFeedback
          reviews={completedReviews}
          loading={loadingCompleted}
          error={errorCompleted}
          pagination={completedPagination}
          onLoadMore={loadMoreCompleted}
          onProfileClick={handleProfileClick}
          onJobClick={handleJobClickFromCompleted}
        />
      ) : (
        <PendingFeedback
          jobs={state.pending.data}
          loading={state.pending.loading}
          error={state.pending.error}
          pagination={state.pending.pagination}
          onJobClick={handleOpenPendingJob}
          onPageChange={handlePendingPageChange}
        />
      )}

      {state.modals.jobDetail.isOpen &&
        state.modals.jobDetail.jobId &&
        !state.modals.jobDetail.isFromCompleted && (
          <JobDetailViewModal
            isOpen={state.modals.jobDetail.isOpen}
            onClose={actions.closeJobDetail}
            job={null}
            jobId={state.modals.jobDetail.jobId}
            onRefreshJobs={() =>
              fetchPending(state.pending.pagination?.page || 1)
            }
            shouldRefetch={false}
            showFeedbackButton
            onFeedbackClick={handleOpenFeedbackModal}
            hideBidsTab
          />
        )}

      {state.modals.jobDetail.isOpen &&
        state.modals.jobDetail.jobId &&
        state.modals.jobDetail.isFromCompleted && (
          <JobDetailViewModal
            isOpen={state.modals.jobDetail.isOpen}
            onClose={actions.closeJobDetail}
            job={null}
            jobId={state.modals.jobDetail.jobId}
            onRefreshJobs={() => {}}
            shouldRefetch={false}
            hideBidsTab
          />
        )}

      <ReviewSubmissionModal
        isOpen={state.modals.feedback.isOpen}
        onClose={actions.closeFeedbackModal}
        onSubmit={handleSubmitFeedback}
        jobTitle={state.modals.jobDetail.selectedPendingJob?.title}
        revieweeName={state.modals.feedback.revieweeName}
        loading={state.modals.feedback.submitting}
      />

      {state.modals.profile.isOpen && state.modals.profile.selectedUser && (
        <ProfileViewModal
          user={state.modals.profile.selectedUser}
          isOpen={state.modals.profile.isOpen}
          onClose={actions.closeProfileModal}
        />
      )}
    </div>
  );
});

Reviews.displayName = "Reviews";

export default Reviews;
