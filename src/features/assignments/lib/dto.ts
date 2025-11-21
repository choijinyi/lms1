import { z } from 'zod';

export {
  AssignmentSchema,
  SubmissionSchema,
  CreateAssignmentInputSchema,
  UpdateAssignmentInputSchema,
  CreateSubmissionInputSchema,
  GradeSubmissionInputSchema,
  AssignmentListResponseSchema,
  SubmissionListResponseSchema,
} from '../backend/schema';

export type {
  Assignment,
  Submission,
  CreateAssignmentInput,
  UpdateAssignmentInput,
  CreateSubmissionInput,
  GradeSubmissionInput,
  AssignmentListResponse,
  SubmissionListResponse,
} from '../backend/schema';

