"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Users, Settings } from "lucide-react";

export default function OperatorDashboard() {
  return (
    <div className="container mx-auto py-8 space-y-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">관리자 대시보드</h1>
          <p className="text-muted-foreground">전체 시스템 현황을 관리하세요.</p>
        </div>
      </header>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
          <Link href="/operator/courses">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">전체 코스 관리</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">코스 개설 / 관리</div>
              <p className="text-xs text-muted-foreground">모든 코스를 생성하고 수정할 수 있습니다.</p>
            </CardContent>
          </Link>
        </Card>

        <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
          <Link href="/operator/enrollments">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">수강신청 현황</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">수강 내역 조회</div>
              <p className="text-xs text-muted-foreground">학생들의 수강 신청 내역을 확인합니다.</p>
            </CardContent>
          </Link>
        </Card>

        <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
          <Link href="/operator/reports">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">신고 관리</CardTitle>
              <Settings className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">시스템 설정</div>
              <p className="text-xs text-muted-foreground">신고 내역 및 기타 설정을 관리합니다.</p>
            </CardContent>
          </Link>
        </Card>
      </div>
    </div>
  );
}

