"use client";

import { useParams, Link } from "next/navigation";
import { useAssignmentsQuery, useAssignmentMutations } from "@/features/assignments/hooks/useAssignmentHooks";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Calendar, Clock, Settings } from "lucide-react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";

export default function CourseAssignmentsPage() {
  const params = useParams();
  const courseId = params.courseId as string;
  const { data, isLoading } = useAssignmentsQuery(courseId);
  const { updateAssignmentStatus } = useAssignmentMutations();
  const { toast } = useToast();

  const handleStatusChange = async (assignmentId: string, status: 'published' | 'closed') => {
    try {
      await updateAssignmentStatus.mutateAsync({ assignmentId, input: { status } });
      toast({
        title: status === 'published' ? "과제가 게시되었습니다" : "과제가 마감되었습니다",
        description: `성공적으로 ${status === 'published' ? '게시' : '마감'}되었습니다.`,
      });
    } catch (error: any) {
      toast({
        title: "상태 변경 실패",
        description: error.response?.data?.error?.message || "알 수 없는 오류가 발생했습니다.",
        variant: "destructive",
      });
    }
  };

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
                <Link href={`/instructor/courses/${courseId}/assignments/${assignment.id}`}>
                  <Button variant="outline" size="sm">제출물 확인 / 채점</Button>
                </Link>
                <Link href={`/instructor/courses/${courseId}/assignments/${assignment.id}/edit`}>
                  <Button variant="ghost" size="sm">
                    <Settings className="mr-2 h-4 w-4" />
                    수정
                  </Button>
                </Link>

                {/* 상태 전환 버튼 */}
                {assignment.status === 'draft' && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="default" size="sm" className="bg-green-600 hover:bg-green-700">
                        게시하기
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>과제를 게시하시겠습니까?</AlertDialogTitle>
                        <AlertDialogDescription>
                          게시하면 학습자들이 과제를 확인하고 제출할 수 있습니다.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>취소</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleStatusChange(assignment.id, 'published')}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          게시
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}

                {assignment.status === 'published' && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="sm">
                        마감하기
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>과제를 마감하시겠습니까?</AlertDialogTitle>
                        <AlertDialogDescription>
                          마감 후 학습자는 더 이상 제출할 수 없습니다. 이 작업은 되돌릴 수 없습니다.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>취소</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleStatusChange(assignment.id, 'closed')}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          마감
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
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

