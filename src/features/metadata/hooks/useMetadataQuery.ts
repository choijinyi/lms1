'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient, extractApiErrorMessage } from '@/lib/remote/api-client';
import { MetadataListResponseSchema, type MetadataType } from '@/features/metadata/lib/dto';

const fetchMetadata = async (type: MetadataType) => {
  try {
    const { data } = await apiClient.get(`/api/metadata/${type}`);
    return MetadataListResponseSchema.parse(data);
  } catch (error) {
    const message = extractApiErrorMessage(error, 'Failed to fetch metadata.');
    throw new Error(message);
  }
};

export const useMetadataQuery = (type: MetadataType) =>
  useQuery({
    queryKey: ['metadata', type],
    queryFn: () => fetchMetadata(type),
    staleTime: 60 * 1000,
  });
