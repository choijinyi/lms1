"use client";

import Image from "next/image";
import Link from "next/link";
import { useCurrentUser } from "@/features/auth/hooks/useCurrentUser";
import { useMyEnrollmentsQuery } from "@/features/enrollments/hooks/useMyEnrollmentsQuery";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { BookOpen, Search, GraduationCap } from "lucide-react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";

type DashboardPageProps = {
  params: Promise<Record<string, never>>;
};

export default function DashboardPage({ params }: DashboardPageProps) {
  void params;
  const { user } = useCurrentUser();
  const { data: myEnrollments, isLoading } = useMyEnrollmentsQuery();

  return (
    <div className="container mx-auto flex max-w-6xl flex-col gap-10 px-6 py-12 bg-gradient-to-b from-white to-gray-50 min-h-screen">
      <header className="space-y-3 pb-6 border-b-2 border-[hsl(var(--harvard-crimson))]">
        <h1 className="text-5xl font-bold tracking-tight text-[hsl(var(--harvard-crimson))] font-serif">
          Student Dashboard
        </h1>
        <p className="text-gray-600 text-lg">
          Welcome back, <span className="font-semibold">{user?.email ?? "Student"}</span>
        </p>
      </header>

      {/* Quick Actions */}
      <section className="grid gap-6 md:grid-cols-3">
        <Card className="bg-[hsl(var(--harvard-crimson))]/5 border-2 border-[hsl(var(--harvard-crimson))]/20 shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-xl flex items-center gap-2 font-serif">
              <Search className="h-6 w-6 text-[hsl(var(--harvard-crimson))]" />
              Browse Courses
            </CardTitle>
            <CardDescription className="text-gray-600">Discover new areas of study</CardDescription>
          </CardHeader>
          <CardFooter>
            <Link href="/courses" className="w-full">
              <Button className="w-full bg-[hsl(var(--harvard-crimson))] hover:bg-[hsl(var(--harvard-crimson))]/90 font-semibold">
                View All Courses
              </Button>
            </Link>
          </CardFooter>
        </Card>

        <Card className="border-2 border-gray-200 shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-xl flex items-center gap-2 font-serif">
              <BookOpen className="h-6 w-6 text-[hsl(var(--harvard-crimson))]" />
              My Courses
            </CardTitle>
            <CardDescription className="text-gray-600">Continue your learning journey</CardDescription>
          </CardHeader>
          <CardFooter>
            <Link href="/my-courses" className="w-full">
              <Button variant="outline" className="w-full border-2 border-[hsl(var(--harvard-crimson))] text-[hsl(var(--harvard-crimson))] hover:bg-[hsl(var(--harvard-crimson))]/5 font-semibold">
                View Progress
              </Button>
            </Link>
          </CardFooter>
        </Card>

        <Card className="border-2 border-gray-200 shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-xl flex items-center gap-2 font-serif">
              <GraduationCap className="h-6 w-6 text-[hsl(var(--harvard-crimson))]" />
              Certificates
            </CardTitle>
            <CardDescription className="text-gray-600">View your achievements</CardDescription>
          </CardHeader>
          <CardFooter>
            <Button variant="ghost" className="w-full font-semibold" disabled>Coming Soon</Button>
          </CardFooter>
        </Card>
      </section>

      {/* Recent Enrollments */}
      <section className="space-y-6">
        <div className="flex items-center justify-between border-b-2 border-gray-200 pb-3">
          <h2 className="text-3xl font-bold font-serif text-[hsl(var(--harvard-black))]">
            Recent Enrollments
          </h2>
          <Link href="/my-courses" className="text-sm text-[hsl(var(--harvard-crimson))] hover:underline font-semibold">
            View All →
          </Link>
        </div>

        <div className="grid gap-5">
          {isLoading ? (
            <div className="text-center py-12 text-gray-500 bg-white rounded-lg border-2 border-gray-200 shadow-sm">
              Loading your courses...
            </div>
          ) : myEnrollments?.enrollments.length === 0 ? (
            <div className="text-center py-16 border-2 border-dashed border-gray-300 rounded-lg bg-white text-gray-600">
              <BookOpen className="h-16 w-16 mx-auto mb-4 text-gray-400" />
              <p className="mb-4 text-lg font-serif">No courses enrolled yet</p>
              <Link href="/courses">
                <Button variant="outline" className="border-2 border-[hsl(var(--harvard-crimson))] text-[hsl(var(--harvard-crimson))] hover:bg-[hsl(var(--harvard-crimson))]/5 font-semibold">
                  Explore Courses
                </Button>
              </Link>
            </div>
          ) : (
            myEnrollments?.enrollments.slice(0, 3).map((enrollment) => (
              <Card key={enrollment.id} className="flex flex-row items-center justify-between p-6 border-2 border-gray-200 shadow-md hover:shadow-lg transition-shadow">
                <div className="flex flex-col gap-2">
                  <span className="font-semibold text-lg font-serif">Course ID: {enrollment.courseId}</span>
                  <span className="text-sm text-gray-600">
                    Enrolled: {format(new Date(enrollment.enrolledAt), "PPP", { locale: ko })}
                  </span>
                </div>
                <Link href={`/courses/${enrollment.courseId}`}>
                  <Button variant="default" size="sm" className="bg-[hsl(var(--harvard-crimson))] hover:bg-[hsl(var(--harvard-crimson))]/90 font-semibold">
                    Continue Learning
                  </Button>
                </Link>
              </Card>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
