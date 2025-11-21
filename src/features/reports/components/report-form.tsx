'use client';

import { useState } from 'react';
import { useCreateReportMutation } from '@/features/reports/hooks/useReportMutations';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

interface ReportFormProps {
  defaultTargetType?: 'course' | 'assignment' | 'submission' | 'user';
  defaultTargetId?: string;
}

export function ReportForm({ defaultTargetType, defaultTargetId }: ReportFormProps) {
  const [open, setOpen] = useState(false);
  const [targetType, setTargetType] = useState<string>(defaultTargetType || '');
  const [targetId, setTargetId] = useState(defaultTargetId || '');
  const [reason, setReason] = useState('');
  const [content, setContent] = useState('');
  const { toast } = useToast();

  const createMutation = useCreateReportMutation();

  const handleSubmit = async () => {
    if (!targetType || !targetId || !reason || !content) {
      toast({
        title: '모든 필드를 입력해주세요',
        variant: 'destructive',
      });
      return;
    }

    try {
      await createMutation.mutateAsync({
        targetType: targetType as 'course' | 'assignment' | 'submission' | 'user',
        targetId,
        reason,
        content,
      });

      toast({ title: '신고가 접수되었습니다.' });
      setOpen(false);
      setTargetType(defaultTargetType || '');
      setTargetId(defaultTargetId || '');
      setReason('');
      setContent('');
    } catch (error) {
      toast({
        title: '신고 접수 실패',
        description: error instanceof Error ? error.message : '알 수 없는 오류',
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">신고하기</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>신고 접수</DialogTitle>
          <DialogDescription>부적절한 콘텐츠나 행위를 신고할 수 있습니다.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="targetType">대상 유형</Label>
            <Select value={targetType} onValueChange={setTargetType} disabled={!!defaultTargetType}>
              <SelectTrigger id="targetType">
                <SelectValue placeholder="대상 유형 선택" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="course">코스</SelectItem>
                <SelectItem value="assignment">과제</SelectItem>
                <SelectItem value="submission">제출물</SelectItem>
                <SelectItem value="user">사용자</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="targetId">대상 ID</Label>
            <Input
              id="targetId"
              placeholder="대상 ID를 입력하세요"
              value={targetId}
              onChange={(e) => setTargetId(e.target.value)}
              disabled={!!defaultTargetId}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">신고 사유</Label>
            <Input
              id="reason"
              placeholder="신고 사유를 입력하세요"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              maxLength={200}
            />
            <p className="text-xs text-muted-foreground">{reason.length}/200</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">신고 내용</Label>
            <Textarea
              id="content"
              placeholder="신고 내용을 상세히 입력하세요"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={5}
              maxLength={2000}
            />
            <p className="text-xs text-muted-foreground">{content.length}/2000</p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            취소
          </Button>
          <Button onClick={handleSubmit} disabled={createMutation.isPending}>
            {createMutation.isPending ? '접수 중...' : '신고 접수'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
