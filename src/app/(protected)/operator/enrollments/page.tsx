"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/remote/api-client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { ko } from "date-fns/locale";

// TODO: 백엔드에 전체 수강신청 목록 조회 API 필요 (현재는 내 목록만 조회 가능)
// 임시로 전체 목록 조회 API가 있다고 가정하거나, 필요한 API를 추가해야 함.
// 여기서는 useMyEnrollmentsQuery 대신 새로운 훅을 만들어야 하지만,
// 데모를 위해 API 엔드포인트를 추가하는 작업이 선행되어야 함.

// 임시 훅: 실제로는 src/features/enrollments/hooks/useAllEnrollmentsQuery.ts 로 분리 권장
const useAllEnrollmentsQuery = () => {
  return useQuery({
    queryKey: ['all-enrollments'],
    queryFn: async () => {
      // TODO: 관리자 전용 API 엔드포인트 (/api/admin/enrollments) 구현 필요
      // 현재는 임시로 빈 배열 반환
      // const { data } = await apiClient.get('/api/admin/enrollments');
      // return EnrollmentsResponseSchema.parse(data);
      return { enrollments: [], total: 0, page: 1, limit: 10 };
    },
  });
};

export default function OperatorEnrollmentsPage() {
  const { data, isLoading } = useAllEnrollmentsQuery();

  return (
    <div className="container mx-auto py-8 space-y-6">
      <h1 className="text-3xl font-bold">전체 수강신청 현황</h1>
      <p className="text-muted-foreground">모든 학생의 수강 신청 내역을 확인합니다.</p>

      <div className="border rounded-lg p-8 text-center text-muted-foreground">
        <p>🚧 관리자용 전체 수강 내역 조회 API가 필요합니다.</p>
        <p className="text-sm mt-2">백엔드에 `/api/admin/enrollments` 엔드포인트를 추가해주세요.</p>
      </div>
    </div>
  );
}

