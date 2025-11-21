import { z } from 'zod';

// --- DTO Schemas ---

export const EnrollmentSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  courseId: z.string().uuid(),
  enrolledAt: z.string().datetime(),
  canceledAt: z.string().datetime().nullable().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type Enrollment = z.infer<typeof EnrollmentSchema>;

export const CreateEnrollmentInputSchema = z.object({
  courseId: z.string().uuid(),
});

export type CreateEnrollmentInput = z.infer<typeof CreateEnrollmentInputSchema>;

export const EnrollmentResponseSchema = EnrollmentSchema;
export type EnrollmentResponse = z.infer<typeof EnrollmentResponseSchema>;

export const EnrollmentsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});

export type EnrollmentsQuery = z.infer<typeof EnrollmentsQuerySchema>;

export const EnrollmentsResponseSchema = z.object({
  enrollments: z.array(EnrollmentSchema),
  total: z.number().int().min(0),
  page: z.number().int().min(1),
  limit: z.number().int().min(1),
});

export type EnrollmentsResponse = z.infer<typeof EnrollmentsResponseSchema>;

