import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  MetadataType,
  CreateMetadataInput,
  UpdateMetadataInput,
  MetadataListResponse,
  MetadataItem,
} from './schema';
import {
  MetadataListResponseSchema,
  MetadataItemSchema,
  MetadataRowSchema,
} from './schema';
import { metadataErrorCodes, type MetadataServiceError } from './error';
import { success, failure, type HandlerResult } from '@/backend/http/response';

/**
 * 메타데이터 목록 조회
 */
export const getMetadataList = async (
  client: SupabaseClient,
  type: MetadataType,
): Promise<HandlerResult<MetadataListResponse, MetadataServiceError, unknown>> => {
  const tableName = getTableName(type);

  // 메타데이터 조회 + 사용 중인 코스 수 계산
  const { data, error } = await client.from(tableName).select('*').order('sort_order', {
    ascending: true,
    nullsFirst: false,
  });

  if (error) {
    return failure(500, metadataErrorCodes.createError, error.message);
  }

  // 각 메타데이터의 사용 중인 코스 수 조회
  const itemsWithUsage = await Promise.all(
    (data || []).map(async (item) => {
      const usageCount = await getUsageCount(client, type, item.name);

      return {
        id: item.id,
        name: item.name,
        active: item.active,
        sortOrder: item.sort_order,
        usageCount,
        createdAt: item.created_at,
        updatedAt: item.updated_at,
      };
    }),
  );

  const response: MetadataListResponse = {
    items: itemsWithUsage,
  };

  const parsed = MetadataListResponseSchema.safeParse(response);

  if (!parsed.success) {
    return failure(
      500,
      metadataErrorCodes.validationError,
      'Metadata list response validation failed',
      parsed.error.format(),
    );
  }

  return success(parsed.data);
};

/**
 * 메타데이터 생성
 */
export const createMetadata = async (
  client: SupabaseClient,
  type: MetadataType,
  input: CreateMetadataInput,
): Promise<HandlerResult<MetadataItem, MetadataServiceError, unknown>> => {
  const tableName = getTableName(type);

  // 중복 이름 검증
  const { data: existing } = await client
    .from(tableName)
    .select('id')
    .eq('name', input.name)
    .maybeSingle();

  if (existing) {
    return failure(400, metadataErrorCodes.duplicateName, 'Metadata name already exists');
  }

  // 생성
  const { data, error } = await client
    .from(tableName)
    .insert({
      name: input.name,
      sort_order: input.sortOrder || null,
      active: true,
    })
    .select('*')
    .single();

  if (error) {
    return failure(500, metadataErrorCodes.createError, error.message);
  }

  const rowParse = MetadataRowSchema.safeParse(data);

  if (!rowParse.success) {
    return failure(
      500,
      metadataErrorCodes.validationError,
      'Metadata row validation failed',
      rowParse.error.format(),
    );
  }

  const response: MetadataItem = {
    id: rowParse.data.id,
    name: rowParse.data.name,
    active: rowParse.data.active,
    sortOrder: rowParse.data.sort_order,
    usageCount: 0,
    createdAt: rowParse.data.created_at,
    updatedAt: rowParse.data.updated_at,
  };

  const parsed = MetadataItemSchema.safeParse(response);

  if (!parsed.success) {
    return failure(
      500,
      metadataErrorCodes.validationError,
      'Metadata item validation failed',
      parsed.error.format(),
    );
  }

  return success(parsed.data);
};

/**
 * 메타데이터 수정
 */
export const updateMetadata = async (
  client: SupabaseClient,
  type: MetadataType,
  id: string,
  input: UpdateMetadataInput,
): Promise<HandlerResult<MetadataItem, MetadataServiceError, unknown>> => {
  const tableName = getTableName(type);

  // 메타데이터 존재 확인
  const { data: existing } = await client.from(tableName).select('*').eq('id', id).maybeSingle();

  if (!existing) {
    return failure(404, metadataErrorCodes.notFound, 'Metadata not found');
  }

  // 이름 변경 시 중복 검증
  if (input.name && input.name !== existing.name) {
    const { data: duplicate } = await client
      .from(tableName)
      .select('id')
      .eq('name', input.name)
      .maybeSingle();

    if (duplicate) {
      return failure(400, metadataErrorCodes.duplicateName, 'Metadata name already exists');
    }
  }

  // 업데이트
  const updateData: Record<string, unknown> = {};
  if (input.name !== undefined) updateData.name = input.name;
  if (input.active !== undefined) updateData.active = input.active;
  if (input.sortOrder !== undefined) updateData.sort_order = input.sortOrder;

  const { data, error } = await client
    .from(tableName)
    .update(updateData)
    .eq('id', id)
    .select('*')
    .single();

  if (error) {
    return failure(500, metadataErrorCodes.updateError, error.message);
  }

  const rowParse = MetadataRowSchema.safeParse(data);

  if (!rowParse.success) {
    return failure(
      500,
      metadataErrorCodes.validationError,
      'Metadata row validation failed',
      rowParse.error.format(),
    );
  }

  const usageCount = await getUsageCount(client, type, rowParse.data.name);

  const response: MetadataItem = {
    id: rowParse.data.id,
    name: rowParse.data.name,
    active: rowParse.data.active,
    sortOrder: rowParse.data.sort_order,
    usageCount,
    createdAt: rowParse.data.created_at,
    updatedAt: rowParse.data.updated_at,
  };

  const parsed = MetadataItemSchema.safeParse(response);

  if (!parsed.success) {
    return failure(
      500,
      metadataErrorCodes.validationError,
      'Metadata item validation failed',
      parsed.error.format(),
    );
  }

  return success(parsed.data);
};

/**
 * 메타데이터 삭제
 */
export const deleteMetadata = async (
  client: SupabaseClient,
  type: MetadataType,
  id: string,
): Promise<HandlerResult<{ success: boolean }, MetadataServiceError, unknown>> => {
  const tableName = getTableName(type);

  // 메타데이터 존재 확인
  const { data: existing } = await client.from(tableName).select('name').eq('id', id).maybeSingle();

  if (!existing) {
    return failure(404, metadataErrorCodes.notFound, 'Metadata not found');
  }

  // 사용 중인 코스 수 확인
  const usageCount = await getUsageCount(client, type, existing.name);

  if (usageCount > 0) {
    return failure(
      400,
      metadataErrorCodes.inUse,
      `Metadata is used by ${usageCount} course(s). Please deactivate instead of delete.`,
    );
  }

  // 삭제
  const { error } = await client.from(tableName).delete().eq('id', id);

  if (error) {
    return failure(500, metadataErrorCodes.deleteError, error.message);
  }

  return success({ success: true });
};

/**
 * 메타데이터 사용 중인 코스 수 조회
 */
const getUsageCount = async (
  client: SupabaseClient,
  type: MetadataType,
  name: string,
): Promise<number> => {
  const column = type === 'categories' ? 'category' : 'difficulty';

  const { count } = await client
    .from('courses')
    .select('id', { count: 'exact', head: true })
    .eq(column, name);

  return count || 0;
};

/**
 * 메타데이터 타입별 테이블명 매핑
 */
const getTableName = (type: MetadataType): string => {
  return type === 'categories' ? 'metadata_categories' : 'metadata_difficulties';
};
