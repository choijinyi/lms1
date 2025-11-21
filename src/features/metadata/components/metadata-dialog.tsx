'use client';

import { useState, useEffect } from 'react';
import { useCreateMetadataMutation, useUpdateMetadataMutation } from '@/features/metadata/hooks/useMetadataMutations';
import type { MetadataType, MetadataItem } from '@/features/metadata/lib/dto';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';

interface MetadataDialogProps {
  type: MetadataType;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'create' | 'edit';
  item?: MetadataItem;
}

export function MetadataDialog({ type, open, onOpenChange, mode, item }: MetadataDialogProps) {
  const [name, setName] = useState('');
  const [active, setActive] = useState(true);
  const [sortOrder, setSortOrder] = useState<string>('');
  const { toast } = useToast();

  const createMutation = useCreateMetadataMutation();
  const updateMutation = useUpdateMetadataMutation();

  useEffect(() => {
    if (mode === 'edit' && item) {
      setName(item.name);
      setActive(item.active);
      setSortOrder(item.sortOrder?.toString() || '');
    } else {
      setName('');
      setActive(true);
      setSortOrder('');
    }
  }, [mode, item, open]);

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast({
        title: '이름을 입력해주세요',
        variant: 'destructive',
      });
      return;
    }

    try {
      if (mode === 'create') {
        await createMutation.mutateAsync({
          type,
          input: {
            name: name.trim(),
            sortOrder: sortOrder ? parseInt(sortOrder, 10) : undefined,
          },
        });
        toast({ title: '생성되었습니다.' });
      } else if (item) {
        await updateMutation.mutateAsync({
          type,
          id: item.id,
          input: {
            name: name.trim(),
            active,
            sortOrder: sortOrder ? parseInt(sortOrder, 10) : undefined,
          },
        });
        toast({ title: '수정되었습니다.' });
      }
      onOpenChange(false);
    } catch (error) {
      toast({
        title: mode === 'create' ? '생성 실패' : '수정 실패',
        description: error instanceof Error ? error.message : '알 수 없는 오류',
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{mode === 'create' ? '추가' : '수정'}</DialogTitle>
          <DialogDescription>
            {mode === 'create' ? '새로운 항목을 추가합니다.' : '항목을 수정합니다.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">이름</Label>
            <Input
              id="name"
              placeholder="이름을 입력하세요"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={100}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="sortOrder">정렬 순서 (선택)</Label>
            <Input
              id="sortOrder"
              type="number"
              placeholder="정렬 순서를 입력하세요"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
            />
          </div>

          {mode === 'edit' && (
            <div className="flex items-center space-x-2">
              <Checkbox id="active" checked={active} onCheckedChange={(checked) => setActive(checked === true)} />
              <Label htmlFor="active" className="cursor-pointer">
                활성화
              </Label>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            취소
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={mode === 'create' ? createMutation.isPending : updateMutation.isPending}
          >
            {mode === 'create'
              ? createMutation.isPending
                ? '생성 중...'
                : '생성'
              : updateMutation.isPending
                ? '수정 중...'
                : '수정'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
