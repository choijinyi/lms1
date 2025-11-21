import { z } from 'zod';

// --- Assignment Schemas ---

export const AssignmentSchema = z.object({
  id: z.string().uuid(),
  courseId: z.string().uuid(),
  title: z.string().min(1),
  description: z.string().min(1),
  dueDate: z.string().datetime(),
  weight: z.number().min(0).default(1.0),
  allowLate: z.boolean().default(false),
  allowResubmit: z.boolean().default(true),
  status: z.enum(['draft', 'published', 'closed']),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type Assignment = z.infer<typeof AssignmentSchema>;

export const CreateAssignmentInputSchema = z.object({
  courseId: z.string().uuid(),
  title: z.string().min(1),
  description: z.string().min(1),
  dueDate: z.string().datetime(),
  weight: z.number().min(0).optional(),
  allowLate: z.boolean().optional(),
  allowResubmit: z.boolean().optional(),
  status: z.enum(['draft', 'published', 'closed']).default('draft'),
});

export type CreateAssignmentInput = z.infer<typeof CreateAssignmentInputSchema>;

export const UpdateAssignmentInputSchema = CreateAssignmentInputSchema.partial().omit({ courseId: true });
export type UpdateAssignmentInput = z.infer<typeof UpdateAssignmentInputSchema>;


// --- Submission Schemas ---

export const SubmissionSchema = z.object({
  id: z.string().uuid(),
  assignmentId: z.string().uuid(),
  userId: z.string().uuid(),
  text: z.string(),
  link: z.string().url().nullable().optional(),
  late: z.boolean(),
  score: z.number().nullable(),
  feedback: z.string().nullable(),
  status: z.enum(['submitted', 'graded', 'resubmission_required']),
  submittedAt: z.string().datetime(),
  resubmittedAt: z.string().datetime().nullable(),
  gradedAt: z.string().datetime().nullable(),
});

export type Submission = z.infer<typeof SubmissionSchema>;

export const CreateSubmissionInputSchema = z.object({
  assignmentId: z.string().uuid(),
  text: z.string().min(1),
  link: z.string().url().optional().or(z.literal('')),
});

export type CreateSubmissionInput = z.infer<typeof CreateSubmissionInputSchema>;

export const GradeSubmissionInputSchema = z.object({
  score: z.number().min(0).max(100),
  feedback: z.string().optional(),
  status: z.enum(['graded', 'resubmission_required']),
});

export type GradeSubmissionInput = z.infer<typeof GradeSubmissionInputSchema>;

// --- Response Schemas ---

export const AssignmentListResponseSchema = z.object({
  assignments: z.array(AssignmentSchema),
});

export type AssignmentListResponse = z.infer<typeof AssignmentListResponseSchema>;

export const SubmissionListResponseSchema = z.object({
  submissions: z.array(SubmissionSchema),
});

export type SubmissionListResponse = z.infer<typeof SubmissionListResponseSchema>;

