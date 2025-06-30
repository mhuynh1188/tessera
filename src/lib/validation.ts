import { z } from 'zod'

// User authentication schemas
export const signUpSchema = z.object({
  email: z.string()
    .email('Invalid email address')
    .min(5, 'Email must be at least 5 characters')
    .max(254, 'Email must be less than 254 characters') // RFC 5321 limit
    .transform((email) => email.toLowerCase().trim()),
  
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password must be less than 128 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>?]).{8,}$/, 
      'Password must contain at least one lowercase letter, uppercase letter, number, and special character'),
  
  name: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be less than 100 characters')
    .regex(/^[a-zA-Z\s\-'\.]+$/, 'Name can only contain letters, spaces, hyphens, apostrophes, and periods')
    .transform((name) => name.trim()),
  
  rememberMe: z.boolean().optional().default(false),
})

export const signInSchema = z.object({
  email: z.string()
    .email('Invalid email address')
    .transform((email) => email.toLowerCase().trim()),
  
  password: z.string()
    .min(1, 'Password is required')
    .max(128, 'Password must be less than 128 characters'),
  
  rememberMe: z.boolean().optional().default(false),
})

export const resetPasswordSchema = z.object({
  email: z.string()
    .email('Invalid email address')
    .transform((email) => email.toLowerCase().trim()),
})

export const updatePasswordSchema = z.object({
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password must be less than 128 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>?]).{8,}$/, 
      'Password must contain at least one lowercase letter, uppercase letter, number, and special character'),
  
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

// Workspace schemas
export const createWorkspaceSchema = z.object({
  name: z.string()
    .min(1, 'Workspace name is required')
    .max(100, 'Workspace name must be less than 100 characters')
    .regex(/^[a-zA-Z0-9\s\-_]+$/, 'Workspace name can only contain letters, numbers, spaces, hyphens, and underscores')
    .transform((name) => name.trim()),
  
  description: z.string()
    .max(500, 'Description must be less than 500 characters')
    .optional()
    .transform((desc) => desc?.trim()),
  
  is_public: z.boolean().default(false),
  
  settings: z.object({
    theme: z.enum(['light', 'dark']).default('light'),
    grid_size: z.number().min(10).max(100).default(50),
    snap_to_grid: z.boolean().default(true),
    auto_save: z.boolean().default(true),
    collaboration_enabled: z.boolean().default(false),
    max_hexies: z.number().min(-1).default(-1), // -1 for unlimited
  }).default({}),
})

export const updateWorkspaceSchema = createWorkspaceSchema.partial()

// Hexie card schemas
export const createHexieCardSchema = z.object({
  title: z.string()
    .min(1, 'Title is required')
    .max(100, 'Title must be less than 100 characters')
    .transform((title) => title.trim()),
  
  front_text: z.string()
    .min(1, 'Front text is required')
    .max(1000, 'Front text must be less than 1000 characters')
    .transform((text) => text.trim()),
  
  back_text: z.string()
    .max(1000, 'Back text must be less than 1000 characters')
    .optional()
    .transform((text) => text?.trim()),
  
  category_id: z.string().uuid('Invalid category ID').optional(),
  
  color_scheme: z.object({
    primary: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid color format'),
    secondary: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid color format').optional(),
    text: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid color format').optional(),
  }).optional(),
  
  subscription_tier_required: z.enum(['free', 'basic', 'premium']).default('free'),
  is_active: z.boolean().default(true),
})

export const updateHexieCardSchema = createHexieCardSchema.partial()

// Reference schemas
export const createReferenceSchema = z.object({
  title: z.string()
    .min(1, 'Title is required')
    .max(200, 'Title must be less than 200 characters')
    .transform((title) => title.trim()),
  
  url: z.string()
    .url('Invalid URL format')
    .max(2048, 'URL must be less than 2048 characters'),
  
  type: z.enum(['article', 'research', 'book', 'website', 'video', 'podcast']),
  
  authors: z.string()
    .max(200, 'Authors must be less than 200 characters')
    .optional()
    .transform((authors) => authors?.trim()),
  
  publication: z.string()
    .max(200, 'Publication must be less than 200 characters')
    .optional()
    .transform((pub) => pub?.trim()),
  
  year: z.number()
    .min(1900, 'Year must be 1900 or later')
    .max(new Date().getFullYear() + 1, 'Year cannot be in the future')
    .optional(),
  
  description: z.string()
    .max(1000, 'Description must be less than 1000 characters')
    .optional()
    .transform((desc) => desc?.trim()),
})

// File upload schemas
export const fileUploadSchema = z.object({
  file: z.any().refine((file) => typeof window !== 'undefined' && file instanceof File, 'Must be a File object')
    .refine((file) => file.size <= 5 * 1024 * 1024, 'File must be less than 5MB')
    .refine(
      (file) => ['image/jpeg', 'image/png', 'image/svg+xml'].includes(file.type),
      'File must be a JPEG, PNG, or SVG image'
    )
    .refine(
      (file) => {
        const ext = file.name.split('.').pop()?.toLowerCase()
        const validExts = {
          'image/jpeg': ['jpg', 'jpeg'],
          'image/png': ['png'],
          'image/svg+xml': ['svg'],
        }
        return validExts[file.type as keyof typeof validExts]?.includes(ext || '') || false
      },
      'File extension must match file type'
    ),
})

// Search and filter schemas
export const searchSchema = z.object({
  query: z.string()
    .max(100, 'Search query must be less than 100 characters')
    .optional()
    .transform((query) => query?.trim()),
  
  category: z.string().uuid('Invalid category ID').optional(),
  subscription_tier: z.enum(['free', 'basic', 'premium']).optional(),
  is_active: z.boolean().optional(),
  limit: z.number().min(1).max(100).default(20),
  offset: z.number().min(0).default(0),
})

// API request validation
export const apiRequestSchema = z.object({
  method: z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']),
  headers: z.object({
    'content-type': z.string().optional(),
    'authorization': z.string().optional(),
    'user-agent': z.string().optional(),
  }).passthrough(),
})

// Contact form schema
export const contactFormSchema = z.object({
  name: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be less than 100 characters')
    .regex(/^[a-zA-Z\s\-'\.]+$/, 'Name can only contain letters, spaces, hyphens, apostrophes, and periods')
    .transform((name) => name.trim()),
  
  email: z.string()
    .email('Invalid email address')
    .transform((email) => email.toLowerCase().trim()),
  
  subject: z.string()
    .min(5, 'Subject must be at least 5 characters')
    .max(200, 'Subject must be less than 200 characters')
    .transform((subject) => subject.trim()),
  
  message: z.string()
    .min(10, 'Message must be at least 10 characters')
    .max(2000, 'Message must be less than 2000 characters')
    .transform((message) => message.trim()),
})

// Type exports
export type SignUpData = z.infer<typeof signUpSchema>
export type SignInData = z.infer<typeof signInSchema>
export type CreateWorkspaceData = z.infer<typeof createWorkspaceSchema>
export type UpdateWorkspaceData = z.infer<typeof updateWorkspaceSchema>
export type CreateHexieCardData = z.infer<typeof createHexieCardSchema>
export type UpdateHexieCardData = z.infer<typeof updateHexieCardSchema>
export type CreateReferenceData = z.infer<typeof createReferenceSchema>
export type SearchData = z.infer<typeof searchSchema>
export type ContactFormData = z.infer<typeof contactFormSchema>

// Validation helper functions
export const validateInput = <T>(schema: z.ZodSchema<T>, data: unknown): { success: true; data: T } | { success: false; error: string } => {
  try {
    const validatedData = schema.parse(data)
    return { success: true, data: validatedData }
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessage = error.errors.map(err => `${err.path.join('.')}: ${err.message}`).join(', ')
      return { success: false, error: errorMessage }
    }
    return { success: false, error: 'Validation failed' }
  }
}

// Sanitization functions
export const sanitizeHtml = (input: string): string => {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
}

export const sanitizeFilename = (filename: string): string => {
  return filename
    .replace(/[^a-zA-Z0-9.-]/g, '_')
    .replace(/_{2,}/g, '_')
    .replace(/^_+|_+$/g, '')
    .toLowerCase()
}

// Rate limiting helpers
export const createRateLimitKey = (ip: string, endpoint: string): string => {
  return `rate_limit:${ip}:${endpoint}`
}

export const isValidIP = (ip: string): boolean => {
  const ipv4Regex = /^((25[0-5]|(2[0-4]|1\d|[1-9]|)\d)\.?\b){4}$/
  const ipv6Regex = /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))$/
  
  return ipv4Regex.test(ip) || ipv6Regex.test(ip)
}