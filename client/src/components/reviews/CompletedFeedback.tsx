import React, { memo, useMemo, useRef, useEffect } from "react";
import { Text } from "../reusable";
import ReviewList from "./ReviewList";
import ReviewStats from "./ReviewStats";
import Loader from "../ui/Loader";
import type {
  Review,
  ReviewStats as ReviewStatsType,
} from "../../types/review";
import type { User } from "../../types";

interface CompletedFeedbackProps {
  reviews: Review[];
  loading: boolean;
  error: string | null;
  pagination: {
    page: number;
    totalPages: number;
    total: number;
  } | null;
  onLoadMore: () => void;
  onProfileClick: (user: User) => void;
  onJobClick: (jobId: string) => void;
}

const CompletedFeedback: React.FC<CompletedFeedbackProps> = memo(
  ({
    reviews,
    loading,
    error,
    pagination,
    onLoadMore,
    onProfileClick,
    onJobClick,
  }) => {
    const observerTarget = useRef<HTMLDivElement>(null);
    const isLoadingMore = useRef(false);

    const stats: ReviewStatsType = useMemo(() => {
      if (!reviews || !reviews.length) {
        return {
          averageRating: 0,
          totalReviews: 0,
          ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
        };
      }
      const totalReviews = reviews.length;
      const sumRatings = reviews.reduce(
        (sum, review) => sum + review.rating,
        0
      );
      const averageRating = totalReviews > 0 ? sumRatings / totalReviews : 0;
      const ratingDistribution = {
        5: reviews.filter((r) => r.rating === 5).length,
        4: reviews.filter((r) => r.rating === 4).length,
        3: reviews.filter((r) => r.rating === 3).length,
        2: reviews.filter((r) => r.rating === 2).length,
        1: reviews.filter((r) => r.rating === 1).length,
      };
      return { averageRating, totalReviews, ratingDistribution };
    }, [reviews]);

    const hasMorePages = useMemo(() => {
      return pagination ? pagination.page < pagination.totalPages : false;
    }, [pagination]);

    useEffect(() => {
      const observer = new IntersectionObserver(
        (entries) => {
          const [entry] = entries;
          if (
            entry.isIntersecting &&
            !loading &&
            hasMorePages &&
            !isLoadingMore.current
          ) {
            isLoadingMore.current = true;
            onLoadMore();
          }
        },
        { threshold: 0.1 }
      );

      const currentTarget = observerTarget.current;
      if (currentTarget) {
        observer.observe(currentTarget);
      }

      return () => {
        if (currentTarget) {
          observer.unobserve(currentTarget);
        }
      };
    }, [loading, hasMorePages, onLoadMore]);

    useEffect(() => {
      if (!loading) {
        isLoadingMore.current = false;
      }
    }, [loading]);

    return (
      <div className="bg-white rounded-lg shadow-sm border border-primary-200 p-4 sm:p-6 transition-all duration-200 ease-out">
        <div className="flex items-center justify-between mb-4">
          <Text size="lg" weight="semibold" className="text-primary-900">
            All Feedback
          </Text>
          <Text size="sm" className="text-primary-700">
            {pagination?.total || stats.totalReviews}{" "}
            {(pagination?.total || stats.totalReviews) === 1
              ? "Review"
              : "Reviews"}
          </Text>
        </div>

        <div className="mb-6">
          <ReviewStats stats={stats} />
        </div>

        {error && (
          <div className="mb-4 rounded-md bg-accent-50 px-4 py-2 text-sm text-accent-700">
            {error}
          </div>
        )}

        {loading && reviews.length === 0 ? (
          <div className="min-h-[200px] flex items-center justify-center">
            <Loader size="large" color="accent" />
          </div>
        ) : (
          <>
            <ReviewList
              reviews={reviews}
              onProfileClick={onProfileClick}
              onJobClick={onJobClick}
              showJobTitle={true}
              emptyMessage="No feedback yet"
            />

            {hasMorePages && (
              <div
                ref={observerTarget}
                className="py-4 sm:py-6 flex justify-center"
              >
                {loading ? (
                  <div className="flex flex-col sm:flex-row items-center gap-3 py-2">
                    <div className="w-8 h-8 sm:w-6 sm:h-6 border-3 sm:border-2 border-accent-500 border-t-transparent rounded-full animate-spin"></div>
                    <div className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2">
                      <Text
                        size="sm"
                        weight="medium"
                        className="text-primary-700"
                      >
                        Loading more feedback...
                      </Text>
                      <span className="hidden sm:inline text-primary-400">
                        •
                      </span>
                      <Text size="xs" className="text-primary-500">
                        Please wait
                      </Text>
                    </div>
                  </div>
                ) : (
                  <div className="h-4"></div>
                )}
              </div>
            )}

            {!hasMorePages && reviews.length > 0 && (
              <div className="text-center py-6 sm:py-8 border-t border-primary-200 mt-6">
                <div className="flex flex-col items-center gap-2">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-primary-50 flex items-center justify-center">
                    <svg
                      className="w-6 h-6 sm:w-7 sm:h-7 text-primary-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <Text
                    size="sm"
                    weight="medium"
                    className="text-primary-700 mt-1"
                  >
                    No more feedback
                  </Text>
                  <Text
                    size="xs"
                    className="text-primary-500 max-w-xs text-center"
                  >
                    You've reached the end of all feedback
                  </Text>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    );
  }
);

CompletedFeedback.displayName = "CompletedFeedback";

export default CompletedFeedback;
