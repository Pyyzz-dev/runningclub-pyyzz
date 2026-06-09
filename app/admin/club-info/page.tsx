import type { Metadata } from "next";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ClubInfoEditor } from "@/components/admin/ClubInfoEditor";
import { HistoryManager } from "@/components/admin/HistoryManager";
import { getClubInfo, getHistory } from "@/app/actions/clubInfoActions";

export const metadata: Metadata = {
  title: "Quản lý Giới thiệu & Lịch sử",
};

export default async function AdminClubInfoPage() {
  const [clubInfo, history] = await Promise.all([getClubInfo(), getHistory()]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Giới thiệu & Lịch sử CLB</h1>
        <p className="text-sm text-muted-foreground">
          Quản lý nội dung giới thiệu và các mốc lịch sử của câu lạc bộ.
        </p>
      </div>

      <Tabs defaultValue="intro" className="space-y-6">
        <TabsList>
          <TabsTrigger value="intro">Giới thiệu CLB</TabsTrigger>
          <TabsTrigger value="history">Lịch sử CLB</TabsTrigger>
        </TabsList>

        <TabsContent value="intro">
          <ClubInfoEditor initialData={clubInfo} />
        </TabsContent>

        <TabsContent value="history">
          <HistoryManager items={history} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
