'use client';

import { useState } from 'react';
import { ReportsList } from '@/features/reports/components/reports-list';
import { ReportDetail } from '@/features/reports/components/report-detail';
import { ReportActions } from '@/features/reports/components/report-actions';
import { useReportQuery } from '@/features/reports/hooks/useReportQuery';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function ReportsPage() {
  const [selectedReportId, setSelectedReportId] = useState<string>('');

  const reportQuery = useReportQuery(selectedReportId);

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">신고 관리</h1>
        <p className="text-muted-foreground">신고 목록을 조회하고 처리할 수 있습니다.</p>
      </div>

      <Tabs defaultValue="list" className="w-full">
        <TabsList>
          <TabsTrigger value="list">신고 목록</TabsTrigger>
          {selectedReportId && <TabsTrigger value="detail">신고 상세</TabsTrigger>}
        </TabsList>

        <TabsContent value="list" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>신고 목록</CardTitle>
              <CardDescription>접수된 신고를 확인하고 처리하세요.</CardDescription>
            </CardHeader>
            <CardContent>
              <ReportsList onSelectReport={setSelectedReportId} />
            </CardContent>
          </Card>
        </TabsContent>

        {selectedReportId && (
          <TabsContent value="detail" className="mt-6">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>신고 처리</CardTitle>
                  <CardDescription>신고에 대한 액션을 수행하세요.</CardDescription>
                </CardHeader>
                <CardContent>
                  {reportQuery.data && <ReportActions report={reportQuery.data} />}
                </CardContent>
              </Card>

              <ReportDetail reportId={selectedReportId} />
            </div>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
