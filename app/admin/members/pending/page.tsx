import type { Metadata } from "next";
import { PendingMembersTable } from "@/components/admin/PendingMembersTable";
import { getPendingMembers } from "@/app/actions/adminApproveMember";

export const metadata: Metadata = {
  title: "Duyệt thành viên",
};

export default async function PendingMembersPage() {
  const pendingMembers = await getPendingMembers();

  return (
    <div className="w-full space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Duyệt thành viên mới</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Xét duyệt các đơn đăng ký tham gia CLB
        </p>
      </div>

      <PendingMembersTable initialData={pendingMembers} />
    </div>
  );
}
