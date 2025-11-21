"use client";

import { useParams, Link } from "next/navigation";
import { useAssignmentsQuery } from "@/features/assignments/hooks/useAssignmentHooks";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Calendar, Clock } from "lucide-react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";

export default function CourseAssignmentsPage() {
  const params = useParams();
  const courseId = params.courseId as string;
  const { data, isLoading } = useAssignmentsQuery(courseId);

  if (isLoading) return <div>로딩 중...</div>;

  return (
    <div className="container mx-auto py-8 space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">과제 관리</h1>
        <Link href={`/instructor/courses/${courseId}/assignments/new`}>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            과제 추가
          </Button>
        </Link>
      </header>

      <div className="grid gap-4">
        {data?.assignments.map((assignment) => (
          <Card key={assignment.id}>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg">{assignment.title}</CardTitle>
                <Badge variant={assignment.status === "published" ? "default" : "secondary"}>
                  {assignment.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 text-sm text-muted-foreground mb-4">
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  마감: {format(new Date(assignment.dueDate), "PPP p", { locale: ko })}
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {assignment.allowLate ? "지각 허용" : "지각 불가"}
                </div>
              </div>
              <div className="flex gap-2">
                {/* TODO: 채점 페이지 링크 */}
                <Button variant="outline" size="sm">제출물 확인 / 채점</Button>
                <Button variant="ghost" size="sm">수정</Button>
              </div>
            </CardContent>
          </Card>
        ))}

        {data?.assignments.length === 0 && (
          <div className="text-center py-10 text-muted-foreground border rounded-lg border-dashed">
            등록된 과제가 없습니다.
          </div>
        )}
      </div>
    </div>
  );
}

