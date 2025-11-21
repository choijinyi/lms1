'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient, extractApiErrorMessage } from '@/lib/remote/api-client';
import {
  CreateMetadataSchema,
  UpdateMetadataSchema,
  MetadataItemSchema,
  type MetadataType,
  type CreateMetadataInput,
  type UpdateMetadataInput,
} from '@/features/metadata/lib/dto';

// 메타데이터 생성
const createMetadata = async (type: MetadataType, input: CreateMetadataInput) => {
  try {
    const validated = CreateMetadataSchema.parse(input);
    const { data } = await apiClient.post(`/api/metadata/${type}`, validated);
    return MetadataItemSchema.parse(data);
  } catch (error) {
    const message = extractApiErrorMessage(error, 'Failed to create metadata.');
    throw new Error(message);
  }
};

export const useCreateMetadataMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ type, input }: { type: MetadataType; input: CreateMetadataInput }) =>
      createMetadata(type, input),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['metadata', variables.type] });
    },
  });
};

// 메타데이터 수정
const updateMetadata = async (type: MetadataType, id: string, input: UpdateMetadataInput) => {
  try {
    const validated = UpdateMetadataSchema.parse(input);
    const { data } = await apiClient.patch(`/api/metadata/${type}/${id}`, validated);
    return MetadataItemSchema.parse(data);
  } catch (error) {
    const message = extractApiErrorMessage(error, 'Failed to update metadata.');
    throw new Error(message);
  }
};

export const useUpdateMetadataMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ type, id, input }: { type: MetadataType; id: string; input: UpdateMetadataInput }) =>
      updateMetadata(type, id, input),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['metadata', variables.type] });
    },
  });
};

// 메타데이터 삭제
const deleteMetadata = async (type: MetadataType, id: string) => {
  try {
    await apiClient.delete(`/api/metadata/${type}/${id}`);
  } catch (error) {
    const message = extractApiErrorMessage(error, 'Failed to delete metadata.');
    throw new Error(message);
  }
};

export const useDeleteMetadataMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ type, id }: { type: MetadataType; id: string }) => deleteMetadata(type, id),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['metadata', variables.type] });
    },
  });
};
