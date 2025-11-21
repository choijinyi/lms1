"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/remote/api-client";
import { CreateCourseByOperatorInputSchema, type CreateCourseByOperatorInput } from "@/features/courses/lib/dto";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

type Instructor = {
  id: string;
  name: string;
  email: string;
};

export default function OperatorCreateCoursePage() {
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);
  const [instructors, setInstructors] = useState<Instructor[]>([]);

  // 강사 목록 조회 (임시 구현: 실제로는 API를 통해 가져와야 함)
  useEffect(() => {
    const fetchInstructors = async () => {
      const supabase = getSupabaseBrowserClient();
      const { data } = await supabase
        .from('profiles')
        .select('id, name, email') // email은 profiles 테이블에 없을 수 있음 (auth.users 조인 필요하지만 여기선 name만)
        .eq('role', 'instructor');
        
      if (data) {
        setInstructors(data as any);
      }
    };
    fetchInstructors();
  }, []);

  const createMutation = useMutation({
    mutationFn: async (input: CreateCourseByOperatorInput) => {
      const { data } = await apiClient.post("/api/courses", input);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["courses"] });
      toast({ title: "코스 생성 완료", description: "새로운 코스가 생성되었습니다." });
      router.push("/operator/dashboard");
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
      instructorId: formData.get("instructorId") as string,
      curriculum: {},
    };

    try {
      const validated = CreateCourseByOperatorInputSchema.parse(input);
      await createMutation.mutateAsync(validated);
    } catch (error: any) {
      toast({
        title: "입력 오류",
        description: error.message || "입력값을 확인해주세요.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-10 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>수강과목 개설 (관리자)</CardTitle>
          <CardDescription>과목명과 담당 교수를 지정하여 새 강의를 개설합니다.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">과목명</Label>
              <Input id="title" name="title" required placeholder="예: 운영체제" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="instructorId">담당 교수</Label>
              <Select name="instructorId" required>
                <SelectTrigger>
                  <SelectValue placeholder="교수 선택" />
                </SelectTrigger>
                <SelectContent>
                  {instructors.map((inst) => (
                    <SelectItem key={inst.id} value={inst.id}>
                      {inst.name}
                    </SelectItem>
                  ))}
                  {instructors.length === 0 && (
                    <SelectItem value="disabled" disabled>등록된 강사가 없습니다</SelectItem>
                  )}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                * 목록에 교수가 없다면 먼저 강사 계정이 생성되어야 합니다.
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">설명</Label>
              <Textarea id="description" name="description" placeholder="과목에 대한 설명을 입력하세요." />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">카테고리 / 학부</Label>
                <Input id="category" name="category" required placeholder="예: 컴퓨터공학부" />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="difficulty">난이도 (학년)</Label>
                <Select name="difficulty" required defaultValue="beginner">
                  <SelectTrigger>
                    <SelectValue placeholder="난이도 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">1-2학년 (Beginner)</SelectItem>
                    <SelectItem value="intermediate">3학년 (Intermediate)</SelectItem>
                    <SelectItem value="advanced">4학년 (Advanced)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => router.back()}>취소</Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "생성 중..." : "과목 개설"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
