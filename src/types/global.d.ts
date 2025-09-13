import { SupabaseClient } from "@supabase/supabase-js";

declare module "react-big-calendar" {
  export const Calendar: any;
  export const Views: any;
  export const dateFnsLocalizer: any;
  export const withDragAndDrop: any;
}

declare module "react-big-calendar/lib/addons/dragAndDrop" {
  const withDragAndDrop: any;
  export default withDragAndDrop;
}

declare module "papaparse" {
  const Papa: any;
  export default Papa;
}

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
