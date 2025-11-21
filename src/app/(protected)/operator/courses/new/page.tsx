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
    <div className="container mx-auto py-12 max-w-3xl min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      <div className="mb-8 pb-6 flex items-center gap-4">
        <div className="w-14 h-14 bg-gradient-to-br from-[hsl(var(--oikos-blue))] to-[hsl(var(--oikos-green))] rounded-xl flex items-center justify-center shadow-lg">
          <span className="text-2xl font-bold text-white">O</span>
        </div>
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-[hsl(var(--oikos-blue))] to-[hsl(var(--oikos-green))] bg-clip-text text-transparent mb-1">
            새 강의 개설
          </h1>
          <p className="text-gray-600">관리자 포털 - 강의 관리</p>
        </div>
      </div>
      
      <Card className="border-2 border-blue-200 shadow-2xl">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-green-50 border-b-2 border-blue-200">
          <CardTitle className="text-2xl font-bold text-[hsl(var(--oikos-navy))]">
            강의 상세 정보
          </CardTitle>
          <CardDescription className="text-gray-600">
            강의 정보를 입력하고 담당 교수를 지정하세요
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-7 pt-8 bg-white">
            <div className="space-y-3">
              <Label htmlFor="title" className="text-base font-bold text-gray-700">
                강의명 *
              </Label>
              <Input 
                id="title" 
                name="title" 
                required 
                placeholder="예: 컴퓨터과학 입문" 
                className="border-2 border-gray-300 focus:border-[hsl(var(--oikos-blue))] focus:ring-2 focus:ring-[hsl(var(--oikos-blue))]/20 text-base py-3 rounded-xl"
              />
            </div>

            <div className="space-y-3">
              <Label htmlFor="instructorId" className="text-base font-bold text-gray-700">
                담당 교수 *
              </Label>
              <Select name="instructorId" required>
                <SelectTrigger className="border-2 border-gray-300 focus:border-[hsl(var(--oikos-blue))] focus:ring-2 focus:ring-[hsl(var(--oikos-blue))]/20 text-base py-3 rounded-xl">
                  <SelectValue placeholder="교수 선택" />
                </SelectTrigger>
                <SelectContent>
                  {instructors.map((inst) => (
                    <SelectItem key={inst.id} value={inst.id} className="text-base py-2">
                      {inst.name}
                    </SelectItem>
                  ))}
                  {instructors.length === 0 && (
                    <SelectItem value="disabled" disabled>등록된 교수가 없습니다</SelectItem>
                  )}
                </SelectContent>
              </Select>
              {instructors.length === 0 && (
                <p className="text-sm text-amber-600 bg-amber-50 p-3 rounded-xl border-2 border-amber-200">
                  ⚠️ 강의를 개설하기 전에 교수 계정을 먼저 생성해주세요
                </p>
              )}
            </div>
            
            <div className="space-y-3">
              <Label htmlFor="description" className="text-base font-bold text-gray-700">
                강의 설명
              </Label>
              <Textarea 
                id="description" 
                name="description" 
                placeholder="강의 목표, 내용 및 요구사항에 대한 상세한 설명을 입력하세요" 
                className="border-2 border-gray-300 focus:border-[hsl(var(--oikos-blue))] focus:ring-2 focus:ring-[hsl(var(--oikos-blue))]/20 text-base min-h-32 rounded-xl"
                rows={5}
              />
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-3">
                <Label htmlFor="category" className="text-base font-bold text-gray-700">
                  학과/분야 *
                </Label>
                <Input 
                  id="category" 
                  name="category" 
                  required 
                  placeholder="예: 컴퓨터공학" 
                  className="border-2 border-gray-300 focus:border-[hsl(var(--oikos-blue))] focus:ring-2 focus:ring-[hsl(var(--oikos-blue))]/20 text-base py-3 rounded-xl"
                />
              </div>
              
              <div className="space-y-3">
                <Label htmlFor="difficulty" className="text-base font-bold text-gray-700">
                  난이도 *
                </Label>
                <Select name="difficulty" required defaultValue="beginner">
                  <SelectTrigger className="border-2 border-gray-300 focus:border-[hsl(var(--oikos-blue))] focus:ring-2 focus:ring-[hsl(var(--oikos-blue))]/20 text-base py-3 rounded-xl">
                    <SelectValue placeholder="난이도 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner" className="text-base py-2">기초 (1-2학년)</SelectItem>
                    <SelectItem value="intermediate" className="text-base py-2">중급 (3학년)</SelectItem>
                    <SelectItem value="advanced" className="text-base py-2">고급 (4학년)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end gap-3 bg-gradient-to-r from-blue-50 to-green-50 border-t-2 border-blue-200 py-5">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => router.back()}
              className="border-2 border-gray-300 font-bold hover:bg-gray-100 transform hover:scale-105 transition-all"
            >
              취소
            </Button>
            <Button 
              type="submit" 
              disabled={isLoading}
              className="bg-gradient-to-r from-[hsl(var(--oikos-blue))] to-[hsl(var(--oikos-green))] hover:shadow-xl font-bold px-8 transform hover:scale-105 transition-all"
            >
              {isLoading ? "생성 중..." : "강의 개설"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
