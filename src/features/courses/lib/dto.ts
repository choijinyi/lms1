import { z } from 'zod';

// Re-export schemas for client usage
export {
  CourseSchema,
  CoursesQuerySchema,
  CreateCourseInputSchema,
  CreateCourseByOperatorInputSchema,
  UpdateCourseInputSchema,
  CoursesResponseSchema,
  CourseResponseSchema,
} from '../backend/schema';

export type {
  Course,
  CoursesQuery,
  CreateCourseInput,
  CreateCourseByOperatorInput,
  UpdateCourseInput,
  CoursesResponse,
  CourseResponse,
} from '../backend/schema';
