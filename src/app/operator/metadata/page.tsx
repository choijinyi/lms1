'use client';

import { MetadataList } from '@/features/metadata/components/metadata-list';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function MetadataPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">메타데이터 관리</h1>
        <p className="text-muted-foreground">카테고리와 난이도를 관리할 수 있습니다.</p>
      </div>

      <Tabs defaultValue="categories" className="w-full">
        <TabsList>
          <TabsTrigger value="categories">카테고리</TabsTrigger>
          <TabsTrigger value="difficulties">난이도</TabsTrigger>
        </TabsList>

        <TabsContent value="categories" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>카테고리 관리</CardTitle>
              <CardDescription>코스 카테고리를 추가, 수정, 삭제할 수 있습니다.</CardDescription>
            </CardHeader>
            <CardContent>
              <MetadataList type="categories" title="카테고리" />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="difficulties" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>난이도 관리</CardTitle>
              <CardDescription>코스 난이도를 추가, 수정, 삭제할 수 있습니다.</CardDescription>
            </CardHeader>
            <CardContent>
              <MetadataList type="difficulties" title="난이도" />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
