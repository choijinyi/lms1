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
    <div className="container mx-auto py-12 max-w-3xl min-h-screen bg-gradient-to-b from-white to-gray-50">
      <div className="mb-8 pb-6 border-b-2 border-[hsl(var(--harvard-crimson))]">
        <h1 className="text-4xl font-bold font-serif text-[hsl(var(--harvard-crimson))] mb-2">
          Create New Course
        </h1>
        <p className="text-gray-600">Administrative Portal - Course Management</p>
      </div>
      
      <Card className="border-2 border-gray-200 shadow-xl">
        <CardHeader className="bg-gray-50 border-b-2 border-gray-200">
          <CardTitle className="text-2xl font-serif text-[hsl(var(--harvard-black))]">
            Course Details
          </CardTitle>
          <CardDescription className="text-gray-600">
            Enter the course information and assign a faculty member
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-7 pt-8">
            <div className="space-y-3">
              <Label htmlFor="title" className="text-base font-semibold text-gray-700">
                Course Title *
              </Label>
              <Input 
                id="title" 
                name="title" 
                required 
                placeholder="e.g., Introduction to Computer Science" 
                className="border-2 border-gray-300 focus:border-[hsl(var(--harvard-crimson))] text-base py-3"
              />
            </div>

            <div className="space-y-3">
              <Label htmlFor="instructorId" className="text-base font-semibold text-gray-700">
                Faculty Member *
              </Label>
              <Select name="instructorId" required>
                <SelectTrigger className="border-2 border-gray-300 focus:border-[hsl(var(--harvard-crimson))] text-base py-3">
                  <SelectValue placeholder="Select faculty member" />
                </SelectTrigger>
                <SelectContent>
                  {instructors.map((inst) => (
                    <SelectItem key={inst.id} value={inst.id} className="text-base py-2">
                      {inst.name}
                    </SelectItem>
                  ))}
                  {instructors.length === 0 && (
                    <SelectItem value="disabled" disabled>No faculty members registered</SelectItem>
                  )}
                </SelectContent>
              </Select>
              {instructors.length === 0 && (
                <p className="text-sm text-amber-600 bg-amber-50 p-3 rounded-md border border-amber-200">
                  ⚠️ Please ensure faculty accounts are created before adding courses
                </p>
              )}
            </div>
            
            <div className="space-y-3">
              <Label htmlFor="description" className="text-base font-semibold text-gray-700">
                Course Description
              </Label>
              <Textarea 
                id="description" 
                name="description" 
                placeholder="Provide a comprehensive description of the course objectives, content, and requirements" 
                className="border-2 border-gray-300 focus:border-[hsl(var(--harvard-crimson))] text-base min-h-32"
                rows={5}
              />
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-3">
                <Label htmlFor="category" className="text-base font-semibold text-gray-700">
                  Department *
                </Label>
                <Input 
                  id="category" 
                  name="category" 
                  required 
                  placeholder="e.g., Computer Science" 
                  className="border-2 border-gray-300 focus:border-[hsl(var(--harvard-crimson))] text-base py-3"
                />
              </div>
              
              <div className="space-y-3">
                <Label htmlFor="difficulty" className="text-base font-semibold text-gray-700">
                  Level *
                </Label>
                <Select name="difficulty" required defaultValue="beginner">
                  <SelectTrigger className="border-2 border-gray-300 focus:border-[hsl(var(--harvard-crimson))] text-base py-3">
                    <SelectValue placeholder="Select level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner" className="text-base py-2">Introductory (100-200)</SelectItem>
                    <SelectItem value="intermediate" className="text-base py-2">Intermediate (300)</SelectItem>
                    <SelectItem value="advanced" className="text-base py-2">Advanced (400+)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end gap-3 bg-gray-50 border-t-2 border-gray-200 py-5">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => router.back()}
              className="border-2 border-gray-300 font-semibold"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isLoading}
              className="bg-[hsl(var(--harvard-crimson))] hover:bg-[hsl(var(--harvard-crimson))]/90 font-semibold px-8"
            >
              {isLoading ? "Creating..." : "Create Course"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
