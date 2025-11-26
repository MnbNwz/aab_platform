export interface Review {
  _id: string;
  jobRequest: string;
  fromUser: string;
  toUser: string;
  fromRole: "customer" | "contractor";
  rating: number; // 1 to 5
  comment?: string;
  job?: {
    _id: string;
    title: string;
    service: string;
    estimate: number;
    status: string;
  };
  createdAt: string;
  updatedAt: string;
  isVisible?: boolean;
  isEdited?: boolean;
}

export interface ReviewSubmission {
  jobRequestId: string;
  rating: number;
  comment?: string;
}

export interface ReviewStats {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
}

