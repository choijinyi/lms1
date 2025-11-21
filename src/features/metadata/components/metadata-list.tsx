'use client';

import { useState } from 'react';
import { useMetadataQuery } from '@/features/metadata/hooks/useMetadataQuery';
import { useUpdateMetadataMutation, useDeleteMetadataMutation } from '@/features/metadata/hooks/useMetadataMutations';
import type { MetadataType, MetadataItem } from '@/features/metadata/lib/dto';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { MetadataDialog } from './metadata-dialog';

interface MetadataListProps {
  type: MetadataType;
  title: string;
}

export function MetadataList({ type, title }: MetadataListProps) {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MetadataItem | null>(null);
  const [deletingItem, setDeletingItem] = useState<MetadataItem | null>(null);
  const { toast } = useToast();

  const metadataQuery = useMetadataQuery(type);
  const updateMutation = useUpdateMetadataMutation();
  const deleteMutation = useDeleteMetadataMutation();

  const handleDeactivate = async (item: MetadataItem) => {
    try {
      await updateMutation.mutateAsync({
        type,
        id: item.id,
        input: { active: false },
      });
      toast({ title: '비활성화되었습니다.' });
      setDeletingItem(null);
    } catch (error) {
      toast({
        title: '비활성화 실패',
        description: error instanceof Error ? error.message : '알 수 없는 오류',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (item: MetadataItem) => {
    try {
      await deleteMutation.mutateAsync({
        type,
        id: item.id,
      });
      toast({ title: '삭제되었습니다.' });
      setDeletingItem(null);
    } catch (error) {
      toast({
        title: '삭제 실패',
        description: error instanceof Error ? error.message : '알 수 없는 오류',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteClick = (item: MetadataItem) => {
    setDeletingItem(item);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">{title}</h2>
        <Button onClick={() => setCreateDialogOpen(true)}>추가</Button>
      </div>

      {metadataQuery.status === 'pending' && <p>로딩 중...</p>}
      {metadataQuery.status === 'error' && <p className="text-destructive">{metadataQuery.error.message}</p>}

      {metadataQuery.data && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>이름</TableHead>
              <TableHead>상태</TableHead>
              <TableHead>사용 중인 코스 수</TableHead>
              <TableHead>정렬 순서</TableHead>
              <TableHead>액션</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {metadataQuery.data.items.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">{item.name}</TableCell>
                <TableCell>
                  <Badge variant={item.active ? 'default' : 'secondary'}>
                    {item.active ? '활성' : '비활성'}
                  </Badge>
                </TableCell>
                <TableCell>{item.usageCount}</TableCell>
                <TableCell>{item.sortOrder ?? '-'}</TableCell>
                <TableCell className="space-x-2">
                  <Button variant="outline" size="sm" onClick={() => setEditingItem(item)}>
                    수정
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleDeleteClick(item)}>
                    삭제
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <MetadataDialog
        type={type}
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        mode="create"
      />

      {editingItem && (
        <MetadataDialog
          type={type}
          open={!!editingItem}
          onOpenChange={(open) => !open && setEditingItem(null)}
          mode="edit"
          item={editingItem}
        />
      )}

      {deletingItem && (
        <AlertDialog open={!!deletingItem} onOpenChange={(open) => !open && setDeletingItem(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {deletingItem.usageCount > 0 ? '비활성화 확인' : '삭제 확인'}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {deletingItem.usageCount > 0
                  ? `${deletingItem.usageCount}개의 코스에서 사용 중입니다. 비활성화하시겠습니까? (기존 코스는 유지됩니다)`
                  : `"${deletingItem.name}"을(를) 삭제하시겠습니까?`}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setDeletingItem(null)}>취소</AlertDialogCancel>
              <AlertDialogAction
                onClick={() =>
                  deletingItem.usageCount > 0 ? handleDeactivate(deletingItem) : handleDelete(deletingItem)
                }
              >
                {deletingItem.usageCount > 0 ? '비활성화' : '삭제'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}
