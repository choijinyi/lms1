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
    <div className="mx-auto flex min-h-screen w-full max-w-4xl flex-col items-center justify-center gap-10 px-6 py-16">
      <header className="flex flex-col items-center gap-3 text-center">
        <h1 className="text-3xl font-semibold">로그인</h1>
        <p className="text-slate-500">
          Supabase 계정으로 로그인하고 보호된 페이지에 접근하세요.
        </p>
      </header>
      
      <div className="grid w-full gap-8 md:grid-cols-2">
        <div className="flex flex-col gap-6">
          <Tabs defaultValue="student" onValueChange={(val) => setLoginType(val as any)} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="student">
                <User className="mr-2 h-4 w-4" />
                학생
              </TabsTrigger>
              <TabsTrigger value="instructor">
                <GraduationCap className="mr-2 h-4 w-4" />
                강사
              </TabsTrigger>
              <TabsTrigger value="operator">
                <ShieldCheck className="mr-2 h-4 w-4" />
                관리자
              </TabsTrigger>
            </TabsList>
            
            <div className="mt-4">
              <p className="text-sm text-muted-foreground text-center mb-4">
                {loginType === "student" && "학습자 계정으로 로그인합니다."}
                {loginType === "instructor" && "강사 계정으로 로그인하여 코스를 관리합니다."}
                {loginType === "operator" && "관리자 계정으로 시스템을 관리합니다."}
              </p>
            </div>
          </Tabs>

          <form
            onSubmit={handleSubmit}
            className="flex flex-col gap-4 rounded-xl border border-slate-200 p-6 shadow-sm"
          >
            <label className="flex flex-col gap-2 text-sm text-slate-700">
              이메일
              <input
                type="email"
                name="email"
                autoComplete="email"
                required
                value={formState.email}
                onChange={handleChange}
                className="rounded-md border border-slate-300 px-3 py-2 focus:border-slate-500 focus:outline-none"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm text-slate-700">
              비밀번호
              <input
                type="password"
                name="password"
                autoComplete="current-password"
                required
                value={formState.password}
                onChange={handleChange}
                className="rounded-md border border-slate-300 px-3 py-2 focus:border-slate-500 focus:outline-none"
              />
            </label>
            {errorMessage ? (
              <p className="text-sm text-rose-500">{errorMessage}</p>
            ) : null}
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-400"
            >
              {isSubmitting ? "로그인 중" : "로그인"}
            </button>
            <p className="text-xs text-slate-500">
              계정이 없으신가요?{" "}
              <Link
                href="/signup"
                className="font-medium text-slate-700 underline hover:text-slate-900"
              >
                회원가입
              </Link>
            </p>
          </form>
        </div>

        <figure className="overflow-hidden rounded-xl border border-slate-200">
          <Image
            src={
              loginType === "instructor" 
                ? "https://picsum.photos/seed/instructor/640/640" 
                : loginType === "operator"
                ? "https://picsum.photos/seed/operator/640/640"
                : "https://picsum.photos/seed/login/640/640"
            }
            alt="로그인"
            width={640}
            height={640}
            className="h-full w-full object-cover transition-all duration-500"
            priority
          />
        </figure>
      </div>
    </div>
  );
}
