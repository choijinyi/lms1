import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  CreateAssignmentInput,
  UpdateAssignmentInput,
  CreateSubmissionInput,
  GradeSubmissionInput,
  Assignment,
  Submission,
  AssignmentListResponse,
  SubmissionListResponse,
} from './schema';
import {
  AssignmentSchema,
  SubmissionSchema,
  AssignmentListResponseSchema,
  SubmissionListResponseSchema,
} from './schema';
import { assignmentsErrorCodes, type AssignmentsServiceError } from './error';
import { success, failure, type HandlerResult } from '@/backend/http/response';

// --- Assignment Services ---

export const createAssignment = async (
  client: SupabaseClient,
  input: CreateAssignmentInput
): Promise<HandlerResult<Assignment, AssignmentsServiceError, unknown>> => {
  const { data, error } = await client
    .from('assignments')
    .insert({
      course_id: input.courseId,
      title: input.title,
      description: input.description,
      due_date: input.dueDate,
      weight: input.weight,
      allow_late: input.allowLate,
      allow_resubmit: input.allowResubmit,
      status: input.status,
    })
    .select('*')
    .single();

  if (error) {
    return failure(500, assignmentsErrorCodes.createError, error.message);
  }

  return success(mapAssignment(data));
};

export const getAssignmentsByCourse = async (
  client: SupabaseClient,
  courseId: string
): Promise<HandlerResult<AssignmentListResponse, AssignmentsServiceError, unknown>> => {
  const { data, error } = await client
    .from('assignments')
    .select('*')
    .eq('course_id', courseId)
    .order('due_date', { ascending: true });

  if (error) {
    return failure(500, assignmentsErrorCodes.createError, error.message);
  }

  return success({ assignments: (data || []).map(mapAssignment) });
};

// --- Submission Services ---

export const createSubmission = async (
  client: SupabaseClient,
  userId: string,
  input: CreateSubmissionInput
): Promise<HandlerResult<Submission, AssignmentsServiceError, unknown>> => {
  // 1. Check enrollment
  const { data: assignment } = await client
    .from('assignments')
    .select('course_id, due_date, allow_late')
    .eq('id', input.assignmentId)
    .single();

  if (!assignment) {
    return failure(404, assignmentsErrorCodes.notFound, 'Assignment not found');
  }

  const { data: enrollment } = await client
    .from('enrollments')
    .select('id')
    .eq('user_id', userId)
    .eq('course_id', assignment.course_id)
    .maybeSingle();

  if (!enrollment) {
    return failure(403, assignmentsErrorCodes.notEnrolled, 'You are not enrolled in this course');
  }

  // 2. Check due date logic
  const now = new Date();
  const dueDate = new Date(assignment.due_date);
  const isLate = now > dueDate;

  if (isLate && !assignment.allow_late) {
    return failure(400, assignmentsErrorCodes.pastDueDate, 'Late submissions are not allowed');
  }

  // 3. Upsert submission (handling re-submission if allowed)
  // Note: DB constraint UNIQUE(assignment_id, user_id) handles duplicates, 
  // but we might want to update if allow_resubmit is true.
  
  const { data, error } = await client
    .from('submissions')
    .upsert({
      assignment_id: input.assignmentId,
      user_id: userId,
      text: input.text,
      link: input.link || null,
      late: isLate,
      status: 'submitted',
      submitted_at: now.toISOString(),
    })
    .select('*')
    .single();

  if (error) {
    return failure(500, assignmentsErrorCodes.createError, error.message);
  }

  return success(mapSubmission(data));
};

export const getSubmissionsByAssignment = async (
  client: SupabaseClient,
  assignmentId: string
): Promise<HandlerResult<SubmissionListResponse, AssignmentsServiceError, unknown>> => {
  const { data, error } = await client
    .from('submissions')
    .select('*')
    .eq('assignment_id', assignmentId);

  if (error) {
    return failure(500, assignmentsErrorCodes.createError, error.message);
  }

  return success({ submissions: (data || []).map(mapSubmission) });
};

export const gradeSubmission = async (
  client: SupabaseClient,
  submissionId: string,
  input: GradeSubmissionInput
): Promise<HandlerResult<Submission, AssignmentsServiceError, unknown>> => {
  const { data, error } = await client
    .from('submissions')
    .update({
      score: input.score,
      feedback: input.feedback,
      status: input.status,
      graded_at: new Date().toISOString(),
    })
    .eq('id', submissionId)
    .select('*')
    .single();

  if (error) {
    return failure(500, assignmentsErrorCodes.updateError, error.message);
  }

  return success(mapSubmission(data));
};

// --- Helpers ---

function mapAssignment(data: any): Assignment {
  return {
    id: data.id,
    courseId: data.course_id,
    title: data.title,
    description: data.description,
    dueDate: data.due_date,
    weight: data.weight,
    allowLate: data.allow_late,
    allowResubmit: data.allow_resubmit,
    status: data.status,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

function mapSubmission(data: any): Submission {
  return {
    id: data.id,
    assignmentId: data.assignment_id,
    userId: data.user_id,
    text: data.text,
    link: data.link,
    late: data.late,
    score: data.score,
    feedback: data.feedback,
    status: data.status,
    submittedAt: data.submitted_at,
    resubmittedAt: data.resubmitted_at,
    gradedAt: data.graded_at,
  };
}

