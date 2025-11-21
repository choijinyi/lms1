'use client';

import { useState } from 'react';
import { useUpdateReportStatusMutation, useExecuteReportActionMutation } from '@/features/reports/hooks/useReportMutations';
import type { ReportResponse } from '@/features/reports/lib/dto';
import { Button } from '@/components/ui/button';
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
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

interface ReportActionsProps {
  report: ReportResponse;
}

type ActionType = 'investigating' | 'warning' | 'invalidate_submission' | 'restrict_account' | 'dismiss';

export function ReportActions({ report }: ReportActionsProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<ActionType | null>(null);
  const [memo, setMemo] = useState('');
  const [targetId, setTargetId] = useState('');
  const { toast } = useToast();

  const updateStatusMutation = useUpdateReportStatusMutation();
  const executeActionMutation = useExecuteReportActionMutation();

  const handleButtonClick = (action: ActionType) => {
    setPendingAction(action);
    setMemo('');
    setTargetId('');
    setDialogOpen(true);
  };

  const handleConfirm = async () => {
    if (!pendingAction) return;

    try {
      if (pendingAction === 'investigating') {
        await updateStatusMutation.mutateAsync({
          reportId: report.id,
          input: { status: 'investigating', memo },
        });
        toast({ title: '조사를 시작했습니다.' });
      } else {
        await executeActionMutation.mutateAsync({
          reportId: report.id,
          input: {
            actionType: pendingAction,
            targetId: targetId || undefined,
            memo,
          },
        });
        toast({ title: '액션이 실행되었습니다.' });
      }
      setDialogOpen(false);
      setPendingAction(null);
    } catch (error) {
      toast({
        title: '오류 발생',
        description: error instanceof Error ? error.message : '알 수 없는 오류',
        variant: 'destructive',
      });
    }
  };

  const getDialogContent = () => {
    const contents: Record<ActionType, { title: string; description: string; needsTargetId: boolean }> = {
      investigating: {
        title: '조사 시작',
        description: '신고 조사를 시작하시겠습니까?',
        needsTargetId: false,
      },
      warning: {
        title: '경고 발송',
        description: '대상 사용자에게 경고를 발송하시겠습니까?',
        needsTargetId: false,
      },
      invalidate_submission: {
        title: '제출물 무효화',
        description: '제출물을 무효화하시겠습니까? 점수가 0점 처리됩니다.',
        needsTargetId: true,
      },
      restrict_account: {
        title: '계정 제한',
        description: '계정을 제한하시겠습니까?',
        needsTargetId: true,
      },
      dismiss: {
        title: '기각',
        description: '신고를 기각하시겠습니까?',
        needsTargetId: false,
      },
    };

    return contents[pendingAction!] || { title: '', description: '', needsTargetId: false };
  };

  const dialogContent = pendingAction ? getDialogContent() : null;

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {report.status === 'received' && (
          <Button onClick={() => handleButtonClick('investigating')}>조사 시작</Button>
        )}

        {(report.status === 'received' || report.status === 'investigating') && (
          <>
            <Button variant="outline" onClick={() => handleButtonClick('warning')}>
              경고
            </Button>
            <Button variant="outline" onClick={() => handleButtonClick('invalidate_submission')}>
              제출물 무효화
            </Button>
            <Button variant="outline" onClick={() => handleButtonClick('restrict_account')}>
              계정 제한
            </Button>
            <Button variant="outline" onClick={() => handleButtonClick('dismiss')}>
              기각
            </Button>
          </>
        )}

        {report.status === 'resolved' && (
          <p className="text-sm text-muted-foreground">처리가 완료된 신고입니다.</p>
        )}
      </div>

      {dialogContent && (
        <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{dialogContent.title}</AlertDialogTitle>
              <AlertDialogDescription>{dialogContent.description}</AlertDialogDescription>
            </AlertDialogHeader>

            <div className="space-y-4">
              {dialogContent.needsTargetId && (
                <div className="space-y-2">
                  <Label htmlFor="targetId">대상 ID</Label>
                  <Input
                    id="targetId"
                    placeholder="대상 ID를 입력하세요"
                    value={targetId}
                    onChange={(e) => setTargetId(e.target.value)}
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="memo">메모 (선택)</Label>
                <Textarea
                  id="memo"
                  placeholder="처리 내용을 입력하세요"
                  value={memo}
                  onChange={(e) => setMemo(e.target.value)}
                  rows={3}
                />
              </div>
            </div>

            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setDialogOpen(false)}>취소</AlertDialogCancel>
              <AlertDialogAction onClick={handleConfirm}>확인</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </>
  );
}
