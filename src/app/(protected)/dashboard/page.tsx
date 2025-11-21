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
import { BookOpen, Search, GraduationCap, Award } from "lucide-react";
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
    <div className="container mx-auto flex max-w-6xl flex-col gap-10 px-6 py-12 bg-gradient-to-br from-blue-50 via-white to-green-50 min-h-screen">
      <header className="space-y-3 pb-6 border-b-4 border-gradient-to-r from-[hsl(var(--oikos-blue))] to-[hsl(var(--oikos-green))]">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-gradient-to-br from-[hsl(var(--oikos-blue))] to-[hsl(var(--oikos-green))] rounded-xl flex items-center justify-center shadow-lg">
            <span className="text-3xl font-bold text-white">O</span>
          </div>
          <div>
            <h1 className="text-5xl font-bold tracking-tight bg-gradient-to-r from-[hsl(var(--oikos-blue))] to-[hsl(var(--oikos-green))] bg-clip-text text-transparent">
              학생 대시보드
            </h1>
            <p className="text-gray-600 text-lg mt-1">
              안녕하세요, <span className="font-bold text-[hsl(var(--oikos-blue))]">{user?.email ?? "학생"}</span>님
            </p>
          </div>
        </div>
      </header>

      {/* Quick Actions */}
      <section className="grid gap-6 md:grid-cols-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 shadow-lg hover:shadow-2xl transition-all hover:-translate-y-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-xl flex items-center gap-2 font-bold">
              <Search className="h-6 w-6 text-[hsl(var(--oikos-blue))]" />
              강의 찾기
            </CardTitle>
            <CardDescription className="text-gray-700">새로운 학습 기회를 발견하세요</CardDescription>
          </CardHeader>
          <CardFooter>
            <Link href="/courses" className="w-full">
              <Button className="w-full bg-gradient-to-r from-[hsl(var(--oikos-blue))] to-[hsl(var(--oikos-green))] hover:shadow-xl font-bold transform hover:scale-105 transition-all">
                전체 강의 보기
              </Button>
            </Link>
          </CardFooter>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-200 shadow-lg hover:shadow-2xl transition-all hover:-translate-y-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-xl flex items-center gap-2 font-bold">
              <BookOpen className="h-6 w-6 text-[hsl(var(--oikos-green))]" />
              내 강의실
            </CardTitle>
            <CardDescription className="text-gray-700">수강 중인 강의를 계속하세요</CardDescription>
          </CardHeader>
          <CardFooter>
            <Link href="/my-courses" className="w-full">
              <Button variant="outline" className="w-full border-2 border-[hsl(var(--oikos-green))] text-[hsl(var(--oikos-green))] hover:bg-[hsl(var(--oikos-green))]/10 font-bold transform hover:scale-105 transition-all">
                학습 진도 보기
              </Button>
            </Link>
          </CardFooter>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-2 border-orange-200 shadow-lg hover:shadow-2xl transition-all hover:-translate-y-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-xl flex items-center gap-2 font-bold">
              <Award className="h-6 w-6 text-orange-600" />
              내 성적
            </CardTitle>
            <CardDescription className="text-gray-700">과제 성적과 피드백을 확인하세요</CardDescription>
          </CardHeader>
          <CardFooter>
            <Link href="/grades" className="w-full">
              <Button variant="outline" className="w-full border-2 border-orange-600 text-orange-600 hover:bg-orange-600/10 font-bold transform hover:scale-105 transition-all">
                성적 보기
              </Button>
            </Link>
          </CardFooter>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-200 shadow-lg hover:shadow-2xl transition-all hover:-translate-y-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-xl flex items-center gap-2 font-bold">
              <GraduationCap className="h-6 w-6 text-purple-600" />
              수료증
            </CardTitle>
            <CardDescription className="text-gray-700">학습 성과를 확인하세요</CardDescription>
          </CardHeader>
          <CardFooter>
            <Button variant="ghost" className="w-full font-bold text-gray-500" disabled>준비 중</Button>
          </CardFooter>
        </Card>
      </section>

      {/* Recent Enrollments */}
      <section className="space-y-6">
        <div className="flex items-center justify-between pb-3">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-[hsl(var(--oikos-blue))] to-[hsl(var(--oikos-green))] bg-clip-text text-transparent">
            최근 수강 신청
          </h2>
          <Link href="/my-courses" className="text-sm text-[hsl(var(--oikos-blue))] hover:underline font-bold flex items-center gap-1">
            전체 보기 →
          </Link>
        </div>

        <div className="grid gap-5">
          {isLoading ? (
            <div className="text-center py-12 text-gray-500 bg-white rounded-2xl border-2 border-blue-200 shadow-lg">
              강의 목록을 불러오는 중...
            </div>
          ) : myEnrollments?.enrollments.length === 0 ? (
            <div className="text-center py-16 border-2 border-dashed border-blue-300 rounded-2xl bg-gradient-to-br from-blue-50 to-white text-gray-600">
              <BookOpen className="h-16 w-16 mx-auto mb-4 text-blue-400" />
              <p className="mb-2 text-xl font-bold">아직 수강 중인 강의가 없습니다</p>
              <p className="mb-4 text-sm text-gray-500">새로운 강의를 신청하고 학습을 시작하세요</p>
              <Link href="/courses">
                <Button variant="outline" className="border-2 border-[hsl(var(--oikos-blue))] text-[hsl(var(--oikos-blue))] hover:bg-[hsl(var(--oikos-blue))]/10 font-bold transform hover:scale-105 transition-all">
                  강의 둘러보기
                </Button>
              </Link>
            </div>
          ) : (
            myEnrollments?.enrollments.slice(0, 3).map((enrollment) => (
              <Card key={enrollment.id} className="flex flex-row items-center justify-between p-6 border-2 border-blue-100 shadow-lg hover:shadow-2xl transition-all hover:-translate-y-1 bg-gradient-to-r from-white to-blue-50">
                <div className="flex flex-col gap-2">
                  <span className="font-bold text-lg text-[hsl(var(--oikos-navy))]">Course ID: {enrollment.courseId}</span>
                  <span className="text-sm text-gray-600">
                    수강신청일: {format(new Date(enrollment.enrolledAt), "PPP", { locale: ko })}
                  </span>
                </div>
                <Link href={`/courses/${enrollment.courseId}`}>
                  <Button variant="default" size="sm" className="bg-gradient-to-r from-[hsl(var(--oikos-blue))] to-[hsl(var(--oikos-green))] hover:shadow-xl font-bold transform hover:scale-105 transition-all">
                    학습 계속하기
                  </Button>
                </Link>
              </Card>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
