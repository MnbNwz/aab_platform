export enum PaymentErrorType {
  USER_NOT_FOUND = "USER_NOT_FOUND",
  PAYMENT_NOT_FOUND = "PAYMENT_NOT_FOUND",
  INVALID_PAYMENT_INTENT = "INVALID_PAYMENT_INTENT",
  STRIPE_ERROR = "STRIPE_ERROR",
  INSUFFICIENT_FUNDS = "INSUFFICIENT_FUNDS",
  PAYMENT_FAILED = "PAYMENT_FAILED",
  REFUND_FAILED = "REFUND_FAILED",
  MEMBERSHIP_PLAN_NOT_FOUND = "MEMBERSHIP_PLAN_NOT_FOUND",
  JOB_PAYMENT_NOT_FOUND = "JOB_PAYMENT_NOT_FOUND",
  OFF_MARKET_PAYMENT_NOT_FOUND = "OFF_MARKET_PAYMENT_NOT_FOUND",
  CONTRACTOR_NOT_FOUND = "CONTRACTOR_NOT_FOUND",
  INVALID_AMOUNT = "INVALID_AMOUNT",
  PAYMENT_ALREADY_PROCESSED = "PAYMENT_ALREADY_PROCESSED",
  UNAUTHORIZED_ACCESS = "UNAUTHORIZED_ACCESS",
}

export class PaymentError extends Error {
  public readonly type: PaymentErrorType;
  public readonly statusCode: number;

  constructor(type: PaymentErrorType, message: string, statusCode: number = 400) {
    super(message);
    this.name = "PaymentError";
    this.type = type;
    this.statusCode = statusCode;
  }
}

export interface PaymentResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    type: PaymentErrorType;
    message: string;
    code: string;
  };
  message?: string;
}

export interface OptimisticUpdateResult<T = any> {
  success: boolean;
  data?: T;
  rollback?: () => Promise<void>;
}
