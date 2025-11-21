"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser-client";
import { useCurrentUser } from "@/features/auth/hooks/useCurrentUser";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { BookOpen, GraduationCap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function OnboardingPage() {
  const router = useRouter();
  const { user, refresh } = useCurrentUser();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleRoleSelection = async (role: "learner" | "instructor") => {
    if (!user) return;
    setIsLoading(true);

    try {
      const supabase = getSupabaseBrowserClient();
      
      // 1. profiles 테이블 업데이트
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ role })
        .eq("id", user.id);

      if (profileError) throw profileError;

      // 2. auth.users 메타데이터 업데이트 (선택 사항이지만 싱크를 위해 권장)
      const { error: authError } = await supabase.auth.updateUser({
        data: { role },
      });

      if (authError) throw authError;

      await refresh();

      toast({
        title: "역할 설정 완료",
        description: `${role === 'instructor' ? '강사' : '학습자'}로 시작합니다.`,
      });

      // 역할에 따라 리다이렉트
      if (role === "instructor") {
        router.replace("/instructor/dashboard");
      } else {
        router.replace("/dashboard");
      }
    } catch (error: any) {
      toast({
        title: "설정 실패",
        description: error.message || "역할을 설정하는 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container flex h-screen w-full items-center justify-center py-10">
      <div className="w-full max-w-3xl space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">환영합니다!</h1>
          <p className="text-muted-foreground">
            서비스를 어떤 용도로 사용하시겠습니까?
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card 
            className="cursor-pointer transition-all hover:border-primary hover:bg-muted/50"
            onClick={() => handleRoleSelection("learner")}
          >
            <CardHeader>
              <BookOpen className="h-10 w-10 text-primary mb-2" />
              <CardTitle>학습자 (Learner)</CardTitle>
              <CardDescription>
                강의를 수강하고 과제를 제출하며 학습합니다.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card 
            className="cursor-pointer transition-all hover:border-primary hover:bg-muted/50"
            onClick={() => handleRoleSelection("instructor")}
          >
            <CardHeader>
              <GraduationCap className="h-10 w-10 text-primary mb-2" />
              <CardTitle>강사 (Instructor)</CardTitle>
              <CardDescription>
                새로운 코스를 개설하고 과제를 관리하며 학생들을 지도합니다.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    </div>
  );
}

