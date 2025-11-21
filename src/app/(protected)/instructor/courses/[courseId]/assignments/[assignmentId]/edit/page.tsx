"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/remote/api-client";
import { useAssignmentMutations } from "@/features/assignments/hooks/useAssignmentHooks";
import { AssignmentSchema, UpdateAssignmentInputSchema } from "@/features/assignments/lib/dto";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";

export default function EditAssignmentPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.courseId as string;
  const assignmentId = params.assignmentId as string;
  const { updateAssignment } = useAssignmentMutations();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const { data: assignment, isLoading: isFetching } = useQuery({
    queryKey: ['assignment', assignmentId],
    queryFn: async () => {
      const { data } = await apiClient.get(`/api/assignments/course/${courseId}`);
      const assignments = data.assignments || [];
      const assignment = assignments.find((a: any) => a.id === assignmentId);
      if (!assignment) throw new Error('Assignment not found');
      return AssignmentSchema.parse(assignment);
    },
    enabled: !!assignmentId && !!courseId,
  });

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);

    const formData = new FormData(event.currentTarget);

    try {
      const rawInput = {
        title: formData.get("title"),
        description: formData.get("description"),
        dueDate: new Date(formData.get("dueDate") as string).toISOString(),
        weight: Number(formData.get("weight") || 1),
        allowLate: formData.get("allowLate") === "on",
        allowResubmit: formData.get("allowResubmit") === "on",
        status: formData.get("status") as any,
      };

      const validated = UpdateAssignmentInputSchema.parse(rawInput);
      await updateAssignment.mutateAsync({ assignmentId, input: validated });

      toast({ title: "과제 수정 완료", description: "과제가 성공적으로 수정되었습니다." });
      router.back();
    } catch (error: any) {
      toast({
        title: "오류 발생",
        description: error.message || "과제 수정 중 문제가 발생했습니다.",
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

  if (!assignment) {
    return (
      <div className="container mx-auto py-10 max-w-2xl">
        <Card>
          <CardContent className="py-10 text-center">
            <p>과제를 찾을 수 없습니다.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const formattedDueDate = format(new Date(assignment.dueDate), "yyyy-MM-dd'T'HH:mm");

  return (
    <div className="container mx-auto py-10 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>과제 수정</CardTitle>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">과제 제목</Label>
              <Input id="title" name="title" required defaultValue={assignment.title} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">설명 / 지시사항</Label>
              <Textarea
                id="description"
                name="description"
                required
                className="min-h-[150px]"
                defaultValue={assignment.description}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dueDate">마감일</Label>
                <Input
                  id="dueDate"
                  name="dueDate"
                  type="datetime-local"
                  required
                  defaultValue={formattedDueDate}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="weight">가중치 (점수 배점)</Label>
                <Input
                  id="weight"
                  name="weight"
                  type="number"
                  defaultValue={assignment.weight}
                  step="0.1"
                  min="0"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">상태</Label>
              <Select name="status" required defaultValue={assignment.status}>
                <SelectTrigger>
                  <SelectValue placeholder="상태 선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">초안 (Draft)</SelectItem>
                  <SelectItem value="published">게시됨 (Published)</SelectItem>
                  <SelectItem value="closed">마감됨 (Closed)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="allowLate"
                  name="allowLate"
                  defaultChecked={assignment.allowLate}
                />
                <Label htmlFor="allowLate">지각 제출 허용</Label>
              </div>

              <div className="flex items-center gap-2">
                <Checkbox
                  id="allowResubmit"
                  name="allowResubmit"
                  defaultChecked={assignment.allowResubmit}
                />
                <Label htmlFor="allowResubmit">재제출 허용</Label>
              </div>
            </div>
          </CardContent>
          <div className="p-6 pt-0 flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => router.back()}>
              취소
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "수정 중..." : "과제 수정"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
