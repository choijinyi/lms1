"use client";

import { useState } from "react";
import { useCoursesQuery } from "@/features/courses/hooks/useCoursesQuery";
import { useEnrollmentMutations } from "@/features/enrollments/hooks/useEnrollmentMutations";
import { useMyEnrollmentsQuery } from "@/features/enrollments/hooks/useMyEnrollmentsQuery";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

export default function CoursesPage() {
  const [page, setPage] = useState(1);
  const { data: coursesData, isLoading: isCoursesLoading, isError: isCoursesError } = useCoursesQuery({
    page,
    limit: 9,
    status: "published",
  });
  
  const { data: myEnrollments, isLoading: isEnrollmentsLoading } = useMyEnrollmentsQuery();
  const { enroll } = useEnrollmentMutations();
  const { toast } = useToast();

  const enrolledCourseIds = new Set(
    myEnrollments?.enrollments.map((e) => e.courseId) || []
  );

  const handleEnroll = async (courseId: string) => {
    try {
      await enroll.mutateAsync({ courseId });
      toast({
        title: "수강 신청 완료",
        description: "성공적으로 수강 신청되었습니다.",
      });
    } catch (error: any) {
      toast({
        title: "수강 신청 실패",
        description: error.response?.data?.error?.message || "알 수 없는 오류가 발생했습니다.",
        variant: "destructive",
      });
    }
  };

  if (isCoursesLoading || isEnrollmentsLoading) {
    return <div className="p-8 text-center">로딩 중...</div>;
  }

  if (isCoursesError) {
    return (
      <div className="container mx-auto py-8 text-center">
        <p className="text-red-500">코스 목록을 불러오는데 실패했습니다.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">개설된 코스</h1>
      </header>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {coursesData?.courses.map((course) => {
          const isEnrolled = enrolledCourseIds.has(course.id);
          
          return (
            <Card key={course.id} className="flex flex-col">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <Badge variant={
                    course.difficulty === 'beginner' ? 'secondary' :
                    course.difficulty === 'intermediate' ? 'default' : 'destructive'
                  }>
                    {course.difficulty}
                  </Badge>
                  <span className="text-sm text-muted-foreground">{course.category}</span>
                </div>
                <CardTitle className="mt-2">{course.title}</CardTitle>
                <CardDescription className="line-clamp-2">
                  {course.description || "설명이 없습니다."}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1">
                {/* 추가 정보나 커리큘럼 요약 등을 여기에 표시 가능 */}
              </CardContent>
              <CardFooter>
                <Button 
                  className="w-full" 
                  onClick={() => handleEnroll(course.id)}
                  disabled={isEnrolled || enroll.isPending}
                  variant={isEnrolled ? "outline" : "default"}
                >
                  {isEnrolled ? "이미 수강 중" : "수강 신청하기"}
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>
      
      {coursesData?.courses.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          등록된 코스가 없습니다.
        </div>
      )}
    </div>
  );
}

