import type { Metadata } from "next";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminLeaderboardManager } from "@/components/admin/AdminLeaderboardManager";
import { fetchAllMembers } from "@/app/actions/dataActions";

export const metadata: Metadata = {
  title: "Quản lý bảng xếp hạng",
};

export default async function AdminLeaderboardPage() {
  const { data: members, error } = await fetchAllMembers();

  return (
    <AdminLayout title="Quản lý bảng xếp hạng">
      {error ? (
        <p className="text-destructive">{error}</p>
      ) : (
        <AdminLeaderboardManager members={members ?? []} />
      )}
    </AdminLayout>
  );
}
