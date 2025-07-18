import { z } from 'zod';

// Base validation schemas
export const uuidSchema = z.string().uuid('Invalid UUID format');
export const emailSchema = z.string().email('Invalid email format');
export const phoneSchema = z.string().regex(/^\+?[\d\s\-\(\)]+$/, 'Invalid phone format').optional();
export const dateSchema = z.string().datetime('Invalid date format');
export const positiveNumberSchema = z.number().positive('Must be a positive number');
export const nonNegativeNumberSchema = z.number().min(0, 'Must be non-negative');

// Member validation schemas
export const createMemberSchema = z.object({
  tenant_id: uuidSchema,
  first_name: z.string().min(1, 'First name is required').max(50, 'First name too long'),
  last_name: z.string().min(1, 'Last name is required').max(50, 'Last name too long'),
  email: emailSchema,
  phone: phoneSchema,
  date_of_birth: z.string().date('Invalid date of birth').optional(),
  emergency_contact_name: z.string().max(100, 'Emergency contact name too long').optional(),
  emergency_contact_phone: phoneSchema,
  medical_conditions: z.string().max(500, 'Medical conditions too long').optional(),
  membership_type: z.enum(['Basic', 'Premium', 'VIP', 'Student'], 'Invalid membership type'),
  join_date: dateSchema,
  expiry_date: dateSchema.optional(),
  status: z.enum(['active', 'inactive', 'suspended'], 'Invalid status').default('active'),
  trainer_id: uuidSchema.optional(),
  assigned_branch_id: uuidSchema.optional(),
  tags: z.array(z.string()).optional(),
  notes: z.string().max(1000, 'Notes too long').optional()
});

export const updateMemberSchema = createMemberSchema.partial().omit({ tenant_id: true });

// Class validation schemas
export const createClassSchema = z.object({
  tenant_id: uuidSchema,
  name: z.string().min(1, 'Class name is required').max(100, 'Class name too long'),
  description: z.string().max(500, 'Description too long').optional(),
  trainer_id: uuidSchema,
  start_time: dateSchema,
  end_time: dateSchema,
  capacity: z.number().int().min(1, 'Capacity must be at least 1').max(200, 'Capacity too large'),
  price: nonNegativeNumberSchema.optional(),
  room: z.string().max(50, 'Room name too long').optional(),
  status: z.enum(['scheduled', 'in_progress', 'completed', 'cancelled'], 'Invalid status').default('scheduled'),
  class_type: z.string().max(50, 'Class type too long').optional(),
  equipment_needed: z.array(z.string()).optional(),
  skill_level: z.enum(['beginner', 'intermediate', 'advanced', 'all_levels'], 'Invalid skill level').optional()
}).refine(data => new Date(data.end_time) > new Date(data.start_time), {
  message: 'End time must be after start time',
  path: ['end_time']
});

export const updateClassSchema = createClassSchema.partial().omit({ tenant_id: true });

// Trainer validation schemas
export const createTrainerSchema = z.object({
  tenant_id: uuidSchema,
  first_name: z.string().min(1, 'First name is required').max(50, 'First name too long'),
  last_name: z.string().min(1, 'Last name is required').max(50, 'Last name too long'),
  email: emailSchema,
  phone: phoneSchema,
  specialties: z.array(z.string()).min(1, 'At least one specialty is required'),
  certifications: z.array(z.string()).optional(),
  hire_date: dateSchema,
  hourly_rate: positiveNumberSchema.optional(),
  status: z.enum(['active', 'inactive', 'on_leave'], 'Invalid status').default('active'),
  bio: z.string().max(1000, 'Bio too long').optional(),
  avatar_url: z.string().url('Invalid avatar URL').optional(),
  years_experience: z.number().int().min(0, 'Experience cannot be negative').max(50, 'Experience too high').optional()
});

export const updateTrainerSchema = createTrainerSchema.partial().omit({ tenant_id: true });

// Class booking validation schemas
export const createBookingSchema = z.object({
  tenant_id: uuidSchema,
  class_id: uuidSchema,
  member_id: uuidSchema,
  booking_type: z.enum(['regular', 'trial', 'makeup'], 'Invalid booking type').default('regular'),
  payment_status: z.enum(['pending', 'paid', 'refunded'], 'Invalid payment status').default('pending'),
  notes: z.string().max(200, 'Notes too long').optional()
});

export const updateBookingSchema = z.object({
  status: z.enum(['booked', 'checked_in', 'completed', 'cancelled', 'no_show'], 'Invalid status'),
  check_in_time: dateSchema.optional(),
  check_out_time: dateSchema.optional(),
  notes: z.string().max(200, 'Notes too long').optional()
});

// Invoice validation schemas
export const createInvoiceSchema = z.object({
  tenant_id: uuidSchema,
  member_id: uuidSchema,
  amount: positiveNumberSchema,
  currency: z.string().length(3, 'Currency must be 3 characters').default('USD'),
  description: z.string().max(200, 'Description too long').optional(),
  due_date: dateSchema,
  status: z.enum(['draft', 'sent', 'paid', 'overdue', 'cancelled'], 'Invalid status').default('draft'),
  items: z.array(z.object({
    description: z.string().min(1, 'Item description required'),
    quantity: positiveNumberSchema,
    unit_price: nonNegativeNumberSchema,
    total: nonNegativeNumberSchema
  })).min(1, 'At least one item required'),
  tax_rate: z.number().min(0).max(1, 'Tax rate must be between 0 and 1').optional(),
  discount_amount: nonNegativeNumberSchema.optional()
});

export const updateInvoiceSchema = createInvoiceSchema.partial().omit({ tenant_id: true, member_id: true });

// Query parameter schemas
export const paginationSchema = z.object({
  page: z.number().int().min(1, 'Page must be at least 1').default(1),
  limit: z.number().int().min(1, 'Limit must be at least 1').max(100, 'Limit too large').default(20)
});

export const dateRangeSchema = z.object({
  start_date: dateSchema,
  end_date: dateSchema
}).refine(data => new Date(data.end_date) > new Date(data.start_date), {
  message: 'End date must be after start date',
  path: ['end_date']
});

export const memberFilterSchema = z.object({
  status: z.enum(['active', 'inactive', 'suspended']).optional(),
  membership_type: z.enum(['Basic', 'Premium', 'VIP', 'Student']).optional(),
  trainer_id: uuidSchema.optional(),
  branch_id: uuidSchema.optional(),
  search: z.string().max(100, 'Search term too long').optional()
});

export const classFilterSchema = z.object({
  trainer_id: uuidSchema.optional(),
  status: z.enum(['scheduled', 'in_progress', 'completed', 'cancelled']).optional(),
  class_type: z.string().max(50, 'Class type too long').optional(),
  skill_level: z.enum(['beginner', 'intermediate', 'advanced', 'all_levels']).optional(),
  start_date: dateSchema.optional(),
  end_date: dateSchema.optional()
});

// Validation utility functions
export const validateInput = <T>(schema: z.ZodSchema<T>, data: unknown): { success: true; data: T } | { success: false; errors: string[] } => {
  try {
    const validated = schema.parse(data);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
      return { success: false, errors };
    }
    return { success: false, errors: ['Validation failed'] };
  }
};

export const validateUUID = (id: string, fieldName: string = 'ID'): { success: boolean; error?: string } => {
  const result = uuidSchema.safeParse(id);
  if (!result.success) {
    return { success: false, error: `Invalid ${fieldName}: ${result.error.errors[0].message}` };
  }
  return { success: true };
};

export const sanitizeInput = (input: string): string => {
  // Remove potentially dangerous characters for SQL injection
  return input.replace(/['";\\]/g, '').trim();
};

export const validateTenantAccess = (userTenantId: string, resourceTenantId: string): boolean => {
  return userTenantId === resourceTenantId;
};

// Security validation
export const securityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:;"
};

// Rate limiting schemas
export const rateLimitSchema = z.object({
  window: z.number().int().min(1, 'Rate limit window must be positive'),
  max: z.number().int().min(1, 'Rate limit max must be positive')
});

// Export all schemas for type inference
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