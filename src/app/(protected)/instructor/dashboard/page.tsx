"use client";

import Link from "next/link";
import { useCoursesQuery } from "@/features/courses/hooks/useCoursesQuery";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusCircle, BookOpen, Users, Settings } from "lucide-react";

export default function InstructorDashboard() {
  // TODO: 내 코스만 가져오는 쿼리로 변경 필요 (현재는 전체 공개 코스만 가져옴)
  // 백엔드에 getMyCourses (instructor_id 기준) API 추가 필요
  const { data: coursesData, isLoading } = useCoursesQuery({ limit: 5 });

  return (
    <div className="container mx-auto py-8 space-y-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">강사 대시보드</h1>
          <p className="text-muted-foreground">내 코스와 학습자 현황을 관리하세요.</p>
        </div>
        <Link href="/instructor/courses/new">
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            새 코스 만들기
          </Button>
        </Link>
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">총 개설 코스</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{coursesData?.total || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">총 수강생</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">-</div>
            <p className="text-xs text-muted-foreground">집계 중 (기능 미구현)</p>
          </CardContent>
        </Card>
      </div>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">최근 코스</h2>
          <Link href="/instructor/courses" className="text-sm text-primary hover:underline">
            전체 보기
          </Link>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {coursesData?.courses.map((course) => (
            <Card key={course.id} className="hover:bg-muted/50 transition-colors">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>{course.title}</CardTitle>
                    <CardDescription>{course.category} • {course.status}</CardDescription>
                  </div>
                  <Link href={`/instructor/courses/${course.id}/edit`}>
                    <Button variant="ghost" size="icon">
                      <Settings className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {course.description}
                </p>
                <div className="mt-4 flex gap-2">
                  <Link href={`/instructor/courses/${course.id}/assignments`} className="flex-1">
                    <Button variant="outline" size="sm" className="w-full">
                      과제 관리
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
          
          {coursesData?.courses.length === 0 && (
            <div className="col-span-full text-center py-8 text-muted-foreground border rounded-lg border-dashed">
              아직 개설한 코스가 없습니다. 첫 코스를 만들어보세요!
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

