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
    <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col items-center justify-center gap-12 px-6 py-16 bg-gradient-to-b from-white to-gray-50">
      <header className="flex flex-col items-center gap-4 text-center">
        <div className="w-20 h-20 bg-[hsl(var(--harvard-crimson))] rounded-full flex items-center justify-center mb-2">
          <span className="text-4xl font-bold text-white font-serif">H</span>
        </div>
        <h1 className="text-5xl font-bold text-[hsl(var(--harvard-crimson))] font-serif tracking-tight">
          Harvard Portal
        </h1>
        <p className="text-gray-600 text-lg max-w-md">
          Enter your credentials to access the academic portal
        </p>
      </header>
        
        <div className="grid w-full gap-10 md:grid-cols-2 max-w-4xl">
          <div className="flex flex-col gap-6">
            <Tabs defaultValue="student" onValueChange={(val) => setLoginType(val as any)} className="w-full">
              <TabsList className="grid w-full grid-cols-3 bg-gray-100 p-1 rounded-lg">
                <TabsTrigger 
                  value="student" 
                  className="data-[state=active]:bg-[hsl(var(--harvard-crimson))] data-[state=active]:text-white font-semibold"
                >
                  <User className="mr-2 h-4 w-4" />
                  Student
                </TabsTrigger>
                <TabsTrigger 
                  value="instructor"
                  className="data-[state=active]:bg-[hsl(var(--harvard-crimson))] data-[state=active]:text-white font-semibold"
                >
                  <GraduationCap className="mr-2 h-4 w-4" />
                  Faculty
                </TabsTrigger>
                <TabsTrigger 
                  value="operator"
                  className="data-[state=active]:bg-[hsl(var(--harvard-crimson))] data-[state=active]:text-white font-semibold"
                >
                  <ShieldCheck className="mr-2 h-4 w-4" />
                  Admin
                </TabsTrigger>
              </TabsList>
              
              <div className="mt-4">
                <p className="text-sm text-gray-600 text-center mb-4 italic">
                  {loginType === "student" && "Access your courses and academic progress"}
                  {loginType === "instructor" && "Manage courses and evaluate student work"}
                  {loginType === "operator" && "Administer the academic system"}
                </p>
              </div>
            </Tabs>

            <form
              onSubmit={handleSubmit}
              className="flex flex-col gap-5 rounded-lg border-2 border-gray-200 p-8 shadow-lg bg-white"
            >
              <label className="flex flex-col gap-2 text-sm text-gray-700 font-medium">
                Email Address
                <input
                  type="email"
                  name="email"
                  autoComplete="email"
                  required
                  value={formState.email}
                  onChange={handleChange}
                  className="rounded-md border-2 border-gray-300 px-4 py-3 focus:border-[hsl(var(--harvard-crimson))] focus:outline-none transition-colors font-sans"
                  placeholder="your.email@harvard.edu"
                />
              </label>
              <label className="flex flex-col gap-2 text-sm text-gray-700 font-medium">
                Password
                <input
                  type="password"
                  name="password"
                  autoComplete="current-password"
                  required
                  value={formState.password}
                  onChange={handleChange}
                  className="rounded-md border-2 border-gray-300 px-4 py-3 focus:border-[hsl(var(--harvard-crimson))] focus:outline-none transition-colors font-sans"
                  placeholder="••••••••"
                />
              </label>
              {errorMessage ? (
                <p className="text-sm text-rose-600 bg-rose-50 p-3 rounded-md border border-rose-200">{errorMessage}</p>
              ) : null}
              <button
                type="submit"
                disabled={isSubmitting}
                className="rounded-md bg-[hsl(var(--harvard-crimson))] px-4 py-3 text-base font-semibold text-white transition hover:bg-[hsl(var(--harvard-crimson))]/90 disabled:cursor-not-allowed disabled:bg-gray-400 shadow-md hover:shadow-lg"
              >
                {isSubmitting ? "Signing in..." : "Sign In"}
              </button>
              <p className="text-sm text-gray-600 text-center">
                Don't have an account?{" "}
                <Link
                  href="/signup"
                  className="font-semibold text-[hsl(var(--harvard-crimson))] hover:underline"
                >
                  Register
                </Link>
              </p>
            </form>
          </div>

          <figure className="overflow-hidden rounded-lg border-2 border-gray-200 shadow-xl">
            <Image
              src={
                loginType === "instructor" 
                  ? "https://picsum.photos/seed/harvard-faculty/640/640" 
                  : loginType === "operator"
                  ? "https://picsum.photos/seed/harvard-admin/640/640"
                  : "https://picsum.photos/seed/harvard-campus/640/640"
              }
              alt="Harvard Campus"
              width={640}
              height={640}
              className="h-full w-full object-cover transition-all duration-500 hover:scale-105"
              priority
            />
          </figure>
        </div>
    </div>
  );
}
