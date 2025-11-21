"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/remote/api-client";
import { CourseResponseSchema, UpdateCourseInputSchema, type UpdateCourseInput } from "@/features/courses/lib/dto";
import { useCourseMutations } from "@/features/courses/hooks/useCourseMutations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export default function EditCoursePage() {
  const router = useRouter();
  const params = useParams();
  const courseId = params.courseId as string;
  const { toast } = useToast();
  const { updateCourse } = useCourseMutations();
  const [isLoading, setIsLoading] = useState(false);

  const { data: course, isLoading: isFetching } = useQuery({
    queryKey: ['course', courseId],
    queryFn: async () => {
      const { data } = await apiClient.get(`/api/courses/${courseId}`);
      return CourseResponseSchema.parse(data);
    },
    enabled: !!courseId,
  });

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);

    const formData = new FormData(event.currentTarget);
    const input: UpdateCourseInput = {
      title: formData.get("title") as string,
      description: formData.get("description") as string,
      category: formData.get("category") as string,
      difficulty: formData.get("difficulty") as any,
      status: formData.get("status") as any,
    };

    try {
      const validated = UpdateCourseInputSchema.parse(input);
      await updateCourse.mutateAsync({ courseId, input: validated });
      toast({ title: "코스 수정 완료", description: "코스가 성공적으로 수정되었습니다." });
      router.push("/instructor/dashboard");
    } catch (error: any) {
      toast({
        title: "수정 실패",
        description: error.response?.data?.error?.message || "코스 수정 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetching) {
    return (
      <div className="container mx-auto py-10 max-w-2xl">
        <Card>
          <CardContent className="py-10 text-center">
            <p>로딩 중...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="container mx-auto py-10 max-w-2xl">
        <Card>
          <CardContent className="py-10 text-center">
            <p>코스를 찾을 수 없습니다.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>코스 수정</CardTitle>
          <CardDescription>코스의 정보를 수정해주세요.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">코스 제목</Label>
              <Input
                id="title"
                name="title"
                required
                defaultValue={course.title}
                placeholder="예: React 실전 마스터"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">설명</Label>
              <Textarea
                id="description"
                name="description"
                defaultValue={course.description || ""}
                placeholder="이 코스에 대해 설명해주세요."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">카테고리</Label>
                <Input
                  id="category"
                  name="category"
                  required
                  defaultValue={course.category}
                  placeholder="예: Programming"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="difficulty">난이도</Label>
                <Select name="difficulty" required defaultValue={course.difficulty}>
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

            <div className="space-y-2">
              <Label htmlFor="status">상태</Label>
              <Select name="status" required defaultValue={course.status}>
                <SelectTrigger>
                  <SelectValue placeholder="상태 선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">초안 (Draft)</SelectItem>
                  <SelectItem value="published">게시됨 (Published)</SelectItem>
                  <SelectItem value="archived">보관됨 (Archived)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => router.back()}>취소</Button>
            <Button type="submit" disabled={isLoading || updateCourse.isPending}>
              {isLoading ? "수정 중..." : "코스 수정"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
