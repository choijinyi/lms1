"use client";

import Image from "next/image";
import Link from "next/link";
import { useCurrentUser } from "@/features/auth/hooks/useCurrentUser";
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
import { BookOpen, Search, GraduationCap } from "lucide-react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";

type DashboardPageProps = {
  params: Promise<Record<string, never>>;
};

export default function DashboardPage({ params }: DashboardPageProps) {
  void params;
  const { user } = useCurrentUser();
  const { data: myEnrollments, isLoading } = useMyEnrollmentsQuery();

  return (
    <div className="container mx-auto flex max-w-5xl flex-col gap-8 px-6 py-12">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">학습 대시보드</h1>
        <p className="text-slate-500">
          {user?.email ?? "사용자"}님, 오늘도 즐거운 학습 되세요!
        </p>
      </header>

      {/* 주요 액션 버튼 */}
      <section className="grid gap-4 md:grid-cols-3">
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Search className="h-5 w-5 text-primary" />
              코스 찾기
            </CardTitle>
            <CardDescription>새로운 배움을 시작해보세요.</CardDescription>
          </CardHeader>
          <CardFooter>
            <Link href="/courses" className="w-full">
              <Button className="w-full">전체 코스 보기</Button>
            </Link>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              내 강의실
            </CardTitle>
            <CardDescription>수강 중인 코스를 이어 학습하세요.</CardDescription>
          </CardHeader>
          <CardFooter>
            <Link href="/my-courses" className="w-full">
              <Button variant="outline" className="w-full">내 학습 현황</Button>
            </Link>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-primary" />
              수료증
            </CardTitle>
            <CardDescription>완료한 코스의 수료증을 확인하세요.</CardDescription>
          </CardHeader>
          <CardFooter>
            <Button variant="ghost" className="w-full" disabled>준비 중</Button>
          </CardFooter>
        </Card>
      </section>

      {/* 최근 수강 코스 요약 */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">최근 수강 신청 내역</h2>
          <Link href="/my-courses" className="text-sm text-primary hover:underline">
            전체 보기
          </Link>
        </div>

        <div className="grid gap-4">
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">로딩 중...</div>
          ) : myEnrollments?.enrollments.length === 0 ? (
            <div className="text-center py-12 border rounded-lg bg-muted/10 text-muted-foreground">
              <p className="mb-4">아직 수강 중인 코스가 없습니다.</p>
              <Link href="/courses">
                <Button variant="outline">코스 둘러보기</Button>
              </Link>
            </div>
          ) : (
            myEnrollments?.enrollments.slice(0, 3).map((enrollment) => (
              <Card key={enrollment.id} className="flex flex-row items-center justify-between p-4">
                <div className="flex flex-col gap-1">
                  <span className="font-medium">코스 ID: {enrollment.courseId}</span>
                  <span className="text-xs text-muted-foreground">
                    신청일: {format(new Date(enrollment.enrolledAt), "PPP", { locale: ko })}
                  </span>
                </div>
                <Link href={`/courses/${enrollment.courseId}`}>
                  <Button variant="secondary" size="sm">학습하기</Button>
                </Link>
              </Card>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
