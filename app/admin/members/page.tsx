import type { Metadata } from "next";
import { MembersTable } from "@/components/admin/MembersTable";
import { fetchApprovedMembers } from "@/app/actions/dataActions";

export const metadata: Metadata = {
  title: "Danh sách thành viên",
};

export default async function AdminMembersPage() {
  const { data: members, error } = await fetchApprovedMembers();

  if (error) {
    console.error("Error fetching members:", error);
    return <div className="text-destructive">Lỗi tải dữ liệu: {error}</div>;
  }

  return (
    <div className="w-full space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Danh sách thành viên</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Tổng số thành viên: <strong>{members?.length ?? 0}</strong>
        </p>
      </div>

      <MembersTable members={members ?? []} />
    </div>
  );
}
