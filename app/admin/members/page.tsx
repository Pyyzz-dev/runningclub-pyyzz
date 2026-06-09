import type { Metadata } from "next";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminMemberManager } from "@/components/admin/AdminMemberManager";
import { fetchAllMembers } from "@/app/actions/dataActions";

export const metadata: Metadata = {
  title: "Quản lý thành viên",
};

export default async function AdminMembersPage() {
  const { data: members, error } = await fetchAllMembers();

  return (
    <AdminLayout title="Quản lý thành viên">
      {error ? (
        <p className="text-destructive">{error}</p>
      ) : (
        <AdminMemberManager members={members ?? []} />
      )}
    </AdminLayout>
  );
}
