import React, { useMemo, memo } from "react";
import { Star, User as UserIcon, Briefcase } from "lucide-react";
import { Text, Badge } from "../reusable";
import type { Review } from "../../types/review";
import type { User } from "../../types";
import { formatDate } from "../../utils/date";

export interface ReviewDisplayProps {
  review: Review;
  onProfileClick?: (user: User) => void;
  onJobClick?: (jobId: string) => void;
  showJobTitle?: boolean;
  className?: string;
}

const ReviewDisplay: React.FC<ReviewDisplayProps> = memo(
  ({
    review,
    onProfileClick,
    onJobClick,
    showJobTitle = false,
    className = "",
  }) => {
    const stars = useMemo(() => [1, 2, 3, 4, 5], []);

    const formattedDate = useMemo(() => {
      return formatDate(review.createdAt);
    }, [review.createdAt]);

    const reviewerName = useMemo(() => {
      return `${review.fromUser.firstName} ${review.fromUser.lastName}`;
    }, [review.fromUser]);

    const reviewerAvatar = review.fromUser.profileImage;

    return (
      <div
        className={`p-4 bg-white border border-primary-200 rounded-lg ${className}`}
      >
        <div className="flex items-start gap-3">
          {/* Reviewer Avatar - Clickable */}
          <div className="flex-shrink-0">
            <button
              onClick={() => onProfileClick?.(review.fromUser)}
              className="focus:outline-none focus:ring-2 focus:ring-primary-500 rounded-full transition-all hover:opacity-80 cursor-pointer disabled:cursor-default"
              disabled={!onProfileClick}
            >
              {reviewerAvatar ? (
                <img
                  src={reviewerAvatar}
                  alt={reviewerName}
                  className="h-10 w-10 rounded-full object-cover"
                />
              ) : (
                <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                  <UserIcon className="h-5 w-5 text-primary-600" />
                </div>
              )}
            </button>
          </div>

          {/* Review Content */}
          <div className="flex-1 min-w-0">
            {/* Header */}
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="min-w-0 flex-1">
                <button
                  onClick={() => onProfileClick?.(review.fromUser)}
                  className="text-left focus:outline-none hover:opacity-80 transition-opacity cursor-pointer disabled:cursor-default"
                  disabled={!onProfileClick}
                >
                  <Text
                    size="sm"
                    weight="semibold"
                    className="text-primary-900 truncate"
                  >
                    {reviewerName}
                  </Text>
                </button>
                {showJobTitle && review.job?.title && (
                  <button
                    onClick={() => review.job && onJobClick?.(review.job._id)}
                    className="flex items-center gap-1 mt-1 text-left focus:outline-none hover:opacity-80 transition-opacity cursor-pointer disabled:cursor-default"
                    disabled={!onJobClick || !review.job}
                  >
                    <Briefcase className="h-3 w-3 text-primary-500" />
                    <Text
                      size="xs"
                      className="text-primary-600 hover:text-primary-700"
                    >
                      {review.job.title}
                    </Text>
                  </button>
                )}
              </div>
              <div className="flex-shrink-0 flex items-center gap-1">
                {stars.map((star) => (
                  <Star
                    key={star}
                    className={`h-4 w-4 ${
                      star <= review.rating
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-gray-300"
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Rating Badge */}
            <div className="mb-2">
              <Badge variant="info" size="sm">
                {review.rating} {review.rating === 1 ? "star" : "stars"}
              </Badge>
              {review.isEdited && (
                <Badge variant="info" size="sm" className="ml-2">
                  Edited
                </Badge>
              )}
            </div>

            {/* Comment */}
            <Text
              size="sm"
              className="text-primary-700 mb-2 whitespace-pre-wrap break-words"
            >
              {review.comment}
            </Text>

            {/* Footer */}
            <div className="flex items-center justify-between mt-3 pt-2 border-t border-primary-100">
              <Text size="xs" className="text-gray-500">
                {formattedDate}
              </Text>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

ReviewDisplay.displayName = "ReviewDisplay";

export default ReviewDisplay;
