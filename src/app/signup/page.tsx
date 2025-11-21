"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser-client";
import { useCurrentUser } from "@/features/auth/hooks/useCurrentUser";

const defaultFormState = {
  email: "",
  password: "",
  confirmPassword: "",
};

type SignupPageProps = {
  params: Promise<Record<string, never>>;
};

export default function SignupPage({ params }: SignupPageProps) {
  void params;
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, refresh } = useCurrentUser();
  const [formState, setFormState] = useState(defaultFormState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      const redirectedFrom = searchParams.get("redirectedFrom") ?? "/";
      router.replace(redirectedFrom);
    }
  }, [isAuthenticated, router, searchParams]);

  const isSubmitDisabled = useMemo(
    () =>
      !formState.email.trim() ||
      !formState.password.trim() ||
      formState.password !== formState.confirmPassword,
    [formState.confirmPassword, formState.email, formState.password]
  );

  const handleChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value } = event.target;
      setFormState((previous) => ({ ...previous, [name]: value }));
    },
    []
  );

  const handleSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setIsSubmitting(true);
      setErrorMessage(null);
      setInfoMessage(null);

      if (formState.password !== formState.confirmPassword) {
        setErrorMessage("비밀번호가 일치하지 않습니다.");
        setIsSubmitting(false);
        return;
      }

      const supabase = getSupabaseBrowserClient();

      try {
        const result = await supabase.auth.signUp({
          email: formState.email,
          password: formState.password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        });

        if (result.error) {
          setErrorMessage(result.error.message ?? "회원가입에 실패했습니다.");
          setIsSubmitting(false);
          return;
        }

        await refresh();

        const redirectedFrom = searchParams.get("redirectedFrom") ?? "/";

        if (result.data.session) {
          router.replace(redirectedFrom);
          return;
        }

        // If Supabase confirm email is disabled, we might not get a session immediately
        // but we can try to sign in immediately.
        const signInResult = await supabase.auth.signInWithPassword({
          email: formState.email,
          password: formState.password,
        });

        if (signInResult.data.session) {
          await refresh();
          router.replace(redirectedFrom);
          return;
        }

        setInfoMessage(
          "확인 이메일을 보냈습니다. 이메일 인증 후 로그인해 주세요."
        );
        router.prefetch("/login");
        setFormState(defaultFormState);
      } catch (error) {
        setErrorMessage("회원가입 처리 중 문제가 발생했습니다.");
      } finally {
        setIsSubmitting(false);
      }
    },
    [formState.confirmPassword, formState.email, formState.password, refresh, router, searchParams]
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
          새로운 학습 여정을 시작하세요
        </p>
      </header>
      <div className="grid w-full gap-10 md:grid-cols-2 max-w-4xl">
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
              autoComplete="new-password"
              required
              value={formState.password}
              onChange={handleChange}
              className="rounded-xl border-2 border-gray-300 px-4 py-3 focus:border-[hsl(var(--oikos-blue))] focus:ring-2 focus:ring-[hsl(var(--oikos-blue))]/20 focus:outline-none transition-all"
              placeholder="••••••••"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm text-gray-700 font-medium">
            비밀번호 확인
            <input
              type="password"
              name="confirmPassword"
              autoComplete="new-password"
              required
              value={formState.confirmPassword}
              onChange={handleChange}
              className="rounded-xl border-2 border-gray-300 px-4 py-3 focus:border-[hsl(var(--oikos-blue))] focus:ring-2 focus:ring-[hsl(var(--oikos-blue))]/20 focus:outline-none transition-all"
              placeholder="••••••••"
            />
          </label>
          {errorMessage ? (
            <p className="text-sm text-rose-600 bg-rose-50 p-3 rounded-xl border border-rose-200">{errorMessage}</p>
          ) : null}
          {infoMessage ? (
            <p className="text-sm text-emerald-600 bg-emerald-50 p-3 rounded-xl border border-emerald-200">{infoMessage}</p>
          ) : null}
          <button
            type="submit"
            disabled={isSubmitting || isSubmitDisabled}
            className="rounded-xl bg-gradient-to-r from-[hsl(var(--oikos-blue))] to-[hsl(var(--oikos-green))] px-4 py-3 text-base font-bold text-white transition hover:shadow-xl hover:scale-105 disabled:cursor-not-allowed disabled:opacity-50 shadow-lg transform"
          >
            {isSubmitting ? "계정 생성 중..." : "회원가입"}
          </button>
          <p className="text-sm text-gray-600 text-center">
            이미 계정이 있으신가요?{" "}
            <Link
              href="/login"
              className="font-bold text-[hsl(var(--oikos-blue))] hover:underline"
            >
              로그인
            </Link>
          </p>
        </form>
        <figure className="overflow-hidden rounded-2xl border-2 border-blue-200 shadow-2xl relative group">
          <div className="absolute inset-0 bg-gradient-to-br from-[hsl(var(--oikos-blue))]/10 to-[hsl(var(--oikos-green))]/10 z-10 group-hover:opacity-0 transition-opacity"></div>
          <Image
            src="https://picsum.photos/seed/oikos-library/640/640"
            alt="OIKOS University"
            width={640}
            height={640}
            className="h-full w-full object-cover group-hover:scale-110 transition-all duration-500"
            priority
          />
        </figure>
      </div>
    </div>
  );
}
