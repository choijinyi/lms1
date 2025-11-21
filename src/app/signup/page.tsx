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
    <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col items-center justify-center gap-12 px-6 py-16 bg-gradient-to-b from-white to-gray-50">
      <header className="flex flex-col items-center gap-4 text-center">
        <div className="w-20 h-20 bg-[hsl(var(--harvard-crimson))] rounded-full flex items-center justify-center mb-2">
          <span className="text-4xl font-bold text-white font-serif">H</span>
        </div>
        <h1 className="text-5xl font-bold text-[hsl(var(--harvard-crimson))] font-serif tracking-tight">
          Join Harvard Portal
        </h1>
        <p className="text-gray-600 text-lg max-w-md">
          Create your account to access the academic portal
        </p>
      </header>
      <div className="grid w-full gap-10 md:grid-cols-2 max-w-4xl">
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
              autoComplete="new-password"
              required
              value={formState.password}
              onChange={handleChange}
              className="rounded-md border-2 border-gray-300 px-4 py-3 focus:border-[hsl(var(--harvard-crimson))] focus:outline-none transition-colors font-sans"
              placeholder="••••••••"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm text-gray-700 font-medium">
            Confirm Password
            <input
              type="password"
              name="confirmPassword"
              autoComplete="new-password"
              required
              value={formState.confirmPassword}
              onChange={handleChange}
              className="rounded-md border-2 border-gray-300 px-4 py-3 focus:border-[hsl(var(--harvard-crimson))] focus:outline-none transition-colors font-sans"
              placeholder="••••••••"
            />
          </label>
          {errorMessage ? (
            <p className="text-sm text-rose-600 bg-rose-50 p-3 rounded-md border border-rose-200">{errorMessage}</p>
          ) : null}
          {infoMessage ? (
            <p className="text-sm text-emerald-600 bg-emerald-50 p-3 rounded-md border border-emerald-200">{infoMessage}</p>
          ) : null}
          <button
            type="submit"
            disabled={isSubmitting || isSubmitDisabled}
            className="rounded-md bg-[hsl(var(--harvard-crimson))] px-4 py-3 text-base font-semibold text-white transition hover:bg-[hsl(var(--harvard-crimson))]/90 disabled:cursor-not-allowed disabled:bg-gray-400 shadow-md hover:shadow-lg"
          >
            {isSubmitting ? "Creating Account..." : "Create Account"}
          </button>
          <p className="text-sm text-gray-600 text-center">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-semibold text-[hsl(var(--harvard-crimson))] hover:underline"
            >
              Sign In
            </Link>
          </p>
        </form>
        <figure className="overflow-hidden rounded-lg border-2 border-gray-200 shadow-xl">
          <Image
            src="https://picsum.photos/seed/harvard-library/640/640"
            alt="Harvard Campus"
            width={640}
            height={640}
            className="h-full w-full object-cover hover:scale-105 transition-all duration-500"
            priority
          />
        </figure>
      </div>
    </div>
  );
}
