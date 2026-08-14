import { z } from "zod";

// Base schemas
export const emailSchema = z.string().email("Invalid email format");
export const phoneSchema = z
  .string()
  .regex(/^\+?[\d\s\-()]+$/, "Invalid phone format");
export const nameSchema = z.string().min(1, "Name is required").max(100, "Name too long");
export const uuidSchema = z.string().uuid("Invalid UUID format");

// Member schemas
export const createMemberSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  phone: phoneSchema.optional(),
  date_of_birth: z.string().optional(),
  gender: z.enum(["male", "female", "other"]).optional(),
  address: z.string().optional(),
  emergency_contact: z.string().optional(),
  membership_type: z.enum(["basic", "premium", "vip"]).default("basic"),
  join_date: z.string().default(() => new Date().toISOString()),
  status: z.enum(["active", "inactive", "suspended"]).default("active"),
  notes: z.string().optional(),
  tenant_id: z.string().optional(),
});

export const updateMemberSchema = createMemberSchema.partial().extend({
  id: uuidSchema,
});

// Class schemas
export const createClassSchema = z.object({
  name: nameSchema,
  description: z.string().optional(),
  trainer_id: uuidSchema,
  class_type: z.enum(["yoga", "hiit", "strength", "pilates", "cardio", "other"]),
  max_capacity: z.number().min(1, "Max capacity must be at least 1"),
  duration_minutes: z.number().min(15, "Duration must be at least 15 minutes"),
  start_time: z.string(),
  end_time: z.string(),
  location: z.string().optional(),
  price: z.number().min(0, "Price cannot be negative"),
  status: z.enum(["scheduled", "cancelled", "completed"]).default("scheduled"),
  tenant_id: z.string().optional(),
});

export const updateClassSchema = createClassSchema.partial().extend({
  id: uuidSchema,
});

// Trainer schemas
export const createTrainerSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  phone: phoneSchema.optional(),
  specialty: z.string().min(1, "Specialty is required"),
  experience_years: z.number().min(0, "Experience cannot be negative"),
  rating: z.number().min(0).max(5).default(4.5),
  status: z.enum(["active", "inactive", "busy", "available"]).default("active"),
  hourly_rate: z.number().min(0, "Hourly rate cannot be negative"),
  bio: z.string().optional(),
  tenant_id: z.string().optional(),
});

export const updateTrainerSchema = createTrainerSchema.partial().extend({
  id: uuidSchema,
});

// Booking schemas
export const createBookingSchema = z.object({
  member_id: uuidSchema,
  class_id: uuidSchema,
  booking_date: z.string(),
  status: z.enum(["confirmed", "cancelled", "no_show", "completed"]).default("confirmed"),
  notes: z.string().optional(),
  tenant_id: z.string().optional(),
});

export const updateBookingSchema = createBookingSchema.partial().extend({
  id: uuidSchema,
});

// Invoice schemas
export const createInvoiceSchema = z.object({
  member_id: uuidSchema,
  amount: z.number().min(0, "Amount cannot be negative"),
  description: z.string().min(1, "Description is required"),
  due_date: z.string(),
  status: z.enum(["pending", "paid", "overdue", "cancelled"]).default("pending"),
  payment_method: z.enum(["credit_card", "bank_transfer", "cash", "other"]).optional(),
  tenant_id: z.string().optional(),
});

export const updateInvoiceSchema = createInvoiceSchema.partial().extend({
  id: uuidSchema,
});

// Filter schemas
export const paginationSchema = z.object({
  page: z.number().min(1, "Page must be at least 1").default(1),
  limit: z.number().min(1, "Limit must be at least 1").max(100, "Limit cannot exceed 100").default(10),
});

export const dateRangeSchema = z.object({
  start_date: z.string().optional(),
  end_date: z.string().optional(),
});

export const memberFilterSchema = z.object({
  search: z.string().optional(),
  status: z.enum(["active", "inactive", "suspended"]).optional(),
  membership_type: z.enum(["basic", "premium", "vip"]).optional(),
  join_date_from: z.string().optional(),
  join_date_to: z.string().optional(),
});

export const classFilterSchema = z.object({
  search: z.string().optional(),
  class_type: z.enum(["yoga", "hiit", "strength", "pilates", "cardio", "other"]).optional(),
  trainer_id: uuidSchema.optional(),
  status: z.enum(["scheduled", "cancelled", "completed"]).optional(),
  date_from: z.string().optional(),
  date_to: z.string().optional(),
});

// Generic validation function
export const validateInput = <T>(
  schema: z.ZodSchema<T>,
  data: unknown,
): { success: true; data: T } | { success: false; errors: string[] } => {
  try {
    const validated = schema.parse(data);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, errors: error.errors.map((e) => e.message) };
    }
    return { success: false, errors: ["Validation failed"] };
  }
};

// Utility validation functions
export const validateUUID = (
  id: string,
  fieldName: string = "ID",
): { success: boolean; error?: string } => {
  try {
    uuidSchema.parse(id);
    return { success: true };
  } catch (error) {
    return { success: false, error: `Invalid ${fieldName} format` };
  }
};

export const sanitizeInput = (input: string): string => {
  return input
    .trim()
    .replace(/<[^>]*>?/gm, "") // Remove HTML tags
    .replace(/javascript:/gi, "") // Block JS injections
    .replace(/on\w+\s*=/gi, "") // Remove event handlers
    .replace(/data:/gi, "") // Block data URI injections
    .replace(/vbscript:/gi, ""); // Block VBScript
};

export const validateTenantAccess = (
  userTenantId: string,
  resourceTenantId: string,
): boolean => {
  return userTenantId === resourceTenantId;
};

// Type exports
export type CreateMemberData = z.infer<typeof createMemberSchema>;
export type UpdateMemberData = z.infer<typeof updateMemberSchema>;
export type CreateClassData = z.infer<typeof createClassSchema>;
export type UpdateClassData = z.infer<typeof updateClassSchema>;
export type CreateTrainerData = z.infer<typeof createTrainerSchema>;
export type UpdateTrainerData = z.infer<typeof updateTrainerSchema>;
export type CreateBookingData = z.infer<typeof createBookingSchema>;
export type UpdateBookingData = z.infer<typeof updateBookingSchema>;
export type CreateInvoiceData = z.infer<typeof createInvoiceSchema>;
export type UpdateInvoiceData = z.infer<typeof updateInvoiceSchema>;
export type PaginationParams = z.infer<typeof paginationSchema>;
export type DateRangeParams = z.infer<typeof dateRangeSchema>;
export type MemberFilterParams = z.infer<typeof memberFilterSchema>;
export type ClassFilterParams = z.infer<typeof classFilterSchema>;

// Validation functions
export const validateMemberData = (data: unknown) => {
  return validateInput(createMemberSchema, data);
};

export const validateClassData = (data: unknown) => {
  return validateInput(createClassSchema, data);
};

export const validateTrainerData = (data: unknown) => {
  return validateInput(createTrainerSchema, data);
};

export const validateBookingData = (data: unknown) => {
  return validateInput(createBookingSchema, data);
};

export const validateMemberFilters = (filters: unknown) => {
  return validateInput(memberFilterSchema, filters);
};

export const validateClassFilters = (filters: unknown) => {
  return validateInput(classFilterSchema, filters);
};

export const validatePagination = (pagination: unknown) => {
  return validateInput(paginationSchema, pagination);
};
