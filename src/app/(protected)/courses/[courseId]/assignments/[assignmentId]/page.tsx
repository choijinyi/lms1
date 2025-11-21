"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAssignmentMutations } from "@/features/assignments/hooks/useAssignmentHooks";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

export default function AssignmentSubmissionPage() {
  const params = useParams();
  const assignmentId = params.assignmentId as string;
  const router = useRouter();
  const { toast } = useToast();
  const { submitAssignment } = useAssignmentMutations();
  const [isLoading, setIsLoading] = useState(false);

  // TODO: 과제 상세 정보 및 내 제출 현황(점수 등) 조회 필요
  // 현재는 제출 폼만 구현

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    
    const formData = new FormData(event.currentTarget);
    
    try {
      await submitAssignment.mutateAsync({
        assignmentId,
        text: formData.get("text") as string,
        link: formData.get("link") as string,
      });

      toast({
        title: "제출 완료",
        description: "과제가 성공적으로 제출되었습니다.",
      });
      
      router.back();
    } catch (error: any) {
      toast({
        title: "제출 실패",
        description: error.response?.data?.error?.message || "제출 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8 max-w-3xl">
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>과제 제출</CardTitle>
          <CardDescription>
            과제 내용을 작성하거나 외부 링크를 제출하세요.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="text">답안 작성 (필수)</Label>
              <Textarea 
                id="text" 
                name="text" 
                required 
                placeholder="여기에 답안을 작성하세요..." 
                className="min-h-[200px]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="link">외부 링크 (선택)</Label>
              <Input 
                id="link" 
                name="link" 
                type="url" 
                placeholder="https://github.com/..." 
              />
              <p className="text-xs text-muted-foreground">GitHub 저장소나 Google Drive 링크 등을 입력할 수 있습니다.</p>
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "제출 중..." : "제출하기"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

