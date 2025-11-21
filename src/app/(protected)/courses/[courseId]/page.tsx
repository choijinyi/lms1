"use client";

import { useParams, Link } from "next/navigation";
import { useCoursesQuery } from "@/features/courses/hooks/useCoursesQuery"; // 단건 조회가 없으므로 임시로 목록 쿼리 사용 or hooks 추가 필요
import { useAssignmentsQuery } from "@/features/assignments/hooks/useAssignmentHooks";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { ko } from "date-fns/locale";

export default function CourseDetailPage() {
  const params = useParams();
  const courseId = params.courseId as string;
  
  // TODO: useCourseById 훅 구현 필요. 현재는 임시 처리.
  // 실제로는 API 호출해서 상세 정보 가져와야 함.
  const { data: assignmentsData } = useAssignmentsQuery(courseId);

  return (
    <div className="container mx-auto py-8 space-y-8">
      <header>
        <h1 className="text-3xl font-bold mb-2">코스 상세</h1>
        {/* 코스 정보 표시 영역 (API 연동 필요) */}
        <p className="text-muted-foreground">과제 목록 및 학습 자료를 확인하세요.</p>
      </header>

      <section>
        <h2 className="text-2xl font-semibold mb-4">과제 목록</h2>
        <div className="grid gap-4">
          {assignmentsData?.assignments.map((assignment) => (
            <Card key={assignment.id}>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="text-lg">{assignment.title}</CardTitle>
                  {new Date() > new Date(assignment.dueDate) && (
                    <Badge variant="destructive">마감됨</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-end">
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p>마감일: {format(new Date(assignment.dueDate), "PPP p", { locale: ko })}</p>
                    <p>배점: {assignment.weight}점</p>
                  </div>
                  <Link href={`/courses/${courseId}/assignments/${assignment.id}`}>
                    <Button>과제 보기 / 제출</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}

          {assignmentsData?.assignments.length === 0 && (
            <p className="text-muted-foreground">등록된 과제가 없습니다.</p>
          )}
        </div>
      </section>
    </div>
  );
}

