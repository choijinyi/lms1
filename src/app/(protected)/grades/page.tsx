"use client";

import { useMyEnrollmentsQuery } from "@/features/enrollments/hooks/useMyEnrollmentsQuery";
import { useMySubmissionsQuery } from "@/features/assignments/hooks/useAssignmentHooks";
import { useCoursesQuery } from "@/features/courses/hooks/useCoursesQuery";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GraduationCap, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";

export default function GradesPage() {
  const { data: enrollments, isLoading: enrollmentsLoading } = useMyEnrollmentsQuery();
  const { data: submissions, isLoading: submissionsLoading } = useMySubmissionsQuery('graded');

  const isLoading = enrollmentsLoading || submissionsLoading;

  // 채점 완료된 제출물 계산
  const gradedSubmissions = submissions?.submissions || [];
  const totalGradedCount = gradedSubmissions.length;

  // 평균 점수 계산
  const averageScore =
    totalGradedCount > 0
      ? Math.round((gradedSubmissions.reduce((sum, s) => sum + (s.score || 0), 0) / totalGradedCount) * 10) / 10
      : 0;

  // 지각 제출 수
  const lateCount = gradedSubmissions.filter((s) => s.late).length;

  if (isLoading) {
    return (
      <div className="container mx-auto py-10 max-w-4xl">
        <div className="text-center py-20">
          <p>성적을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (!enrollments || enrollments.enrollments.length === 0) {
    return (
      <div className="container mx-auto py-10 max-w-4xl">
        <header className="mb-8">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <GraduationCap className="h-8 w-8" />
            내 성적
          </h1>
          <p className="text-muted-foreground mt-2">채점 완료된 과제와 성적을 확인하세요.</p>
        </header>

        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">수강 중인 코스가 없습니다.</p>
            <p className="text-sm text-muted-foreground mt-2">코스를 탐색하고 수강 신청해보세요.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (totalGradedCount === 0) {
    return (
      <div className="container mx-auto py-10 max-w-4xl">
        <header className="mb-8">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <GraduationCap className="h-8 w-8" />
            내 성적
          </h1>
          <p className="text-muted-foreground mt-2">채점 완료된 과제와 성적을 확인하세요.</p>
        </header>

        <Card>
          <CardContent className="py-12 text-center">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">채점 완료된 과제가 없습니다.</p>
            <p className="text-sm text-muted-foreground mt-2">과제를 제출하고 채점을 기다려주세요.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10 max-w-4xl space-y-8">
      <header>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <GraduationCap className="h-8 w-8" />
          내 성적
        </h1>
        <p className="text-muted-foreground mt-2">채점 완료된 과제와 성적을 확인하세요.</p>
      </header>

      {/* 전체 요약 */}
      <Card className="bg-gradient-to-br from-blue-50 to-white border-2">
        <CardHeader>
          <CardTitle>전체 요약</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">평균 점수</p>
            <p className="text-3xl font-bold text-blue-600">{averageScore}점</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">채점 완료</p>
            <p className="text-3xl font-bold">{totalGradedCount}개</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">지각 제출</p>
            <p className="text-3xl font-bold text-orange-600">{lateCount}개</p>
          </div>
        </CardContent>
      </Card>

      {/* 과제별 성적 목록 */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold">과제별 성적</h2>

        <div className="grid gap-4">
          {gradedSubmissions.map((submission) => (
            <Card key={submission.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">Assignment ID: {submission.assignmentId}</CardTitle>
                    <CardDescription className="flex items-center gap-2">
                      <Clock className="h-3 w-3" />
                      제출: {format(new Date(submission.submittedAt), "PPP p", { locale: ko })}
                      {submission.gradedAt && (
                        <>
                          {" "}| 채점: {format(new Date(submission.gradedAt), "PPP", { locale: ko })}
                        </>
                      )}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    {submission.late && (
                      <Badge variant="destructive" className="flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        지각 제출
                      </Badge>
                    )}
                    <Badge variant="default" className="text-lg px-3 py-1">
                      {submission.score}점
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">피드백:</p>
                    <p className="text-sm mt-1 whitespace-pre-wrap">
                      {submission.feedback || "피드백이 없습니다."}
                    </p>
                  </div>
                  {submission.status === "graded" && (
                    <div className="flex items-center gap-1 text-green-600 text-sm">
                      <CheckCircle2 className="h-4 w-4" />
                      채점 완료
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
