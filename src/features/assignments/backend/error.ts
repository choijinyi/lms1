export const assignmentsErrorCodes = {
  createError: 'ASSIGNMENTS_CREATE_ERROR',
  updateError: 'ASSIGNMENTS_UPDATE_ERROR',
  deleteError: 'ASSIGNMENTS_DELETE_ERROR',
  notFound: 'ASSIGNMENTS_NOT_FOUND',
  validationError: 'ASSIGNMENTS_VALIDATION_ERROR',
  unauthorized: 'ASSIGNMENTS_UNAUTHORIZED',
  notEnrolled: 'ASSIGNMENTS_NOT_ENROLLED',
  pastDueDate: 'ASSIGNMENTS_PAST_DUE_DATE',
  invalidTransition: 'ASSIGNMENTS_INVALID_TRANSITION',
} as const;

export type AssignmentsServiceError = (typeof assignmentsErrorCodes)[keyof typeof assignmentsErrorCodes];

