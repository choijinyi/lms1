import { z } from 'zod';

// --- DTO Schemas ---

export const CourseSchema = z.object({
  id: z.string().uuid(),
  instructorId: z.string().uuid(),
  title: z.string().min(1),
  description: z.string().optional(),
  category: z.string(),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']),
  curriculum: z.any().optional(), // JSONB
  status: z.enum(['draft', 'published', 'archived']),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type Course = z.infer<typeof CourseSchema>;

export const CreateCourseInputSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  category: z.string().min(1, 'Category is required'),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']),
  curriculum: z.any().optional(),
});

export type CreateCourseInput = z.infer<typeof CreateCourseInputSchema>;

// 관리자용 코스 생성 스키마 (담당 교수 ID 포함)
export const CreateCourseByOperatorInputSchema = CreateCourseInputSchema.extend({
  instructorId: z.string().uuid('Valid instructor ID is required'),
});

export type CreateCourseByOperatorInput = z.infer<typeof CreateCourseByOperatorInputSchema>;

export const UpdateCourseInputSchema = CreateCourseInputSchema.partial().extend({
  status: z.enum(['draft', 'published', 'archived']).optional(),
});

export type UpdateCourseInput = z.infer<typeof UpdateCourseInputSchema>;

export const CoursesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  category: z.string().optional(),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
  status: z.enum(['draft', 'published', 'archived']).optional(),
});

export type CoursesQuery = z.infer<typeof CoursesQuerySchema>;

export const CoursesResponseSchema = z.object({
  courses: z.array(CourseSchema),
  total: z.number().int().min(0),
  page: z.number().int().min(1),
  limit: z.number().int().min(1),
});

export type CoursesResponse = z.infer<typeof CoursesResponseSchema>;

export const CourseResponseSchema = CourseSchema;
export type CourseResponse = z.infer<typeof CourseResponseSchema>;
