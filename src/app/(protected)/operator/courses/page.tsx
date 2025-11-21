"use client";

import { useCoursesQuery } from "@/features/courses/hooks/useCoursesQuery";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { PlusCircle } from "lucide-react";

export default function OperatorCoursesPage() {
  const { data, isLoading } = useCoursesQuery({ limit: 100 }); // 전체 목록

  if (isLoading) return <div className="p-8 text-center">로딩 중...</div>;

  return (
    <div className="container mx-auto py-8 space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">전체 코스 관리</h1>
        <Link href="/operator/courses/new">
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            코스 추가
          </Button>
        </Link>
      </header>

      <div className="grid gap-4">
        {data?.courses.map((course) => (
          <Card key={course.id} className="flex flex-row items-center justify-between p-6">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <CardTitle className="text-lg">{course.title}</CardTitle>
                <Badge variant={course.status === 'published' ? 'default' : 'secondary'}>
                  {course.status}
                </Badge>
              </div>
              <CardDescription>{course.category} • {course.difficulty}</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {/* TODO: 수정 및 삭제 기능 구현 */}
              <Button variant="outline" size="sm">수정</Button>
              <Button variant="destructive" size="sm">삭제</Button>
            </div>
          </Card>
        ))}
        {data?.courses.length === 0 && (
          <div className="text-center py-12 border rounded-lg text-muted-foreground">
            등록된 코스가 없습니다.
          </div>
        )}
      </div>
    </div>
  );
}

