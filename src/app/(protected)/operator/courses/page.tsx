"use client";

import { useCoursesQuery } from "@/features/courses/hooks/useCoursesQuery";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { PlusCircle } from "lucide-react";

export default function OperatorCoursesPage() {
  const { data, isLoading } = useCoursesQuery({ limit: 100 }); // 전체 목록

  if (isLoading) return <div className="p-8 text-center">로딩 중...</div>;

  return (
    <div className="container mx-auto py-12 space-y-8 min-h-screen bg-gradient-to-b from-white to-gray-50">
      <header className="flex items-center justify-between pb-6 border-b-2 border-[hsl(var(--harvard-crimson))]">
        <div>
          <h1 className="text-4xl font-bold font-serif text-[hsl(var(--harvard-crimson))]">
            Course Management
          </h1>
          <p className="text-gray-600 mt-2">Administrative Portal - All Courses</p>
        </div>
        <Link href="/operator/courses/new">
          <Button className="bg-[hsl(var(--harvard-crimson))] hover:bg-[hsl(var(--harvard-crimson))]/90 font-semibold px-6 py-6 text-base shadow-lg">
            <PlusCircle className="mr-2 h-5 w-5" />
            Create New Course
          </Button>
        </Link>
      </header>

      <div className="grid gap-5">
        {data?.courses.map((course) => (
          <Card key={course.id} className="flex flex-row items-center justify-between p-6 border-2 border-gray-200 shadow-md hover:shadow-lg transition-shadow">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <CardTitle className="text-xl font-serif text-[hsl(var(--harvard-black))]">
                  {course.title}
                </CardTitle>
                <Badge 
                  variant={course.status === 'published' ? 'default' : 'secondary'}
                  className={course.status === 'published' 
                    ? 'bg-[hsl(var(--harvard-crimson))] hover:bg-[hsl(var(--harvard-crimson))]/90' 
                    : 'bg-gray-400'
                  }
                >
                  {course.status.toUpperCase()}
                </Badge>
              </div>
              <CardDescription className="text-gray-600 font-medium">
                {course.category} • Level: {course.difficulty}
              </CardDescription>
            </div>
            <div className="flex items-center gap-3">
              <Button 
                variant="outline" 
                size="sm" 
                className="border-2 border-gray-300 font-semibold hover:border-[hsl(var(--harvard-crimson))] hover:text-[hsl(var(--harvard-crimson))]"
              >
                Edit
              </Button>
              <Button 
                variant="destructive" 
                size="sm"
                className="font-semibold"
              >
                Delete
              </Button>
            </div>
          </Card>
        ))}
        {data?.courses.length === 0 && (
          <div className="text-center py-20 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 bg-white">
            <PlusCircle className="h-16 w-16 mx-auto mb-4 text-gray-400" />
            <p className="text-lg font-serif mb-2">No courses registered yet</p>
            <p className="text-sm text-gray-500 mb-4">Create your first course to get started</p>
            <Link href="/operator/courses/new">
              <Button 
                variant="outline" 
                className="border-2 border-[hsl(var(--harvard-crimson))] text-[hsl(var(--harvard-crimson))] hover:bg-[hsl(var(--harvard-crimson))]/5 font-semibold"
              >
                Create Course
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

