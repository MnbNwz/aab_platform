import { useReducer, useCallback } from "react";
import type { Review } from "../../../types/review";
import type { PendingFeedbackJob } from "../../../services/feedbackService";
import type { User } from "../../../types";

interface PaginationState {
  page: number;
  total: number;
  totalPages: number;
  limit: number;
}

interface CompletedState {
  data: Review[];
  loading: boolean;
  error: string | null;
  pagination: PaginationState | null;
}

interface PendingState {
  data: PendingFeedbackJob[];
  loading: boolean;
  error: string | null;
  pagination: PaginationState | null;
}

interface ModalsState {
  jobDetail: {
    isOpen: boolean;
    jobId: string | null;
    selectedPendingJob: PendingFeedbackJob | null;
    isFromCompleted: boolean;
  };
  feedback: {
    isOpen: boolean;
    submitting: boolean;
    revieweeName: string | undefined;
  };
  profile: {
    isOpen: boolean;
    selectedUser: User | null;
  };
}

interface ReviewsState {
  activeTab: "completed" | "pending";
  completed: CompletedState;
  pending: PendingState;
  modals: ModalsState;
}

type ReviewsAction =
  | { type: "SET_TAB"; payload: "completed" | "pending" }
  // Completed actions
  | { type: "FETCH_COMPLETED_START" }
  | {
      type: "FETCH_COMPLETED_SUCCESS";
      payload: { data: Review[]; pagination: PaginationState };
    }
  | { type: "FETCH_COMPLETED_ERROR"; payload: string }
  | { type: "SET_COMPLETED_PAGE"; payload: number }
  // Pending actions
  | { type: "FETCH_PENDING_START" }
  | {
      type: "FETCH_PENDING_SUCCESS";
      payload: { data: PendingFeedbackJob[]; pagination: PaginationState };
    }
  | { type: "FETCH_PENDING_ERROR"; payload: string }
  | { type: "SET_PENDING_PAGE"; payload: number }
  // Modal actions
  | {
      type: "OPEN_JOB_DETAIL";
      payload: {
        jobId: string;
        pendingJob?: PendingFeedbackJob | null;
        isFromCompleted: boolean;
      };
    }
  | { type: "CLOSE_JOB_DETAIL" }
  | { type: "OPEN_FEEDBACK_MODAL"; payload?: string }
  | { type: "CLOSE_FEEDBACK_MODAL" }
  | { type: "SET_FEEDBACK_SUBMITTING"; payload: boolean }
  | { type: "OPEN_PROFILE_MODAL"; payload: User }
  | { type: "CLOSE_PROFILE_MODAL" };

const initialState: ReviewsState = {
  activeTab: "completed",
  completed: {
    data: [],
    loading: false,
    error: null,
    pagination: null,
  },
  pending: {
    data: [],
    loading: false,
    error: null,
    pagination: null,
  },
  modals: {
    jobDetail: {
      isOpen: false,
      jobId: null,
      selectedPendingJob: null,
      isFromCompleted: false,
    },
    feedback: {
      isOpen: false,
      submitting: false,
      revieweeName: undefined,
    },
    profile: {
      isOpen: false,
      selectedUser: null,
    },
  },
};

function reviewsReducer(
  state: ReviewsState,
  action: ReviewsAction
): ReviewsState {
  switch (action.type) {
    case "SET_TAB":
      return { ...state, activeTab: action.payload };

    // Completed feedback actions
    case "FETCH_COMPLETED_START":
      return {
        ...state,
        completed: { ...state.completed, loading: true, error: null },
      };
    case "FETCH_COMPLETED_SUCCESS":
      return {
        ...state,
        completed: {
          ...state.completed,
          loading: false,
          data: action.payload.data,
          pagination: action.payload.pagination,
        },
      };
    case "FETCH_COMPLETED_ERROR":
      return {
        ...state,
        completed: {
          ...state.completed,
          loading: false,
          error: action.payload,
        },
      };
    case "SET_COMPLETED_PAGE":
      return {
        ...state,
        completed: {
          ...state.completed,
          pagination: state.completed.pagination
            ? { ...state.completed.pagination, page: action.payload }
            : null,
        },
      };

    // Pending feedback actions
    case "FETCH_PENDING_START":
      return {
        ...state,
        pending: { ...state.pending, loading: true, error: null },
      };
    case "FETCH_PENDING_SUCCESS":
      return {
        ...state,
        pending: {
          ...state.pending,
          loading: false,
          data: action.payload.data,
          pagination: action.payload.pagination,
        },
      };
    case "FETCH_PENDING_ERROR":
      return {
        ...state,
        pending: { ...state.pending, loading: false, error: action.payload },
      };
    case "SET_PENDING_PAGE":
      return {
        ...state,
        pending: {
          ...state.pending,
          pagination: state.pending.pagination
            ? { ...state.pending.pagination, page: action.payload }
            : null,
        },
      };

    // Modal actions
    case "OPEN_JOB_DETAIL":
      return {
        ...state,
        modals: {
          ...state.modals,
          jobDetail: {
            isOpen: true,
            jobId: action.payload.jobId,
            selectedPendingJob: action.payload.pendingJob || null,
            isFromCompleted: action.payload.isFromCompleted,
          },
        },
      };
    case "CLOSE_JOB_DETAIL":
      return {
        ...state,
        modals: {
          ...state.modals,
          jobDetail: {
            isOpen: false,
            jobId: null,
            selectedPendingJob: null,
            isFromCompleted: false,
          },
        },
      };
    case "OPEN_FEEDBACK_MODAL":
      return {
        ...state,
        modals: {
          ...state.modals,
          feedback: {
            ...state.modals.feedback,
            isOpen: true,
            revieweeName: action.payload,
          },
        },
      };
    case "CLOSE_FEEDBACK_MODAL":
      return {
        ...state,
        modals: {
          ...state.modals,
          feedback: {
            ...state.modals.feedback,
            isOpen: false,
            submitting: false,
          },
        },
      };
    case "SET_FEEDBACK_SUBMITTING":
      return {
        ...state,
        modals: {
          ...state.modals,
          feedback: { ...state.modals.feedback, submitting: action.payload },
        },
      };
    case "OPEN_PROFILE_MODAL":
      return {
        ...state,
        modals: {
          ...state.modals,
          profile: {
            isOpen: true,
            selectedUser: action.payload,
          },
        },
      };
    case "CLOSE_PROFILE_MODAL":
      return {
        ...state,
        modals: {
          ...state.modals,
          profile: { isOpen: false, selectedUser: null },
        },
      };

    default:
      return state;
  }
}

export function useReviewsState() {
  const [state, dispatch] = useReducer(reviewsReducer, initialState);

  const actions = {
    setTab: useCallback(
      (tab: "completed" | "pending") =>
        dispatch({ type: "SET_TAB", payload: tab }),
      []
    ),

    // Completed actions
    fetchCompletedStart: useCallback(
      () => dispatch({ type: "FETCH_COMPLETED_START" }),
      []
    ),
    fetchCompletedSuccess: useCallback(
      (data: Review[], pagination: PaginationState) =>
        dispatch({
          type: "FETCH_COMPLETED_SUCCESS",
          payload: { data, pagination },
        }),
      []
    ),
    fetchCompletedError: useCallback(
      (error: string) =>
        dispatch({ type: "FETCH_COMPLETED_ERROR", payload: error }),
      []
    ),
    setCompletedPage: useCallback(
      (page: number) => dispatch({ type: "SET_COMPLETED_PAGE", payload: page }),
      []
    ),

    // Pending actions
    fetchPendingStart: useCallback(
      () => dispatch({ type: "FETCH_PENDING_START" }),
      []
    ),
    fetchPendingSuccess: useCallback(
      (data: PendingFeedbackJob[], pagination: PaginationState) =>
        dispatch({
          type: "FETCH_PENDING_SUCCESS",
          payload: { data, pagination },
        }),
      []
    ),
    fetchPendingError: useCallback(
      (error: string) =>
        dispatch({ type: "FETCH_PENDING_ERROR", payload: error }),
      []
    ),
    setPendingPage: useCallback(
      (page: number) => dispatch({ type: "SET_PENDING_PAGE", payload: page }),
      []
    ),

    // Modal actions
    openJobDetail: useCallback(
      (
        jobId: string,
        options: {
          pendingJob?: PendingFeedbackJob | null;
          isFromCompleted: boolean;
        }
      ) =>
        dispatch({
          type: "OPEN_JOB_DETAIL",
          payload: { jobId, ...options },
        }),
      []
    ),
    closeJobDetail: useCallback(
      () => dispatch({ type: "CLOSE_JOB_DETAIL" }),
      []
    ),
    openFeedbackModal: useCallback(
      (revieweeName?: string) =>
        dispatch({ type: "OPEN_FEEDBACK_MODAL", payload: revieweeName }),
      []
    ),
    closeFeedbackModal: useCallback(
      () => dispatch({ type: "CLOSE_FEEDBACK_MODAL" }),
      []
    ),
    setFeedbackSubmitting: useCallback(
      (submitting: boolean) =>
        dispatch({ type: "SET_FEEDBACK_SUBMITTING", payload: submitting }),
      []
    ),
    openProfileModal: useCallback(
      (user: User) => dispatch({ type: "OPEN_PROFILE_MODAL", payload: user }),
      []
    ),
    closeProfileModal: useCallback(
      () => dispatch({ type: "CLOSE_PROFILE_MODAL" }),
      []
    ),
  };

  return { state, actions };
}
