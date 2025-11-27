import { useCallback, useState, useRef } from "react";
import { feedbackApi } from "../../../services/feedbackService";
import { handleApiError } from "../../../services/apiService";
import type { Review } from "../../../types/review";

const ITEMS_PER_PAGE = 10;

interface PaginationState {
  page: number;
  total: number;
  totalPages: number;
  limit: number;
}

interface UseInfiniteFeedbackProps {
  userId: string | undefined;
}

export function useInfiniteFeedback({ userId }: UseInfiniteFeedbackProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationState | null>(null);
  const currentPageRef = useRef(1);
  const isInitialLoadRef = useRef(true);

  const fetchPage = useCallback(
    async (page: number, append: boolean = false) => {
      if (!userId) return;

      setLoading(true);
      setError(null);

      try {
        const response = await feedbackApi.getUserFeedback(userId, {
          page,
          limit: ITEMS_PER_PAGE,
        });

        const reviewsData = Array.isArray(response.data) ? response.data : [];

        setReviews((prev) => (append ? [...prev, ...reviewsData] : reviewsData));
        setPagination(response.pagination);
        currentPageRef.current = page;
      } catch (err) {
        setError(handleApiError(err));
      } finally {
        setLoading(false);
      }
    },
    [userId]
  );

  const loadMore = useCallback(() => {
    if (!pagination || loading) return;
    if (currentPageRef.current >= pagination.totalPages) return;

    const nextPage = currentPageRef.current + 1;
    void fetchPage(nextPage, true);
  }, [pagination, loading, fetchPage]);

  const refresh = useCallback(() => {
    currentPageRef.current = 1;
    isInitialLoadRef.current = true;
    void fetchPage(1, false);
  }, [fetchPage]);

  const initialLoad = useCallback(() => {
    if (isInitialLoadRef.current && userId) {
      isInitialLoadRef.current = false;
      void fetchPage(1, false);
    }
  }, [userId, fetchPage]);

  return {
    reviews,
    loading,
    error,
    pagination,
    loadMore,
    refresh,
    initialLoad,
  };
}

