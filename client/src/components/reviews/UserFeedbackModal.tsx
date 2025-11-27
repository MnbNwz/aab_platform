import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import { X, MessageSquare } from "lucide-react";
import { BaseModal, Text } from "../reusable";
import ReviewList from "./ReviewList";
import ReviewStats from "./ReviewStats";
import ProfileViewModal from "../ProfileViewModal";
import JobDetailViewModal from "../JobDetailViewModal";
import type {
  Review,
  ReviewStats as ReviewStatsType,
} from "../../types/review";
import type { User } from "../../types";
import { feedbackApi } from "../../services/feedbackService";
import { handleApiError } from "../../services/apiService";
import Loader from "../ui/Loader";

interface UserFeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  userName: string;
}

interface PaginationInfo {
  page: number;
  totalPages: number;
  total: number;
  limit: number;
}

const ITEMS_PER_PAGE = 10;

const UserFeedbackModal: React.FC<UserFeedbackModalProps> = ({
  isOpen,
  onClose,
  userId,
  userName,
}) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [jobDetailOpen, setJobDetailOpen] = useState(false);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);

  const observerTarget = useRef<HTMLDivElement>(null);
  const isLoadingMore = useRef(false);
  const currentPageRef = useRef(1);
  const isInitializedRef = useRef(false);

  const fetchFeedback = useCallback(
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

        setReviews((prev) =>
          append ? [...prev, ...reviewsData] : reviewsData
        );
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
    if (!pagination || loading || isLoadingMore.current) return;
    if (currentPageRef.current >= pagination.totalPages) return;

    isLoadingMore.current = true;
    const nextPage = currentPageRef.current + 1;
    void fetchFeedback(nextPage, true);
  }, [pagination, loading, fetchFeedback]);

  useEffect(() => {
    if (isOpen && userId && !isInitializedRef.current) {
      isInitializedRef.current = true;
      currentPageRef.current = 1;
      void fetchFeedback(1, false);
    }
  }, [isOpen, userId, fetchFeedback]);

  useEffect(() => {
    if (!isOpen) {
      isInitializedRef.current = false;
      setReviews([]);
      setPagination(null);
      currentPageRef.current = 1;
      isLoadingMore.current = false;
    }
  }, [isOpen]);

  useEffect(() => {
    if (!loading) {
      isLoadingMore.current = false;
    }
  }, [loading]);

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
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget && hasMorePages) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [loading, hasMorePages, loadMore]);

  const handleProfileClick = useCallback((user: User) => {
    setSelectedUser(user);
    setProfileModalOpen(true);
  }, []);

  const handleJobClick = useCallback((jobId: string) => {
    setSelectedJobId(jobId);
    setJobDetailOpen(true);
  }, []);

  const stats: ReviewStatsType = useMemo(() => {
    if (reviews.length === 0) {
      return {
        averageRating: 0,
        totalReviews: 0,
        ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
      };
    }

    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = totalRating / reviews.length;

    const distribution = reviews.reduce(
      (acc, review) => {
        acc[review.rating] = (acc[review.rating] || 0) + 1;
        return acc;
      },
      { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 } as Record<number, number>
    );

    return {
      averageRating: Number(averageRating.toFixed(1)),
      totalReviews: reviews.length,
      ratingDistribution: distribution as {
        5: number;
        4: number;
        3: number;
        2: number;
        1: number;
      },
    };
  }, [reviews]);

  const modalFooter = [
    {
      label: "Close",
      onClick: onClose,
      variant: "secondary" as const,
      leftIcon: <X className="h-4 w-4" />,
    },
  ];

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={`Feedback for ${userName}`}
      maxWidth="4xl"
      footer={modalFooter}
      showFooter={true}
      bodyClassName="max-h-[calc(95vh-180px)] sm:max-h-[calc(95vh-200px)] overflow-y-auto"
    >
      <div className="space-y-4 sm:space-y-6">
        {loading && reviews.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <Loader size="large" color="primary" />
          </div>
        ) : error ? (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <Text size="sm" className="text-red-600">
              {error}
            </Text>
          </div>
        ) : reviews.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-primary-100 rounded-full flex items-center justify-center mb-4">
              <MessageSquare className="h-8 w-8 sm:h-10 sm:w-10 text-primary-600" />
            </div>
            <Text
              size="lg"
              weight="semibold"
              className="text-primary-900 mb-2 text-center"
            >
              No Feedback Yet
            </Text>
            <Text size="sm" className="text-primary-600 text-center max-w-md">
              This user hasn't received any feedback yet. Feedback will appear
              here once they complete jobs.
            </Text>
          </div>
        ) : (
          <>
            <ReviewStats stats={stats} />

            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-primary-200 pb-2">
                <Text size="lg" weight="semibold" className="text-primary-900">
                  All Feedback ({pagination?.total || 0})
                </Text>
              </div>

              <ReviewList
                reviews={reviews}
                onProfileClick={handleProfileClick}
                onJobClick={handleJobClick}
                showJobTitle={true}
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
            </div>
          </>
        )}
      </div>

      {profileModalOpen && selectedUser && (
        <ProfileViewModal
          user={selectedUser}
          isOpen={profileModalOpen}
          onClose={() => {
            setProfileModalOpen(false);
            setSelectedUser(null);
          }}
        />
      )}

      {jobDetailOpen && selectedJobId && (
        <JobDetailViewModal
          isOpen={jobDetailOpen}
          onClose={() => {
            setJobDetailOpen(false);
            setSelectedJobId(null);
          }}
          job={null}
          jobId={selectedJobId}
          onRefreshJobs={() => {}}
        />
      )}
    </BaseModal>
  );
};

export default UserFeedbackModal;
