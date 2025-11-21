export const metadataErrorCodes = {
  notFound: 'METADATA_NOT_FOUND',
  duplicateName: 'METADATA_DUPLICATE_NAME',
  inUse: 'METADATA_IN_USE',
  invalidType: 'METADATA_INVALID_TYPE',
  createError: 'METADATA_CREATE_ERROR',
  updateError: 'METADATA_UPDATE_ERROR',
  deleteError: 'METADATA_DELETE_ERROR',
  validationError: 'METADATA_VALIDATION_ERROR',
} as const;

type MetadataErrorValue = (typeof metadataErrorCodes)[keyof typeof metadataErrorCodes];

export type MetadataServiceError = MetadataErrorValue;
