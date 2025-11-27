import { useCallback, useEffect } from "react";
import { feedbackApi } from "../../../services/feedbackService";
import { handleApiError } from "../../../services/apiService";

const ITEMS_PER_PAGE = 10;

interface UseFeedbackDataProps {
  userId: string | undefined;
  activeTab: "completed" | "pending";
  completedPage: number;
  pendingPage: number;
  onCompletedStart: () => void;
  onCompletedSuccess: (data: any[], pagination: any) => void;
  onCompletedError: (error: string) => void;
  onPendingStart: () => void;
  onPendingSuccess: (data: any[], pagination: any) => void;
  onPendingError: (error: string) => void;
}

export function useFeedbackData({
  userId,
  activeTab,
  completedPage,
  pendingPage,
  onCompletedStart,
  onCompletedSuccess,
  onCompletedError,
  onPendingStart,
  onPendingSuccess,
  onPendingError,
}: UseFeedbackDataProps) {
  const fetchCompleted = useCallback(
    async (page: number = 1) => {
      if (!userId) return;

      onCompletedStart();
      try {
        const response = await feedbackApi.getUserFeedback(userId, {
          page,
          limit: ITEMS_PER_PAGE,
        });
        const reviewsData = Array.isArray(response.data) ? response.data : [];
        onCompletedSuccess(reviewsData, response.pagination);
      } catch (err) {
        onCompletedError(handleApiError(err));
      }
    },
    [userId, onCompletedStart, onCompletedSuccess, onCompletedError]
  );

  const fetchPending = useCallback(
    async (page: number = 1) => {
      onPendingStart();
      try {
        const response = await feedbackApi.getPendingFeedbackJobs({
          page,
          limit: ITEMS_PER_PAGE,
        });
        const jobsData = Array.isArray(response.data) ? response.data : [];
        onPendingSuccess(jobsData, response.pagination);
      } catch (err) {
        onPendingError(handleApiError(err));
      }
    },
    [onPendingStart, onPendingSuccess, onPendingError]
  );

  // Load data when tabs are first opened or page changes
  useEffect(() => {
    if (activeTab === "completed") {
      void fetchCompleted(completedPage);
    }
  }, [activeTab, completedPage, fetchCompleted]);

  useEffect(() => {
    if (activeTab === "pending") {
      void fetchPending(pendingPage);
    }
  }, [activeTab, pendingPage, fetchPending]);

  return { fetchCompleted, fetchPending };
}

