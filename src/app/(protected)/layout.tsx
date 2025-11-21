"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useCurrentUser } from "@/features/auth/hooks/useCurrentUser";
import { LOGIN_PATH } from "@/constants/auth";

const buildRedirectUrl = (pathname: string) => {
  const redirectUrl = new URL(LOGIN_PATH, window.location.origin);
  redirectUrl.searchParams.set("redirectedFrom", pathname);
  return redirectUrl.toString();
};

type ProtectedLayoutProps = {
  children: ReactNode;
};

export default function ProtectedLayout({ children }: ProtectedLayoutProps) {
  const { isAuthenticated, isLoading, role } = useCurrentUser();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading) {
      // 1. 인증되지 않은 경우 로그인 페이지로
      if (!isAuthenticated) {
        router.replace(buildRedirectUrl(pathname));
        return;
      }

      // 2. 강사 전용 페이지 접근 제어
      if (pathname.startsWith("/instructor") && role !== "instructor") {
        router.replace("/dashboard");
        return;
      }

      // 3. 관리자(Operator) 전용 페이지 접근 제어
      if (pathname.startsWith("/operator") && role !== "operator") {
        router.replace("/dashboard");
        return;
      }
    }
  }, [isAuthenticated, isLoading, pathname, router, role]);

  if (!isAuthenticated || isLoading) {
    return null;
  }

  // 권한 체크 중 깜빡임 방지
  if (pathname.startsWith("/instructor") && role !== "instructor") return null;
  if (pathname.startsWith("/operator") && role !== "operator") return null;

  return <>{children}</>;
}
