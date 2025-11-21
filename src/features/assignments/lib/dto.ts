import { z } from 'zod';

export {
  AssignmentSchema,
  SubmissionSchema,
  CreateAssignmentInputSchema,
  UpdateAssignmentInputSchema,
  UpdateAssignmentStatusInputSchema,
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
  UpdateAssignmentStatusInput,
  CreateSubmissionInput,
  GradeSubmissionInput,
  AssignmentListResponse,
  SubmissionListResponse,
} from '../backend/schema';

