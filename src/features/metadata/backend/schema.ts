import { z } from 'zod';

// 메타데이터 타입
export const MetadataTypeSchema = z.enum(['categories', 'difficulties']);

// 메타데이터 생성 요청 스키마
export const CreateMetadataSchema = z.object({
  name: z.string().trim().min(1).max(100),
  sortOrder: z.number().int().optional(),
});

// 메타데이터 수정 요청 스키마
export const UpdateMetadataSchema = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  active: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
});

// 메타데이터 응답 스키마
export const MetadataItemSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  active: z.boolean(),
  sortOrder: z.number().nullable(),
  usageCount: z.number().int(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

// 메타데이터 목록 응답 스키마
export const MetadataListResponseSchema = z.object({
  items: z.array(MetadataItemSchema),
});

// DB Row 스키마
export const MetadataRowSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  active: z.boolean(),
  sort_order: z.number().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type MetadataType = z.infer<typeof MetadataTypeSchema>;
export type CreateMetadataInput = z.infer<typeof CreateMetadataSchema>;
export type UpdateMetadataInput = z.infer<typeof UpdateMetadataSchema>;
export type MetadataItem = z.infer<typeof MetadataItemSchema>;
export type MetadataListResponse = z.infer<typeof MetadataListResponseSchema>;
export type MetadataRow = z.infer<typeof MetadataRowSchema>;
