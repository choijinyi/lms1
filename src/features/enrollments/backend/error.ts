export const enrollmentsErrorCodes = {
  createError: 'ENROLLMENTS_CREATE_ERROR',
  notFound: 'ENROLLMENTS_NOT_FOUND',
  alreadyEnrolled: 'ENROLLMENTS_ALREADY_ENROLLED',
  validationError: 'ENROLLMENTS_VALIDATION_ERROR',
  unauthorized: 'ENROLLMENTS_UNAUTHORIZED',
} as const;

export type EnrollmentsServiceError = (typeof enrollmentsErrorCodes)[keyof typeof enrollmentsErrorCodes];

