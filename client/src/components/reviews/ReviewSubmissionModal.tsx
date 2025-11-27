import React, { useState, useCallback, useMemo, memo } from "react";
import { X, Star, Briefcase, Send } from "lucide-react";
import { BaseModal, Text, TextareaInput } from "../reusable";
import type { ReviewSubmission } from "../../types/review";

export interface ReviewSubmissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (review: ReviewSubmission) => void;
  jobTitle?: string;
  revieweeName?: string;
  loading?: boolean;
  existingReview?: {
    rating: number;
    comment: string;
  };
}

const ReviewSubmissionModal: React.FC<ReviewSubmissionModalProps> = memo(
  ({
    isOpen,
    onClose,
    onSubmit,
    jobTitle,
    revieweeName,
    loading = false,
    existingReview,
  }) => {
    const [rating, setRating] = useState<number>(existingReview?.rating || 0);
    const [comment, setComment] = useState<string>(
      existingReview?.comment || ""
    );
    const [errors, setErrors] = useState<{ rating?: string; comment?: string }>(
      {}
    );

    const handleRatingClick = useCallback(
      (value: number) => {
        setRating(value);
        if (errors.rating) {
          setErrors((prev) => ({ ...prev, rating: undefined }));
        }
      },
      [errors.rating]
    );

    const handleCommentChange = useCallback(
      (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setComment(e.target.value);
        if (errors.comment) {
          setErrors((prev) => ({ ...prev, comment: undefined }));
        }
      },
      [errors.comment]
    );

    const validate = useCallback((): boolean => {
      const newErrors: { rating?: string; comment?: string } = {};

      if (rating < 1 || rating > 5) {
        newErrors.rating = "Please select a rating";
      }

      if (!comment.trim()) {
        newErrors.comment = "Please provide your feedback";
      } else if (comment.trim().length < 10) {
        newErrors.comment = "Feedback must be at least 10 characters";
      } else if (comment.trim().length > 1000) {
        newErrors.comment = "Feedback must be less than 1000 characters";
      }

      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    }, [rating, comment]);

    const handleSubmit = useCallback(() => {
      if (!validate()) return;

      onSubmit({
        rating,
        comment: comment.trim(),
        jobRequestId: "", // Will be set by parent component
      });
    }, [rating, comment, validate, onSubmit]);

    const handleClose = useCallback(() => {
      if (!loading) {
        setRating(existingReview?.rating || 0);
        setComment(existingReview?.comment || "");
        setErrors({});
        onClose();
      }
    }, [loading, existingReview, onClose]);

    const stars = useMemo(() => [1, 2, 3, 4, 5], []);

    const modalFooter = useMemo(
      () => [
        {
          label: "Cancel",
          onClick: handleClose,
          variant: "secondary" as const,
          leftIcon: <X className="h-4 w-4" />,
          disabled: loading,
        },
        {
          label: existingReview ? "Update Review" : "Submit Review",
          onClick: handleSubmit,
          variant: "primary" as const,
          leftIcon: <Send className="h-4 w-4" />,
          loading,
          disabled: loading,
        },
      ],
      [handleClose, handleSubmit, loading, existingReview]
    );

    return (
      <BaseModal
        isOpen={isOpen}
        onClose={handleClose}
        title={existingReview ? "Edit Review" : "Leave a Review"}
        maxWidth="2xl"
        footer={modalFooter}
        showFooter={true}
        closeOnOverlayClick={!loading}
        closeOnEscape={!loading}
        bodyClassName="max-h-[calc(95vh-180px)] sm:max-h-[calc(95vh-200px)] overflow-y-auto"
      >
        <div className="space-y-4 sm:space-y-5 px-1">
          {/* Reviewee Name Section - Full Width */}
          {revieweeName && (
            <div className="p-4 sm:p-5 bg-gradient-to-r from-primary-50 to-accent-50 rounded-lg sm:rounded-xl border border-primary-200 w-full">
              <Text
                size="sm"
                weight="semibold"
                className="text-primary-900 break-words leading-tight"
              >
                {revieweeName}
              </Text>
            </div>
          )}

          {/* Job Info - Full Width */}
          {jobTitle && (
            <div className="p-4 sm:p-5 bg-primary-50 rounded-lg sm:rounded-xl border border-primary-200 w-full">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white rounded-lg shadow-sm flex-shrink-0">
                  <Briefcase className="h-4 w-4 sm:h-5 sm:w-5 text-primary-700" />
                </div>
                <div className="flex-1 min-w-0">
                  <Text
                    size="sm"
                    className="text-primary-900 break-words leading-tight"
                  >
                    {"Job Title: "}
                  </Text>
                  <Text
                    size="sm"
                    weight="semibold"
                    className="text-primary-900 break-words leading-tight"
                  >
                    {jobTitle}
                  </Text>
                </div>
              </div>
            </div>
          )}

          {/* Rating Section - Standard UX */}
          <div className="space-y-2 sm:space-y-3">
            <div className="flex items-center gap-2">
              <Text size="sm" weight="semibold" className="text-primary-900">
                Your Rating
              </Text>
              <span className="text-accent-500">*</span>
            </div>
            <div className="p-4 sm:p-5 bg-primary-50 rounded-lg sm:rounded-xl border border-primary-200">
              <div className="flex items-center justify-center gap-3 sm:gap-6">
                {/* Stars - Centered, standard UX */}
                {stars.map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => handleRatingClick(star)}
                    disabled={loading}
                    className="focus:outline-none transition-all duration-200 hover:scale-110 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label={`Rate ${star} star${star !== 1 ? "s" : ""}`}
                  >
                    <Star
                      className={`h-6 w-6 sm:h-7 sm:w-7 transition-all duration-200 ${
                        star <= rating
                          ? "fill-accent-500 text-accent-500"
                          : "text-primary-300 hover:text-accent-400"
                      }`}
                    />
                  </button>
                ))}
                {/* Selected Rating Display - Same row, at the end */}
                {rating > 0 && (
                  <div className="flex items-center gap-1.5 ml-2 sm:ml-4">
                    <Text
                      size="sm"
                      weight="semibold"
                      className="text-primary-900"
                    >
                      {rating} {rating === 1 ? "star" : "stars"}
                    </Text>
                  </div>
                )}
              </div>
            </div>
            {errors.rating && (
              <div className="p-2.5 sm:p-3 bg-red-50 border border-red-200 rounded-lg">
                <Text size="xs" className="text-red-600">
                  {errors.rating}
                </Text>
              </div>
            )}
          </div>

          {/* Feedback Section */}
          <div className="space-y-2 sm:space-y-3">
            <div className="flex items-center gap-2">
              <Text size="sm" weight="semibold" className="text-primary-900">
                Your Feedback
              </Text>
              <span className="text-accent-500">*</span>
            </div>
            <div className="relative">
              <TextareaInput
                value={comment}
                onChange={handleCommentChange}
                placeholder="Share your experience and provide helpful feedback. What went well? What could be improved?"
                rows={4}
                disabled={loading}
                className={`w-full transition-all text-sm sm:text-base ${
                  errors.comment
                    ? "border-red-500 focus:ring-red-500 focus:border-red-500"
                    : "border-primary-300 focus:border-primary-700 focus:ring-primary-700"
                }`}
                maxLength={1000}
              />
              <div className="flex items-center justify-between mt-2">
                {errors.comment && (
                  <div className="flex items-center gap-1">
                    <Text size="xs" className="text-red-600">
                      {errors.comment}
                    </Text>
                  </div>
                )}
                <Text
                  size="xs"
                  className={`ml-auto font-medium ${
                    comment.length > 950
                      ? "text-red-500"
                      : comment.length > 800
                      ? "text-accent-600"
                      : "text-primary-500"
                  }`}
                >
                  {comment.length}/1000 characters
                </Text>
              </div>
            </div>
          </div>

          {/* Help Text - Brand Colors */}
          <div className="p-3 sm:p-4 bg-accent-50 border border-accent-200 rounded-lg sm:rounded-xl">
            <Text size="xs" className="text-primary-700">
              <strong className="font-semibold text-primary-900">Tip:</strong>{" "}
              Be specific and constructive. Your feedback helps improve the
              service quality for everyone.
            </Text>
          </div>
        </div>
      </BaseModal>
    );
  }
);

ReviewSubmissionModal.displayName = "ReviewSubmissionModal";

export default ReviewSubmissionModal;
