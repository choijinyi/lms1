"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser-client";
import { useCurrentUser } from "@/features/auth/hooks/useCurrentUser";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GraduationCap, User, ShieldCheck } from "lucide-react";

type LoginPageProps = {
  params: Promise<Record<string, never>>;
};

export default function LoginPage({ params }: LoginPageProps) {
  void params;
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refresh, isAuthenticated } = useCurrentUser();
  const [formState, setFormState] = useState({ email: "", password: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loginType, setLoginType] = useState<"student" | "instructor" | "operator">("student");

  useEffect(() => {
    if (isAuthenticated) {
      const redirectedFrom = searchParams.get("redirectedFrom") ?? "/";
      router.replace(redirectedFrom);
    }
  }, [isAuthenticated, router, searchParams]);

  const handleChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value } = event.target;
      setFormState((prev) => ({ ...prev, [name]: value }));
    },
    []
  );

  const handleSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setIsSubmitting(true);
      setErrorMessage(null);
      const supabase = getSupabaseBrowserClient();

      try {
        const result = await supabase.auth.signInWithPassword({
          email: formState.email,
          password: formState.password,
        });

        if (result.error) {
          setErrorMessage(result.error.message ?? "로그인에 실패했습니다.");
          setIsSubmitting(false);
          return;
        }

        await refresh();
        
        // 로그인 성공 후 역할 확인 (선택사항: 역할이 다르면 경고하거나 차단할 수 있음)
        // 현재는 단순 UI 구분이지만, 필요시 여기서 user_metadata.role 체크 가능
        
        const redirectedFrom = searchParams.get("redirectedFrom") ?? "/";
        router.replace(redirectedFrom);
      } catch (error) {
        setErrorMessage("로그인 처리 중 오류가 발생했습니다.");
        setIsSubmitting(false);
      }
    },
    [formState.email, formState.password, refresh, router, searchParams]
  );

  if (isAuthenticated) {
    return null;
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col items-center justify-center gap-12 px-6 py-16 bg-gradient-to-br from-blue-50 via-white to-green-50">
      <header className="flex flex-col items-center gap-4 text-center">
        <div className="w-24 h-24 bg-gradient-to-br from-[hsl(var(--oikos-blue))] to-[hsl(var(--oikos-green))] rounded-2xl flex items-center justify-center mb-2 shadow-xl transform hover:scale-105 transition-transform">
          <span className="text-5xl font-bold text-white">O</span>
        </div>
        <h1 className="text-5xl font-bold bg-gradient-to-r from-[hsl(var(--oikos-blue))] to-[hsl(var(--oikos-green))] bg-clip-text text-transparent tracking-tight">
          OIKOS University
        </h1>
        <p className="text-gray-600 text-lg max-w-md">
          Welcome to your learning journey
        </p>
      </header>
        
        <div className="grid w-full gap-10 md:grid-cols-2 max-w-4xl">
          <div className="flex flex-col gap-6">
            <Tabs defaultValue="student" onValueChange={(val) => setLoginType(val as any)} className="w-full">
              <TabsList className="grid w-full grid-cols-3 bg-gradient-to-r from-blue-50 to-green-50 p-1 rounded-xl border-2 border-blue-200">
                <TabsTrigger 
                  value="student" 
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[hsl(var(--oikos-blue))] data-[state=active]:to-[hsl(var(--oikos-green))] data-[state=active]:text-white font-semibold rounded-lg"
                >
                  <User className="mr-2 h-4 w-4" />
                  학생
                </TabsTrigger>
                <TabsTrigger 
                  value="instructor"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[hsl(var(--oikos-blue))] data-[state=active]:to-[hsl(var(--oikos-green))] data-[state=active]:text-white font-semibold rounded-lg"
                >
                  <GraduationCap className="mr-2 h-4 w-4" />
                  교수
                </TabsTrigger>
                <TabsTrigger 
                  value="operator"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[hsl(var(--oikos-blue))] data-[state=active]:to-[hsl(var(--oikos-green))] data-[state=active]:text-white font-semibold rounded-lg"
                >
                  <ShieldCheck className="mr-2 h-4 w-4" />
                  관리자
                </TabsTrigger>
              </TabsList>
              
              <div className="mt-4">
                <p className="text-sm text-gray-600 text-center mb-4">
                  {loginType === "student" && "🎓 강의 수강 및 학습 진도를 관리하세요"}
                  {loginType === "instructor" && "👨‍🏫 강의를 개설하고 학생들을 지도하세요"}
                  {loginType === "operator" && "⚙️ 시스템을 관리하고 운영하세요"}
                </p>
              </div>
            </Tabs>

            <form
              onSubmit={handleSubmit}
              className="flex flex-col gap-5 rounded-2xl border-2 border-blue-100 p-8 shadow-2xl bg-white"
            >
              <label className="flex flex-col gap-2 text-sm text-gray-700 font-medium">
                이메일
                <input
                  type="email"
                  name="email"
                  autoComplete="email"
                  required
                  value={formState.email}
                  onChange={handleChange}
                  className="rounded-xl border-2 border-gray-300 px-4 py-3 focus:border-[hsl(var(--oikos-blue))] focus:ring-2 focus:ring-[hsl(var(--oikos-blue))]/20 focus:outline-none transition-all"
                  placeholder="your.email@oikos.edu"
                />
              </label>
              <label className="flex flex-col gap-2 text-sm text-gray-700 font-medium">
                비밀번호
                <input
                  type="password"
                  name="password"
                  autoComplete="current-password"
                  required
                  value={formState.password}
                  onChange={handleChange}
                  className="rounded-xl border-2 border-gray-300 px-4 py-3 focus:border-[hsl(var(--oikos-blue))] focus:ring-2 focus:ring-[hsl(var(--oikos-blue))]/20 focus:outline-none transition-all"
                  placeholder="••••••••"
                />
              </label>
              {errorMessage ? (
                <p className="text-sm text-rose-600 bg-rose-50 p-3 rounded-xl border border-rose-200">{errorMessage}</p>
              ) : null}
              <button
                type="submit"
                disabled={isSubmitting}
                className="rounded-xl bg-gradient-to-r from-[hsl(var(--oikos-blue))] to-[hsl(var(--oikos-green))] px-4 py-3 text-base font-bold text-white transition hover:shadow-xl hover:scale-105 disabled:cursor-not-allowed disabled:opacity-50 shadow-lg transform"
              >
                {isSubmitting ? "로그인 중..." : "로그인"}
              </button>
              <p className="text-sm text-gray-600 text-center">
                계정이 없으신가요?{" "}
                <Link
                  href="/signup"
                  className="font-bold text-[hsl(var(--oikos-blue))] hover:underline"
                >
                  회원가입
                </Link>
              </p>
            </form>
          </div>

          <figure className="overflow-hidden rounded-2xl border-2 border-blue-200 shadow-2xl relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-[hsl(var(--oikos-blue))]/10 to-[hsl(var(--oikos-green))]/10 z-10 group-hover:opacity-0 transition-opacity"></div>
            <Image
              src={
                loginType === "instructor" 
                  ? "https://picsum.photos/seed/oikos-faculty/640/640" 
                  : loginType === "operator"
                  ? "https://picsum.photos/seed/oikos-admin/640/640"
                  : "https://picsum.photos/seed/oikos-campus/640/640"
              }
              alt="OIKOS University"
              width={640}
              height={640}
              className="h-full w-full object-cover transition-all duration-500 group-hover:scale-110"
              priority
            />
          </figure>
        </div>
    </div>
  );
}
