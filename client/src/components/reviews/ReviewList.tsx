import React, { useMemo, memo } from "react";
import { Text } from "../reusable";
import ReviewDisplay from "./ReviewDisplay";
import type { Review } from "../../types/review";

export interface ReviewListProps {
  reviews: Review[];
  reviewerNames?: Record<string, string>;
  reviewerAvatars?: Record<string, string>;
  showJobTitle?: boolean;
  emptyMessage?: string;
  className?: string;
}

const ReviewList: React.FC<ReviewListProps> = memo(({
  reviews,
  reviewerNames = {},
  reviewerAvatars = {},
  showJobTitle = false,
  emptyMessage = "No reviews yet",
  className = "",
}) => {
  const sortedReviews = useMemo(() => {
    return [...reviews].sort((a, b) => {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [reviews]);

  if (sortedReviews.length === 0) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <Text size="sm" className="text-gray-500">
          {emptyMessage}
        </Text>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {sortedReviews.map((review) => (
        <ReviewDisplay
          key={review._id}
          review={review}
          reviewerName={reviewerNames[review.reviewerId]}
          reviewerAvatar={reviewerAvatars[review.reviewerId]}
          showJobTitle={showJobTitle}
        />
      ))}
    </div>
  );
});

ReviewList.displayName = "ReviewList";

export default ReviewList;

