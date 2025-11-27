import React, { useMemo, memo } from "react";
import { Text } from "../reusable";
import ReviewDisplay from "./ReviewDisplay";
import type { Review } from "../../types/review";
import type { User } from "../../types";

export interface ReviewListProps {
  reviews?: Review[];
  onProfileClick?: (user: User) => void;
  onJobClick?: (jobId: string) => void;
  showJobTitle?: boolean;
  emptyMessage?: string;
  className?: string;
}

const ReviewList: React.FC<ReviewListProps> = memo(({
  reviews = [],
  onProfileClick,
  onJobClick,
  showJobTitle = false,
  emptyMessage = "No reviews yet",
  className = "",
}) => {
  const sortedReviews = useMemo(() => {
    if (!reviews || !Array.isArray(reviews)) {
      return [];
    }
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
          onProfileClick={onProfileClick}
          onJobClick={onJobClick}
          showJobTitle={showJobTitle}
        />
      ))}
    </div>
  );
});

ReviewList.displayName = "ReviewList";

export default ReviewList;

