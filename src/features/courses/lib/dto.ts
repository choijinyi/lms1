import { z } from 'zod';

// Re-export schemas for client usage
export {
  CourseSchema,
  CoursesQuerySchema,
  CreateCourseInputSchema,
  UpdateCourseInputSchema,
  CoursesResponseSchema,
  CourseResponseSchema,
} from '../backend/schema';

export type {
  Course,
  CoursesQuery,
  CreateCourseInput,
  UpdateCourseInput,
  CoursesResponse,
  CourseResponse,
} from '../backend/schema';

