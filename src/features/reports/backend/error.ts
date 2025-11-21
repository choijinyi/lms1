export const reportsErrorCodes = {
  notFound: 'REPORT_NOT_FOUND',
  targetNotFound: 'REPORT_TARGET_NOT_FOUND',
  invalidStatusTransition: 'INVALID_REPORT_STATUS_TRANSITION',
  actionFailed: 'REPORT_ACTION_FAILED',
  createError: 'REPORT_CREATE_ERROR',
  updateError: 'REPORT_UPDATE_ERROR',
  validationError: 'REPORT_VALIDATION_ERROR',
  forbidden: 'REPORT_FORBIDDEN',
  unauthorized: 'REPORT_UNAUTHORIZED',
} as const;

type ReportsErrorValue = (typeof reportsErrorCodes)[keyof typeof reportsErrorCodes];

export type ReportsServiceError = ReportsErrorValue;
