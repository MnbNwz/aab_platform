// Route-specific type definitions

// Common route types
export interface RouteHandler {
  (req: any, res: any): Promise<void>;
}

// Authentication route types
export interface AuthRequest {
  body: {
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
  };
}

// User route types
export interface UserRequest {
  params: {
    id: string;
  };
  body: {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
  };
}

// Property route types
export interface PropertyRequest {
  params: {
    id: string;
  };
  body: {
    title: string;
    propertyType: string;
    location: string;
    description?: string;
  };
  files?: any[];
}

// Job request types
export interface JobRequest {
  params: {
    id: string;
  };
  body: {
    title: string;
    description: string;
    service: string;
    estimate?: number;
    type?: string;
    timeline?: string;
  };
  files?: any[];
}

// Payment route types
export interface PaymentRequest {
  params: {
    paymentId?: string;
    jobPaymentId?: string;
    contractorId?: string;
  };
  body: {
    planId?: string;
    billingPeriod?: string;
    isPrepaid?: boolean;
    paymentMethod?: string;
    cancellationReason?: string;
  };
}
