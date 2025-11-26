import React, { useMemo, memo } from "react";
import { Star } from "lucide-react";
import { Text } from "../reusable";
import type { ReviewStats as ReviewStatsType } from "../../types/review";

export interface ReviewStatsProps {
  stats: ReviewStatsType;
  className?: string;
}

const ReviewStats: React.FC<ReviewStatsProps> = memo(({
  stats,
  className = "",
}) => {
  const stars = useMemo(() => [5, 4, 3, 2, 1], []);

  const ratingPercentage = useMemo(() => {
    if (stats.totalReviews === 0) return 0;
    return (stats.averageRating / 5) * 100;
  }, [stats.averageRating, stats.totalReviews]);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Overall Stats */}
      <div className="flex items-center gap-4 p-4 bg-primary-50 rounded-lg">
        <div className="text-center">
          <Text size="xl" weight="bold" className="text-primary-900">
            {stats.averageRating.toFixed(1)}
          </Text>
          <div className="flex items-center gap-1 mt-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`h-4 w-4 ${
                  star <= Math.round(stats.averageRating)
                    ? "fill-yellow-400 text-yellow-400"
                    : "text-gray-300"
                }`}
              />
            ))}
          </div>
        </div>
        <div className="flex-1">
          <Text size="lg" weight="semibold" className="text-primary-900">
            {stats.totalReviews} {stats.totalReviews === 1 ? "Review" : "Reviews"}
          </Text>
          <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-yellow-400 h-2 rounded-full transition-all"
              style={{ width: `${ratingPercentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* Rating Distribution */}
      <div className="space-y-2">
        <Text size="sm" weight="medium" className="text-primary-700">
          Rating Distribution
        </Text>
        {stars.map((star) => {
          const count = stats.ratingDistribution[star as keyof typeof stats.ratingDistribution];
          const percentage = stats.totalReviews > 0 
            ? (count / stats.totalReviews) * 100 
            : 0;

          return (
            <div key={star} className="flex items-center gap-2">
              <div className="flex items-center gap-1 w-20">
                <Text size="sm" className="text-primary-700 w-4">
                  {star}
                </Text>
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              </div>
              <div className="flex-1 bg-gray-200 rounded-full h-2">
                <div
                  className="bg-yellow-400 h-2 rounded-full transition-all"
                  style={{ width: `${percentage}%` }}
                />
              </div>
              <Text size="sm" className="text-primary-600 w-12 text-right">
                {count}
              </Text>
            </div>
          );
        })}
      </div>
    </div>
  );
});

ReviewStats.displayName = "ReviewStats";

export default ReviewStats;

