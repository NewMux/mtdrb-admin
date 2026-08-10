import { SupabaseClient } from "@supabase/supabase-js";

// Note: "react-big-calendar" and "papaparse" ship their own types via
// @types/react-big-calendar and @types/papaparse (both installed), so no
// ambient module shims are declared here for them.

declare global {
  interface Window {
    supabase: SupabaseClient;
  }

  type ApiResponse<T> = {
    data: T | null;
    error: string | null;
  };

  type PaginationParams = {
    page: number;
    limit: number;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
  };

  type FilterParams = {
    search?: string;
    status?: string;
    dateRange?: {
      start: string;
      end: string;
    };
  };

  type QueryParams = PaginationParams & FilterParams;

  type ApiError = {
    message: string;
    code?: string;
    details?: Record<string, unknown>;
  };

  type ApiSuccess<T> = {
    data: T;
    message?: string;
  };

  type ApiResult<T> = ApiSuccess<T> | ApiError;
}

export {};
