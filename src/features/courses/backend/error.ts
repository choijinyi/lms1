export const coursesErrorCodes = {
  createError: 'COURSES_CREATE_ERROR',
  updateError: 'COURSES_UPDATE_ERROR',
  deleteError: 'COURSES_DELETE_ERROR',
  notFound: 'COURSES_NOT_FOUND',
  validationError: 'COURSES_VALIDATION_ERROR',
  unauthorized: 'COURSES_UNAUTHORIZED',
} as const;

export type CoursesServiceError = (typeof coursesErrorCodes)[keyof typeof coursesErrorCodes];

