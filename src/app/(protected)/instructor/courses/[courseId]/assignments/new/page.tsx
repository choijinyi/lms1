"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAssignmentMutations } from "@/features/assignments/hooks/useAssignmentHooks";
import { CreateAssignmentInputSchema } from "@/features/assignments/lib/dto";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { addDays, format } from "date-fns";

export default function CreateAssignmentPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.courseId as string;
  const { createAssignment } = useAssignmentMutations();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    
    const formData = new FormData(event.currentTarget);
    
    try {
      const rawInput = {
        courseId,
        title: formData.get("title"),
        description: formData.get("description"),
        dueDate: new Date(formData.get("dueDate") as string).toISOString(),
        weight: Number(formData.get("weight") || 1),
        allowLate: formData.get("allowLate") === "on",
        allowResubmit: formData.get("allowResubmit") === "on",
        status: "published", // 바로 게시
      };

      const validated = CreateAssignmentInputSchema.parse(rawInput);
      await createAssignment.mutateAsync(validated);
      
      toast({ title: "과제 생성 완료", description: "과제가 게시되었습니다." });
      router.back();
    } catch (error: any) {
      toast({
        title: "오류 발생",
        description: error.message || "과제 생성 중 문제가 발생했습니다.",
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
          <CardTitle>새 과제 만들기</CardTitle>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">과제 제목</Label>
              <Input id="title" name="title" required />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">설명 / 지시사항</Label>
              <Textarea id="description" name="description" required className="min-h-[150px]" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dueDate">마감일</Label>
                <Input 
                  id="dueDate" 
                  name="dueDate" 
                  type="datetime-local" 
                  required 
                  defaultValue={format(addDays(new Date(), 7), "yyyy-MM-dd'T'HH:mm")}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="weight">가중치 (점수 배점)</Label>
                <Input id="weight" name="weight" type="number" defaultValue="1" step="0.1" min="0" />
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <Checkbox id="allowLate" name="allowLate" />
                <Label htmlFor="allowLate">지각 제출 허용</Label>
              </div>
              
              <div className="flex items-center gap-2">
                <Checkbox id="allowResubmit" name="allowResubmit" defaultChecked />
                <Label htmlFor="allowResubmit">재제출 허용</Label>
              </div>
            </div>
          </CardContent>
          <div className="p-6 pt-0 flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => router.back()}>취소</Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "생성 중..." : "과제 생성"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

