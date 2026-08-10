import { supabase } from "../supabaseClient";
import type { User } from "@supabase/supabase-js";
import { errorHandler, ErrorContext } from "../services/errorHandler";
import {
  validateInput,
  validateUUID,
  validateTenantAccess,
  sanitizeInput,
  createMemberSchema,
  updateMemberSchema,
  createClassSchema,
  paginationSchema,
  memberFilterSchema,
  classFilterSchema,
  type CreateMemberData,
  type UpdateMemberData,
  type CreateClassData,
  type PaginationParams,
  type MemberFilterParams,
  type ClassFilterParams,
} from "./validation";
import type { ApiResponse, Class, Member } from "../types";
// Removed mock data - using real data from Supabase
// Removed isDev - always use real Supabase

// Rate limiting implementation
class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  private readonly windowMs: number = 60000; // 1 minute
  private readonly maxRequests: number = 100; // 100 requests per minute

  isAllowed(identifier: string): boolean {
    const now = Date.now();
    const userRequests = this.requests.get(identifier) || [];

    // Remove old requests outside the window
    const validRequests = userRequests.filter(
      (time) => now - time < this.windowMs,
    );

    if (validRequests.length >= this.maxRequests) {
      return false;
    }

    validRequests.push(now);
    this.requests.set(identifier, validRequests);
    return true;
  }

  getRemainingRequests(identifier: string): number {
    const userRequests = this.requests.get(identifier) || [];
    const now = Date.now();
    const validRequests = userRequests.filter(
      (time) => now - time < this.windowMs,
    );
    return Math.max(0, this.maxRequests - validRequests.length);
  }
}

const rateLimiter = new RateLimiter();

// Enhanced API Response type with security info
interface SecureApiResponse<T> extends ApiResponse<T> {
  requestId: string;
  timestamp: number;
  rateLimit: {
    remaining: number;
    reset: number;
  };
}

// Base secure API client
class SecureApiClient {
  private async checkAuth(): Promise<{ user: User; tenantId: string }> {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      throw errorHandler.processError(
        new Error("Authentication required"),
        ErrorContext.AUTHENTICATION,
        false,
      );
    }

    // Get tenant ID from user metadata or memberships
    let tenantId = user.user_metadata?.tenant_id;
    if (!tenantId) {
      const { data: membershipData } = await supabase
        .from("memberships")
        .select("tenant_id")
        .eq("user_id", user.id)
        .single();

      if (membershipData) {
        tenantId = membershipData.tenant_id;
      }
    }

    if (!tenantId) {
      throw errorHandler.processError(
        new Error("No tenant access"),
        ErrorContext.AUTHORIZATION,
        false,
      );
    }

    return { user, tenantId };
  }

  private async checkRateLimit(userId: string): Promise<void> {
    if (!rateLimiter.isAllowed(userId)) {
      throw errorHandler.processError(
        new Error("Rate limit exceeded"),
        ErrorContext.GENERAL,
        false,
      );
    }
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Normalize non-Error values into an Error instance.
   */
  private normalizeError(error: unknown): Error | null {
    if (!error) {
      return null;
    }
    if (error instanceof Error) {
      return error;
    }
    if (typeof error === "object" && error !== null && "message" in error) {
      const message =
        typeof (error as { message?: unknown }).message === "string"
          ? (error as { message?: string }).message
          : "Unknown error";
      return new Error(message);
    }
    return new Error(String(error));
  }

  private wrapResponse<T>(
    data: T,
    error: unknown,
    userId: string,
  ): SecureApiResponse<T> {
    return {
      data,
      error: this.normalizeError(error),
      requestId: this.generateRequestId(),
      timestamp: Date.now(),
      rateLimit: {
        remaining: rateLimiter.getRemainingRequests(userId),
        reset: Date.now() + 60000, // 1 minute from now
      },
    };
  }

  // Secure member operations
  async getMembers(
    filters?: MemberFilterParams,
    pagination?: PaginationParams,
  ): Promise<SecureApiResponse<Member[]>> {
    const { user, tenantId } = await this.checkAuth();
    await this.checkRateLimit(user.id);

    try {
      // Validate filters and pagination
      const validatedFilters = filters
        ? validateInput(memberFilterSchema, filters)
        : { success: true, data: {} };
      const validatedPagination = pagination
        ? validateInput(paginationSchema, pagination)
        : { success: true, data: { page: 1, limit: 20 } };

      if (!validatedFilters.success) {
        const errors = 'errors' in validatedFilters ? validatedFilters.errors : [];
        throw new Error(
          `Invalid filters: ${errors.join(", ") || "Invalid filter parameters"}`,
        );
      }

      if (!validatedPagination.success) {
        const errors = 'errors' in validatedPagination ? validatedPagination.errors : [];
        throw new Error(
          `Invalid pagination: ${errors.join(", ") || "Invalid pagination parameters"}`,
        );
      }

      let query = supabase
        .from("members")
        .select("*")
        .eq("tenant_id", tenantId);

      // Apply filters
      const filterData = validatedFilters.data as MemberFilterParams;
      if (filterData.status) {
        query = query.eq("status", filterData.status);
      }
      if (filterData.membership_type) {
        query = query.eq(
          "membership_type",
          filterData.membership_type,
        );
      }
      if (filterData.search) {
        const searchTerm = sanitizeInput(filterData.search);
        query = query.or(
          `first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`,
        );
      }

      // Apply pagination
      const paginationData = validatedPagination.data as PaginationParams;
      const page = paginationData.page ?? 1;
      const limit = paginationData.limit ?? 20;
      const from = (page - 1) * limit;
      const to = from + limit - 1;
      query = query.range(from, to);

      const { data, error } = await query.order("created_at", {
        ascending: false,
      });

      return this.wrapResponse(data || [], error, user.id);
    } catch (error) {
      const processedError = errorHandler.processError(
        error,
        ErrorContext.MEMBER_MANAGEMENT,
        false,
      );
      return this.wrapResponse([], processedError, user.id);
    }
  }

  async createMember(
    memberData: CreateMemberData,
  ): Promise<SecureApiResponse<Member | null>> {
    const { user, tenantId } = await this.checkAuth();
    await this.checkRateLimit(user.id);

    try {
      // Validate input data
      const validation = validateInput(createMemberSchema, {
        ...memberData,
        tenant_id: tenantId,
      });
      if (!validation.success) {
        const errors = 'errors' in validation ? validation.errors : [];
        throw new Error(`Validation failed: ${errors.join(", ")}`);
      }

      // Check for duplicate email
      const { data: existingMember } = await supabase
        .from("members")
        .select("id")
        .eq("tenant_id", tenantId)
        .eq("email", validation.data.email)
        .single();

      if (existingMember) {
        throw new Error("A member with this email already exists");
      }

      // Validate trainer assignment if provided (trainer_id is not in member schema, skip this check)
      // Note: trainer_id would need to be added to CreateMemberData type if needed

      const { data, error } = await supabase
        .from("members")
        .insert(validation.data)
        .select()
        .single();

      return this.wrapResponse(data ?? null, error, user.id);
    } catch (error) {
      const processedError = errorHandler.processError(
        error,
        ErrorContext.MEMBER_MANAGEMENT,
        false,
      );
      return this.wrapResponse(null, processedError, user.id);
    }
  }

  async updateMember(
    memberId: string,
    memberData: UpdateMemberData,
  ): Promise<SecureApiResponse<Member | null>> {
    const { user, tenantId } = await this.checkAuth();
    await this.checkRateLimit(user.id);

    try {
      // Validate member ID
      const uuidValidation = validateUUID(memberId, "Member ID");
      if (!uuidValidation.success) {
        throw new Error(uuidValidation.error);
      }

      // Validate input data
      const validation = validateInput(updateMemberSchema, memberData);
      if (!validation.success) {
        const errors = 'errors' in validation ? validation.errors : [];
        throw new Error(`Validation failed: ${errors.join(", ")}`);
      }

      // Check member exists and belongs to tenant
      const { data: existingMember } = await supabase
        .from("members")
        .select("id, tenant_id")
        .eq("id", memberId)
        .single();

      if (!existingMember) {
        throw new Error("Member not found");
      }

      if (!validateTenantAccess(tenantId, existingMember.tenant_id)) {
        throw new Error("Access denied");
      }

      // Check for duplicate email if email is being updated
      if (validation.data.email) {
        const { data: duplicateMember } = await supabase
          .from("members")
          .select("id")
          .eq("tenant_id", tenantId)
          .eq("email", validation.data.email)
          .neq("id", memberId)
          .single();

        if (duplicateMember) {
          throw new Error("A member with this email already exists");
        }
      }

      const { data, error } = await supabase
        .from("members")
        .update(validation.data)
        .eq("id", memberId)
        .eq("tenant_id", tenantId)
        .select()
        .single();

      return this.wrapResponse(data ?? null, error, user.id);
    } catch (error) {
      const processedError = errorHandler.processError(
        error,
        ErrorContext.MEMBER_MANAGEMENT,
        false,
      );
      return this.wrapResponse(null, processedError, user.id);
    }
  }

  async deleteMember(memberId: string): Promise<SecureApiResponse<Member[]>> {
    const { user, tenantId } = await this.checkAuth();
    await this.checkRateLimit(user.id);

    try {
      // Validate member ID
      const uuidValidation = validateUUID(memberId, "Member ID");
      if (!uuidValidation.success) {
        throw new Error(uuidValidation.error);
      }

      // Check member exists and belongs to tenant
      const { data: existingMember } = await supabase
        .from("members")
        .select("id, tenant_id")
        .eq("id", memberId)
        .single();

      if (!existingMember) {
        throw new Error("Member not found");
      }

      if (!validateTenantAccess(tenantId, existingMember.tenant_id)) {
        throw new Error("Access denied");
      }

      // Check if member has active bookings
      const { data: activeBookings } = await supabase
        .from("class_bookings")
        .select("id")
        .eq("member_id", memberId)
        .eq("tenant_id", tenantId)
        .in("status", ["booked", "checked_in"]);

      if (activeBookings && activeBookings.length > 0) {
        throw new Error("Cannot delete member with active class bookings");
      }

      const { data, error } = await supabase
        .from("members")
        .delete()
        .eq("id", memberId)
        .eq("tenant_id", tenantId)
        .select();

      return this.wrapResponse(data || [], error, user.id);
    } catch (error) {
      const processedError = errorHandler.processError(
        error,
        ErrorContext.MEMBER_MANAGEMENT,
        false,
      );
      return this.wrapResponse([], processedError, user.id);
    }
  }

  // Secure class operations
  async getClasses(
    filters?: ClassFilterParams,
    pagination?: PaginationParams,
  ): Promise<SecureApiResponse<Class[]>> {
    // Always use real Supabase
    const { user, tenantId } = await this.checkAuth();
    await this.checkRateLimit(user.id);

    try {
      // Validate filters and pagination
      const validatedFilters = filters
        ? validateInput(classFilterSchema, filters)
        : { success: true, data: {} };
      const validatedPagination = pagination
        ? validateInput(paginationSchema, pagination)
        : { success: true, data: { page: 1, limit: 20 } };

      if (!validatedFilters.success) {
        const errors = 'errors' in validatedFilters ? validatedFilters.errors : [];
        throw new Error(
          `Invalid filters: ${errors.join(", ") || "Invalid filter parameters"}`,
        );
      }

      if (!validatedPagination.success) {
        const errors = 'errors' in validatedPagination ? validatedPagination.errors : [];
        throw new Error(
          `Invalid pagination: ${errors.join(", ") || "Invalid pagination parameters"}`,
        );
      }

      let query = supabase
        .from("classes")
        .select(
          `
          *,
          trainers(first_name, last_name, email)
        `,
        )
        .eq("tenant_id", tenantId);

      // Apply filters
      const filterData = validatedFilters.data as ClassFilterParams;
      if (filterData.trainer_id) {
        query = query.eq("trainer_id", filterData.trainer_id);
      }
      if (filterData.status) {
        query = query.eq("status", filterData.status);
      }
      if (filterData.class_type) {
        query = query.eq("class_type", filterData.class_type);
      }
      if (filterData.date_from) {
        query = query.gte("start_time", filterData.date_from);
      }
      if (filterData.date_to) {
        query = query.lte("end_time", filterData.date_to);
      }

      // Apply pagination
      const paginationData = validatedPagination.data as PaginationParams;
      const page = paginationData.page ?? 1;
      const limit = paginationData.limit ?? 20;
      const from = (page - 1) * limit;
      const to = from + limit - 1;
      query = query.range(from, to);

      const { data, error } = await query.order("start_time", {
        ascending: true,
      });

      return this.wrapResponse(data || [], error, user.id);
    } catch (error) {
      const processedError = errorHandler.processError(
        error,
        ErrorContext.CLASS_SCHEDULING,
        false,
      );
      return this.wrapResponse([], processedError, user.id);
    }
  }

  async createClass(
    classData: CreateClassData,
  ): Promise<SecureApiResponse<Class | null>> {
    // Always use real Supabase
    const { user, tenantId } = await this.checkAuth();
    await this.checkRateLimit(user.id);

    try {
      // Validate input data
      const validation = validateInput(createClassSchema, {
        ...classData,
        tenant_id: tenantId,
      });
      if (!validation.success) {
        const errors = 'errors' in validation ? validation.errors : [];
        throw new Error(`Validation failed: ${errors.join(", ")}`);
      }

      // Type assertion for validated data
      const validatedClassData = validation.data as CreateClassData;
      const { data: conflictingClasses } = await supabase
        .from("classes")
        .select("id")
        .eq("tenant_id", tenantId)
        .eq("trainer_id", validatedClassData.trainer_id)
        .or(
          `start_time.lte.${validatedClassData.end_time},end_time.gte.${validatedClassData.start_time}`,
        )
        .neq("status", "cancelled");

      if (conflictingClasses && conflictingClasses.length > 0) {
        throw new Error("Trainer is not available during this time slot");
      }

      const { data, error } = await supabase
        .from("classes")
        .insert({
          ...validatedClassData,
          current_bookings: 0,
        })
        .select()
        .single();

      return this.wrapResponse(data ?? null, error, user.id);
    } catch (error) {
      const processedError = errorHandler.processError(
        error,
        ErrorContext.CLASS_SCHEDULING,
        false,
      );
      return this.wrapResponse(null, processedError, user.id);
    }
  }

  // Permission checking utility
  async checkPermission(permission: string): Promise<boolean> {
    try {
      const { user } = await this.checkAuth();
      const userMetadata = user.user_metadata;

      const rolePermissions: Record<string, string[]> = {
        admin: ["all"],
        employee: ["read", "write", "manage_staff"],
        trainer: ["read", "write_classes"],
      };

      const userRole = (userMetadata?.role || "trainer") as string;
      const permissions = rolePermissions[userRole] || ["read"];

      return permissions.includes(permission) || permissions.includes("all");
    } catch {
      return false;
    }
  }
}

// Export the secure API client
export const secureApi = new SecureApiClient();

// Export validation functions for use in components
export { validateInput, validateUUID, sanitizeInput } from "./validation";
