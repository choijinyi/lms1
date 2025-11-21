"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useSubmissionsQuery, useAssignmentMutations } from "@/features/assignments/hooks/useAssignmentHooks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";

export default function GradeSubmissionsPage() {
  const params = useParams();
  const assignmentId = params.assignmentId as string;
  const { data, isLoading } = useSubmissionsQuery(assignmentId);
  const { gradeSubmission } = useAssignmentMutations();
  const { toast } = useToast();

  const [selectedSubmission, setSelectedSubmission] = useState<string | null>(null);
  const [score, setScore] = useState("");
  const [feedback, setFeedback] = useState("");
  const [isGrading, setIsGrading] = useState(false);

  const handleOpenGrade = (submission: any) => {
    setSelectedSubmission(submission.id);
    setScore(submission.score?.toString() || "");
    setFeedback(submission.feedback || "");
  };

  const handleGrade = async () => {
    if (!selectedSubmission) return;
    setIsGrading(true);

    try {
      await gradeSubmission.mutateAsync({
        submissionId: selectedSubmission,
        input: {
          score: Number(score),
          feedback: feedback,
          status: "graded",
        },
      });

      toast({ title: "채점 완료", description: "점수와 피드백이 저장되었습니다." });
      setSelectedSubmission(null);
    } catch (error: any) {
      toast({
        title: "채점 실패",
        description: error.message || "오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setIsGrading(false);
    }
  };

  if (isLoading) return <div className="p-8">로딩 중...</div>;

  return (
    <div className="container mx-auto py-8 space-y-6">
      <h1 className="text-2xl font-bold">제출물 관리 및 채점</h1>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>제출자 ID</TableHead>
              <TableHead>제출 일시</TableHead>
              <TableHead>상태</TableHead>
              <TableHead>점수</TableHead>
              <TableHead>지각 여부</TableHead>
              <TableHead className="text-right">액션</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data?.submissions.map((submission) => (
              <TableRow key={submission.id}>
                <TableCell className="font-mono text-xs">{submission.userId.slice(0, 8)}...</TableCell>
                <TableCell>{format(new Date(submission.submittedAt), "MM-dd HH:mm", { locale: ko })}</TableCell>
                <TableCell>
                  <Badge variant={submission.status === "graded" ? "default" : "secondary"}>
                    {submission.status === "graded" ? "채점됨" : "제출됨"}
                  </Badge>
                </TableCell>
                <TableCell>{submission.score !== null ? `${submission.score}점` : "-"}</TableCell>
                <TableCell>
                  {submission.late ? <Badge variant="destructive">지각</Badge> : "-"}
                </TableCell>
                <TableCell className="text-right">
                  <Button size="sm" onClick={() => handleOpenGrade(submission)}>
                    채점하기
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {data?.submissions.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                  아직 제출된 과제가 없습니다.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!selectedSubmission} onOpenChange={(open) => !open && setSelectedSubmission(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>과제 채점</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="score" className="text-right">점수</Label>
              <Input
                id="score"
                type="number"
                value={score}
                onChange={(e) => setScore(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="feedback" className="text-right">피드백</Label>
              <Textarea
                id="feedback"
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                className="col-span-3"
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedSubmission(null)}>취소</Button>
            <Button onClick={handleGrade} disabled={isGrading}>저장</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

