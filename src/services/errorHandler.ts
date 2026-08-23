import { PostgrestError } from "@supabase/supabase-js";
import toast from "react-hot-toast";
import { captureError } from "./monitoring";

// Error types for different contexts
export enum ErrorContext {
  MEMBER_MANAGEMENT = "member_management",
  CLASS_SCHEDULING = "class_scheduling",
  BILLING = "billing",
  TRAINER_MANAGEMENT = "trainer_management",
  AUTHENTICATION = "authentication",
  AUTHORIZATION = "authorization",
  GENERAL = "general",
}

// User-friendly error messages mapping
const ERROR_MESSAGES: Record<string, Record<string, string>> = {
  [ErrorContext.MEMBER_MANAGEMENT]: {
    duplicate_key_value: "A member with this email address already exists",
    foreign_key_violation:
      "Cannot delete this member as they have active bookings or invoices",
    check_constraint_violation: "Invalid membership information provided",
    not_null_violation: "Required member information is missing",
    permission_denied: "You do not have permission to manage members",
    row_not_found: "Member not found",
    invalid_email: "Please provide a valid email address",
    membership_expired: "This membership has expired and cannot be modified",
  },
  [ErrorContext.CLASS_SCHEDULING]: {
    duplicate_key_value: "A class is already scheduled at this time",
    foreign_key_violation: "Invalid trainer or room selected",
    check_constraint_violation: "Class capacity or timing is invalid",
    capacity_exceeded: "This class is already at full capacity",
    booking_conflict: "Member already has a booking at this time",
    class_in_progress: "Cannot modify a class that is currently in progress",
    trainer_unavailable: "Trainer is not available at this time",
  },
  [ErrorContext.BILLING]: {
    duplicate_key_value: "An invoice with this number already exists",
    foreign_key_violation: "Invalid member or class selected for billing",
    payment_failed: "Payment processing failed. Please try again",
    invalid_amount: "Invalid payment amount",
    invoice_already_paid: "This invoice has already been paid",
    insufficient_permissions: "You do not have permission to process payments",
  },
  [ErrorContext.TRAINER_MANAGEMENT]: {
    duplicate_key_value: "A trainer with this email address already exists",
    foreign_key_violation: "Cannot delete trainer with active classes",
    invalid_specialization: "Please select valid specializations",
    trainer_has_active_classes:
      "Trainer has active classes and cannot be removed",
  },
  [ErrorContext.AUTHENTICATION]: {
    invalid_credentials: "Invalid email or password",
    email_not_confirmed: "Please check your email and confirm your account",
    weak_password: "Password must be at least 8 characters long",
    signup_disabled: "New registrations are currently disabled",
    session_expired: "Your session has expired. Please log in again",
  },
  [ErrorContext.AUTHORIZATION]: {
    permission_denied: "You do not have permission to perform this action",
    insufficient_permissions: "You do not have sufficient permissions",
    tenant_access_denied: "You do not have access to this tenant",
    no_tenant_access: "No tenant access available",
  },
  [ErrorContext.GENERAL]: {
    network_error:
      "Network connection error. Please check your internet connection",
    server_error: "Server is temporarily unavailable. Please try again",
    rate_limit_exceeded:
      "Too many requests. Please wait a moment and try again",
    insufficient_storage: "Storage limit reached. Please contact support",
  },
};

// Default fallback messages
const DEFAULT_MESSAGES = {
  unknown: "An unexpected error occurred. Please try again",
  permission_denied: "You do not have permission to perform this action",
  network_error: "Connection error. Please check your internet connection",
  server_error: "Server error. Please try again later",
};

export interface ProcessedError {
  userMessage: string;
  technicalMessage: string;
  code: string;
  context: ErrorContext;
  shouldLog: boolean;
  shouldShowToast: boolean;
}

class ErrorHandler {
  // Process different types of errors
  processError(
    error: unknown,
    context: ErrorContext = ErrorContext.GENERAL,
    showToast: boolean = true,
  ): ProcessedError {
    let processedError: ProcessedError;

    if (this.isPostgrestError(error)) {
      processedError = this.handlePostgrestError(error, context);
    } else if (this.isNetworkError(error)) {
      processedError = this.handleNetworkError(error, context);
    } else if (error instanceof Error) {
      processedError = this.handleGenericError(error, context);
    } else {
      processedError = this.handleUnknownError(error instanceof Error ? error : new Error(String(error)), context);
    }

    // Log error if needed
    if (processedError.shouldLog) {
      this.logError(processedError);
    }

    // Show toast notification if requested
    if (showToast && processedError.shouldShowToast) {
      toast.error(processedError.userMessage);
    }

    return processedError;
  }

  private isPostgrestError(error: unknown): error is PostgrestError {
    return (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      "message" in error
    );
  }

  private isNetworkError(error: unknown): error is Error {
    return (
      error instanceof Error &&
      (error.message.includes("fetch") ||
        error.message.includes("network") ||
        error.message.includes("Failed to fetch"))
    );
  }

  private handlePostgrestError(
    error: PostgrestError,
    context: ErrorContext,
  ): ProcessedError {
    const errorCode = this.mapPostgresErrorCode(error.code, error.message);
    const contextMessages = ERROR_MESSAGES[context] || {};
    const userMessage =
      contextMessages[errorCode] ||
      contextMessages[error.code] ||
      DEFAULT_MESSAGES.unknown;

    return {
      userMessage,
      technicalMessage: error.message,
      code: error.code,
      context,
      shouldLog: true,
      shouldShowToast: true,
    };
  }

  private handleNetworkError(
    error: Error,
    context: ErrorContext,
  ): ProcessedError {
    return {
      userMessage:
        ERROR_MESSAGES[context]?.network_error ||
        DEFAULT_MESSAGES.network_error,
      technicalMessage: error.message,
      code: "NETWORK_ERROR",
      context,
      shouldLog: true,
      shouldShowToast: true,
    };
  }

  private handleGenericError(
    error: Error,
    context: ErrorContext,
  ): ProcessedError {
    // Check for specific business logic errors
    const errorKey = this.mapGenericErrorToKey(error.message);
    const contextMessages = ERROR_MESSAGES[context] || {};
    const userMessage = contextMessages[errorKey] || DEFAULT_MESSAGES.unknown;

    return {
      userMessage,
      technicalMessage: error.message,
      code: "GENERIC_ERROR",
      context,
      shouldLog: true,
      shouldShowToast: true,
    };
  }

  private handleUnknownError(
    error: unknown,
    context: ErrorContext,
  ): ProcessedError {
    return {
      userMessage: DEFAULT_MESSAGES.unknown,
      technicalMessage: String(error),
      code: "UNKNOWN_ERROR",
      context,
      shouldLog: true,
      shouldShowToast: true,
    };
  }

  private mapPostgresErrorCode(code: string, message: string): string {
    // Map PostgreSQL error codes to business-friendly keys
    const postgresErrorMap: Record<string, string> = {
      "23505": "duplicate_key_value", // Unique violation
      "23503": "foreign_key_violation", // Foreign key violation
      "23514": "check_constraint_violation", // Check violation
      "23502": "not_null_violation", // Not null violation
      "42501": "permission_denied", // Insufficient privilege
      PGRST116: "row_not_found", // Row not found
    };

    // Check message content for specific business errors
    if (message.includes("capacity")) return "capacity_exceeded";
    if (message.includes("booking_conflict")) return "booking_conflict";
    if (message.includes("email")) return "invalid_email";
    if (message.includes("expired")) return "membership_expired";
    if (message.includes("in_progress")) return "class_in_progress";
    if (message.includes("payment_failed")) return "payment_failed";

    return postgresErrorMap[code] || code;
  }

  private mapGenericErrorToKey(message: string): string {
    const lowerMessage = message.toLowerCase();

    if (lowerMessage.includes("network") || lowerMessage.includes("fetch")) {
      return "network_error";
    }
    if (
      lowerMessage.includes("unauthorized") ||
      lowerMessage.includes("permission")
    ) {
      return "permission_denied";
    }
    if (lowerMessage.includes("rate limit")) {
      return "rate_limit_exceeded";
    }
    if (lowerMessage.includes("storage") || lowerMessage.includes("quota")) {
      return "insufficient_storage";
    }

    return "unknown";
  }

  private logError(error: ProcessedError): void {
    // In production, this would send to a logging service
    console.error("Error Handler Log:", {
      timestamp: new Date().toISOString(),
      userMessage: error.userMessage,
      technicalMessage: error.technicalMessage,
      code: error.code,
      context: error.context,
    });

    // Log to external service in production
    if (import.meta.env.PROD) {
      this.sendToLoggingService(error);
    }
  }

  private sendToLoggingService(error: ProcessedError): void {
    captureError(new Error(error.technicalMessage), {
      code: error.code,
      context: error.context,
      userMessage: error.userMessage,
    });
  }

  // Utility method for showing success messages
  showSuccess(message: string): void {
    toast.success(message);
  }

  // Utility method for showing info messages
  showInfo(message: string): void {
    toast(message, { icon: "ℹ️" });
  }

  // Utility method for showing warning messages
  showWarning(message: string): void {
    toast(message, { icon: "⚠️" });
  }
}

// Export singleton instance
export const errorHandler = new ErrorHandler();

// Convenience functions for common error contexts
export const handleMemberError = (error: unknown, showToast = true) =>
  errorHandler.processError(error, ErrorContext.MEMBER_MANAGEMENT, showToast);

export const handleClassError = (error: unknown, showToast = true) =>
  errorHandler.processError(error, ErrorContext.CLASS_SCHEDULING, showToast);

export const handleBillingError = (error: unknown, showToast = true) =>
  errorHandler.processError(error, ErrorContext.BILLING, showToast);

export const handleTrainerError = (error: unknown, showToast = true) =>
  errorHandler.processError(error, ErrorContext.TRAINER_MANAGEMENT, showToast);

export const handleAuthError = (error: unknown, showToast = true) =>
  errorHandler.processError(error, ErrorContext.AUTHENTICATION, showToast);
