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
    <div className="container mx-auto py-12 space-y-8 min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      <header className="pb-6">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-14 h-14 bg-gradient-to-br from-[hsl(var(--oikos-blue))] to-[hsl(var(--oikos-green))] rounded-xl flex items-center justify-center shadow-lg">
            <span className="text-2xl font-bold text-white">O</span>
          </div>
          <div>
            <h1 className="text-5xl font-bold bg-gradient-to-r from-[hsl(var(--oikos-blue))] to-[hsl(var(--oikos-green))] bg-clip-text text-transparent">
              강의 목록
            </h1>
            <p className="text-gray-600 mt-1 text-lg">
              다양한 학습 기회를 탐색하세요
            </p>
          </div>
        </div>
      </header>

      <div className="grid gap-7 md:grid-cols-2 lg:grid-cols-3">
        {coursesData?.courses.map((course) => {
          const isEnrolled = enrolledCourseIds.has(course.id);
          
          return (
            <Card key={course.id} className="flex flex-col border-2 border-blue-100 shadow-lg hover:shadow-2xl transition-all hover:-translate-y-2 bg-white">
              <CardHeader className="space-y-3 bg-gradient-to-br from-blue-50 to-white">
                <div className="flex justify-between items-start">
                  <Badge 
                    variant="secondary"
                    className={
                      course.difficulty === 'beginner' 
                        ? 'bg-gradient-to-r from-green-100 to-green-200 text-green-800 border-2 border-green-300 font-bold' :
                      course.difficulty === 'intermediate' 
                        ? 'bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 border-2 border-blue-300 font-bold' 
                        : 'bg-gradient-to-r from-purple-100 to-purple-200 text-purple-800 border-2 border-purple-300 font-bold'
                    }
                  >
                    {course.difficulty === 'beginner' ? '기초' : 
                     course.difficulty === 'intermediate' ? '중급' : '고급'}
                  </Badge>
                  <span className="text-sm text-gray-600 font-bold bg-white px-3 py-1 rounded-full border border-gray-200">{course.category}</span>
                </div>
                <CardTitle className="mt-2 text-xl font-bold text-[hsl(var(--oikos-navy))] leading-tight">
                  {course.title}
                </CardTitle>
                <CardDescription className="line-clamp-3 text-gray-600">
                  {course.description || "강의 설명이 제공되지 않습니다."}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1">
                {/* Additional course metadata could be displayed here */}
              </CardContent>
              <CardFooter className="bg-gradient-to-r from-blue-50 to-green-50 border-t-2 border-blue-100">
                <Button 
                  className={
                    isEnrolled 
                      ? "w-full border-2 border-gray-300 font-bold" 
                      : "w-full bg-gradient-to-r from-[hsl(var(--oikos-blue))] to-[hsl(var(--oikos-green))] hover:shadow-xl font-bold transform hover:scale-105 transition-all"
                  }
                  onClick={() => handleEnroll(course.id)}
                  disabled={isEnrolled || enroll.isPending}
                  variant={isEnrolled ? "outline" : "default"}
                >
                  {isEnrolled ? "수강 중" : "수강 신청"}
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>
      
      {coursesData?.courses.length === 0 && (
        <div className="text-center py-20 border-2 border-dashed border-blue-300 rounded-2xl text-gray-500 bg-white">
          <p className="text-2xl font-bold mb-2">개설된 강의가 없습니다</p>
          <p className="text-sm text-gray-500">새로운 강의가 곧 추가될 예정입니다</p>
        </div>
      )}
    </div>
  );
}

