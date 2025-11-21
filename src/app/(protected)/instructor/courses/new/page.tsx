"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/remote/api-client";
import { CourseResponseSchema, CreateCourseInputSchema, type CreateCourseInput } from "@/features/courses/lib/dto";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export default function CreateCoursePage() {
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);

  const createMutation = useMutation({
    mutationFn: async (input: CreateCourseInput) => {
      const { data } = await apiClient.post("/api/courses", input);
      return CourseResponseSchema.parse(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["courses"] });
      toast({ title: "코스 생성 완료", description: "새로운 코스가 생성되었습니다." });
      router.push("/instructor/dashboard");
    },
    onError: (error: any) => {
      toast({
        title: "생성 실패",
        description: error.response?.data?.error?.message || "코스 생성 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    
    const formData = new FormData(event.currentTarget);
    const input = {
      title: formData.get("title") as string,
      description: formData.get("description") as string,
      category: formData.get("category") as string,
      difficulty: formData.get("difficulty") as any,
      curriculum: {}, // 초기에는 빈 커리큘럼
    };

    try {
      const validated = CreateCourseInputSchema.parse(input);
      await createMutation.mutateAsync(validated);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-10 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>새 코스 만들기</CardTitle>
          <CardDescription>코스의 기본 정보를 입력해주세요.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">코스 제목</Label>
              <Input id="title" name="title" required placeholder="예: React 실전 마스터" />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">설명</Label>
              <Textarea id="description" name="description" placeholder="이 코스에 대해 설명해주세요." />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">카테고리</Label>
                <Input id="category" name="category" required placeholder="예: Programming" />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="difficulty">난이도</Label>
                <Select name="difficulty" required defaultValue="beginner">
                  <SelectTrigger>
                    <SelectValue placeholder="난이도 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">초급 (Beginner)</SelectItem>
                    <SelectItem value="intermediate">중급 (Intermediate)</SelectItem>
                    <SelectItem value="advanced">고급 (Advanced)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => router.back()}>취소</Button>
            <Button type="submit" disabled={isLoading || createMutation.isPending}>
              {isLoading ? "생성 중..." : "코스 생성"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

