'use client';

import { useState } from 'react';
import { useReportsQuery } from '@/features/reports/hooks/useReportsQuery';
import type { ReportsQuery } from '@/features/reports/lib/dto';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

interface ReportsListProps {
  onSelectReport?: (reportId: string) => void;
}

export function ReportsList({ onSelectReport }: ReportsListProps) {
  const [query, setQuery] = useState<ReportsQuery>({
    page: 1,
    limit: 20,
  });

  const reportsQuery = useReportsQuery(query);

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive'> = {
      received: 'default',
      investigating: 'secondary',
      resolved: 'destructive',
    };

    return <Badge variant={variants[status] || 'default'}>{status}</Badge>;
  };

  const getTargetTypeBadge = (targetType: string) => {
    const labels: Record<string, string> = {
      course: '코스',
      assignment: '과제',
      submission: '제출물',
      user: '사용자',
    };

    return <Badge variant="outline">{labels[targetType] || targetType}</Badge>;
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-4">
        <Select
          value={query.status || 'all'}
          onValueChange={(value) =>
            setQuery({ ...query, status: value === 'all' ? undefined : (value as ReportsQuery['status']), page: 1 })
          }
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="상태 선택" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체</SelectItem>
            <SelectItem value="received">접수됨</SelectItem>
            <SelectItem value="investigating">조사 중</SelectItem>
            <SelectItem value="resolved">처리 완료</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={query.targetType || 'all'}
          onValueChange={(value) =>
            setQuery({ ...query, targetType: value === 'all' ? undefined : (value as ReportsQuery['targetType']), page: 1 })
          }
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="대상 유형 선택" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체</SelectItem>
            <SelectItem value="course">코스</SelectItem>
            <SelectItem value="assignment">과제</SelectItem>
            <SelectItem value="submission">제출물</SelectItem>
            <SelectItem value="user">사용자</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {reportsQuery.status === 'pending' && <p>로딩 중...</p>}
      {reportsQuery.status === 'error' && <p className="text-destructive">{reportsQuery.error.message}</p>}

      {reportsQuery.data && (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>신고자</TableHead>
                <TableHead>대상 유형</TableHead>
                <TableHead>대상</TableHead>
                <TableHead>사유</TableHead>
                <TableHead>상태</TableHead>
                <TableHead>생성일</TableHead>
                <TableHead>액션</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reportsQuery.data.reports.map((report) => (
                <TableRow key={report.id}>
                  <TableCell className="font-mono text-xs">{report.id.slice(0, 8)}...</TableCell>
                  <TableCell>{report.reporterName}</TableCell>
                  <TableCell>{getTargetTypeBadge(report.targetType)}</TableCell>
                  <TableCell>{report.targetTitle || 'Unknown'}</TableCell>
                  <TableCell>{report.reason}</TableCell>
                  <TableCell>{getStatusBadge(report.status)}</TableCell>
                  <TableCell>{new Date(report.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Button variant="outline" size="sm" onClick={() => onSelectReport?.(report.id)}>
                      상세보기
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              총 {reportsQuery.data.total}건 중 {query.page} 페이지
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={query.page <= 1}
                onClick={() => setQuery({ ...query, page: query.page - 1 })}
              >
                이전
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={query.page * query.limit >= reportsQuery.data.total}
                onClick={() => setQuery({ ...query, page: query.page + 1 })}
              >
                다음
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
