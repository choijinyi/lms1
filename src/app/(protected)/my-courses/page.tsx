"use client";

import { useMyEnrollmentsQuery } from "@/features/enrollments/hooks/useMyEnrollmentsQuery";
import { useCoursesQuery } from "@/features/courses/hooks/useCoursesQuery";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ko } from "date-fns/locale";

export default function MyEnrollmentsPage() {
  const { data: myEnrollments, isLoading: isEnrollmentsLoading } = useMyEnrollmentsQuery();
  
  // 모든 코스 정보를 가져와서 매핑 (실제로는 백엔드에서 조인해서 내려주는게 효율적이지만, 현재 구조상 클라이언트에서 처리)
  // 혹은 getMyEnrollments API가 코스 정보를 포함하도록 수정하는 것이 좋음 (TODO)
  // 여기서는 간단히 구현하기 위해 수강 목록만 보여주거나, 필요한 경우 개별 쿼리를 하겠지만,
  // 효율성을 위해 일단 API 응답에 코스 정보가 없으므로 UI만 잡고 추후 API 개선 필요성을 주석으로 남김
  
  // 임시: 코스 상세 정보를 가져오기 위해 전체 코스 쿼리 사용 (비효율적이나 데모용)
  // 실제로는 API에서 join된 데이터를 받아야 함.
  const { data: allCourses } = useCoursesQuery({ limit: 100 });

  if (isEnrollmentsLoading) {
    return <div className="p-8 text-center">로딩 중...</div>;
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <header>
        <h1 className="text-3xl font-bold">내 학습 현황</h1>
        <p className="text-muted-foreground mt-2">수강 중인 코스와 진행 상황을 확인하세요.</p>
      </header>

      <div className="grid gap-6">
        {myEnrollments?.enrollments.map((enrollment) => {
          const course = allCourses?.courses.find(c => c.id === enrollment.courseId);
          
          return (
            <Card key={enrollment.id}>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>{course?.title || "코스 정보 로딩 중..."}</CardTitle>
                  <Badge variant="outline">
                    {enrollment.enrolledAt ? 
                      format(new Date(enrollment.enrolledAt), "yyyy-MM-dd", { locale: ko }) + " 신청" 
                      : ""}
                  </Badge>
                </div>
                <CardDescription>{course?.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4 text-sm text-muted-foreground">
                  <div>
                    <span className="font-medium text-foreground">상태:</span> 수강 중
                  </div>
                  {/* 학점/진도율 등 추가 예정 */}
                  <div>
                    <span className="font-medium text-foreground">난이도:</span> {course?.difficulty}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {myEnrollments?.enrollments.length === 0 && (
          <div className="text-center py-12 border rounded-lg bg-muted/10 text-muted-foreground">
            아직 수강 신청한 코스가 없습니다.
          </div>
        )}
      </div>
    </div>
  );
}

