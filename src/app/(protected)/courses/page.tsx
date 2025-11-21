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
    <div className="container mx-auto py-12 space-y-8 min-h-screen bg-gradient-to-b from-white to-gray-50">
      <header className="pb-6 border-b-2 border-[hsl(var(--harvard-crimson))]">
        <h1 className="text-5xl font-bold font-serif text-[hsl(var(--harvard-crimson))]">
          Course Catalog
        </h1>
        <p className="text-gray-600 mt-2 text-lg">
          Explore our comprehensive academic offerings
        </p>
      </header>

      <div className="grid gap-7 md:grid-cols-2 lg:grid-cols-3">
        {coursesData?.courses.map((course) => {
          const isEnrolled = enrolledCourseIds.has(course.id);
          
          return (
            <Card key={course.id} className="flex flex-col border-2 border-gray-200 shadow-lg hover:shadow-xl transition-shadow bg-white">
              <CardHeader className="space-y-3">
                <div className="flex justify-between items-start">
                  <Badge 
                    variant="secondary"
                    className={
                      course.difficulty === 'beginner' 
                        ? 'bg-green-100 text-green-800 border-green-300' :
                      course.difficulty === 'intermediate' 
                        ? 'bg-blue-100 text-blue-800 border-blue-300' 
                        : 'bg-purple-100 text-purple-800 border-purple-300'
                    }
                  >
                    {course.difficulty === 'beginner' ? '100-200' : 
                     course.difficulty === 'intermediate' ? '300' : '400+'}
                  </Badge>
                  <span className="text-sm text-gray-600 font-semibold">{course.category}</span>
                </div>
                <CardTitle className="mt-2 text-xl font-serif text-[hsl(var(--harvard-black))] leading-tight">
                  {course.title}
                </CardTitle>
                <CardDescription className="line-clamp-3 text-gray-600">
                  {course.description || "Course description not available."}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1">
                {/* Additional course metadata could be displayed here */}
              </CardContent>
              <CardFooter className="bg-gray-50 border-t border-gray-200">
                <Button 
                  className={
                    isEnrolled 
                      ? "w-full border-2 border-gray-300 font-semibold" 
                      : "w-full bg-[hsl(var(--harvard-crimson))] hover:bg-[hsl(var(--harvard-crimson))]/90 font-semibold shadow-md"
                  }
                  onClick={() => handleEnroll(course.id)}
                  disabled={isEnrolled || enroll.isPending}
                  variant={isEnrolled ? "outline" : "default"}
                >
                  {isEnrolled ? "Already Enrolled" : "Enroll Now"}
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>
      
      {coursesData?.courses.length === 0 && (
        <div className="text-center py-20 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 bg-white">
          <p className="text-xl font-serif">No courses available at this time</p>
          <p className="text-sm text-gray-500 mt-2">Please check back later for new course offerings</p>
        </div>
      )}
    </div>
  );
}

