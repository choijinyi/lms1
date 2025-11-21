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
    <div className="container mx-auto py-12 space-y-8 min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      <header className="flex items-center justify-between pb-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-gradient-to-br from-[hsl(var(--oikos-blue))] to-[hsl(var(--oikos-green))] rounded-xl flex items-center justify-center shadow-lg">
            <span className="text-2xl font-bold text-white">O</span>
          </div>
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-[hsl(var(--oikos-blue))] to-[hsl(var(--oikos-green))] bg-clip-text text-transparent">
              강의 관리
            </h1>
            <p className="text-gray-600 mt-1">관리자 포털 - 전체 강의</p>
          </div>
        </div>
        <Link href="/operator/courses/new">
          <Button className="bg-gradient-to-r from-[hsl(var(--oikos-blue))] to-[hsl(var(--oikos-green))] hover:shadow-xl font-bold px-6 py-6 text-base shadow-lg transform hover:scale-105 transition-all">
            <PlusCircle className="mr-2 h-5 w-5" />
            새 강의 개설
          </Button>
        </Link>
      </header>

      <div className="grid gap-5">
        {data?.courses.map((course) => (
          <Card key={course.id} className="flex flex-row items-center justify-between p-6 border-2 border-blue-100 shadow-lg hover:shadow-2xl transition-all hover:-translate-y-1 bg-gradient-to-r from-white to-blue-50">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <CardTitle className="text-xl font-bold text-[hsl(var(--oikos-navy))]">
                  {course.title}
                </CardTitle>
                <Badge 
                  variant={course.status === 'published' ? 'default' : 'secondary'}
                  className={course.status === 'published' 
                    ? 'bg-gradient-to-r from-[hsl(var(--oikos-blue))] to-[hsl(var(--oikos-green))] border-0 font-bold' 
                    : 'bg-gray-400 border-0 font-bold'
                  }
                >
                  {course.status === 'published' ? '공개' : course.status === 'draft' ? '작성중' : '보관'}
                </Badge>
              </div>
              <CardDescription className="text-gray-600 font-medium">
                {course.category} • 난이도: {course.difficulty === 'beginner' ? '기초' : course.difficulty === 'intermediate' ? '중급' : '고급'}
              </CardDescription>
            </div>
            <div className="flex items-center gap-3">
              <Button 
                variant="outline" 
                size="sm" 
                className="border-2 border-[hsl(var(--oikos-blue))] text-[hsl(var(--oikos-blue))] font-bold hover:bg-[hsl(var(--oikos-blue))]/10 transform hover:scale-105 transition-all"
              >
                수정
              </Button>
              <Button 
                variant="destructive" 
                size="sm"
                className="font-bold transform hover:scale-105 transition-all"
              >
                삭제
              </Button>
            </div>
          </Card>
        ))}
        {data?.courses.length === 0 && (
          <div className="text-center py-20 border-2 border-dashed border-blue-300 rounded-2xl text-gray-500 bg-white">
            <PlusCircle className="h-16 w-16 mx-auto mb-4 text-blue-400" />
            <p className="text-xl font-bold mb-2">등록된 강의가 없습니다</p>
            <p className="text-sm text-gray-500 mb-4">첫 번째 강의를 개설해보세요</p>
            <Link href="/operator/courses/new">
              <Button 
                variant="outline" 
                className="border-2 border-[hsl(var(--oikos-blue))] text-[hsl(var(--oikos-blue))] hover:bg-[hsl(var(--oikos-blue))]/10 font-bold transform hover:scale-105 transition-all"
              >
                강의 개설하기
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

