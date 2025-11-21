'use client';

import { useReportQuery } from '@/features/reports/hooks/useReportQuery';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface ReportDetailProps {
  reportId: string;
}

export function ReportDetail({ reportId }: ReportDetailProps) {
  const reportQuery = useReportQuery(reportId);

  if (reportQuery.status === 'pending') {
    return <p>로딩 중...</p>;
  }

  if (reportQuery.status === 'error') {
    return <p className="text-destructive">{reportQuery.error.message}</p>;
  }

  const report = reportQuery.data;

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive'> = {
      received: 'default',
      investigating: 'secondary',
      resolved: 'destructive',
    };

    return <Badge variant={variants[status] || 'default'}>{status}</Badge>;
  };

  const getActionTypeLabel = (actionType: string) => {
    const labels: Record<string, string> = {
      warning: '경고',
      invalidate_submission: '제출물 무효화',
      restrict_account: '계정 제한',
      dismiss: '기각',
    };

    return labels[actionType] || actionType;
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>신고 상세 정보</CardTitle>
            {getStatusBadge(report.status)}
          </div>
          <CardDescription>신고 ID: {report.id}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium">신고자</p>
              <p className="text-sm text-muted-foreground">{report.reporterName}</p>
            </div>
            <div>
              <p className="text-sm font-medium">대상 유형</p>
              <p className="text-sm text-muted-foreground">{report.targetType}</p>
            </div>
            <div>
              <p className="text-sm font-medium">대상</p>
              <p className="text-sm text-muted-foreground">{report.targetTitle || 'Unknown'}</p>
            </div>
            <div>
              <p className="text-sm font-medium">생성일</p>
              <p className="text-sm text-muted-foreground">
                {new Date(report.createdAt).toLocaleString()}
              </p>
            </div>
          </div>

          <Separator />

          <div>
            <p className="text-sm font-medium">신고 사유</p>
            <p className="text-sm text-muted-foreground">{report.reason}</p>
          </div>

          <div>
            <p className="text-sm font-medium">신고 내용</p>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{report.content}</p>
          </div>
        </CardContent>
      </Card>

      {report.actions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>처리 이력</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {report.actions.map((action) => (
                <div key={action.id} className="space-y-2 rounded-lg border p-4">
                  <div className="flex items-center justify-between">
                    <p className="font-medium">{getActionTypeLabel(action.actionType)}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(action.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <p className="text-sm text-muted-foreground">처리자: {action.operatorName}</p>
                  {action.memo && (
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">메모: {action.memo}</p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
