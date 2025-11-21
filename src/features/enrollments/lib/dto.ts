import { z } from 'zod';

// Re-export schemas for client usage
export {
  EnrollmentSchema,
  CreateEnrollmentInputSchema,
  EnrollmentsQuerySchema,
  EnrollmentsResponseSchema,
  EnrollmentResponseSchema,
} from '../backend/schema';

export type {
  Enrollment,
  CreateEnrollmentInput,
  EnrollmentsQuery,
  EnrollmentsResponse,
  EnrollmentResponse,
} from '../backend/schema';

