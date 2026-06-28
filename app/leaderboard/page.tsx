import type { Metadata } from "next";
import { getLeaderboardFromSheetWithError } from "@/app/actions/leaderboardActions";
import { fetchCurrentUser } from "@/app/actions/dataActions";
import { Section } from "@/components/common/Section";
import { Breadcrumb } from "@/components/common/Breadcrumb";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { LeaderboardNote } from "@/components/modules/LeaderboardNote";
import { LeaderboardTableWithRefresh } from "@/components/modules/LeaderboardTableWithRefresh";

export const metadata: Metadata = {
  title: "Bảng xếp hạng",
};

export const revalidate = 600;

export default async function LeaderboardPage() {
  const [{ data: leaderboardData, error }, { data: user }] = await Promise.all([
    getLeaderboardFromSheetWithError(),
    fetchCurrentUser(),
  ]);

  return (
    <Section
      title="Bảng xếp hạng"
      subtitle="Thành tích chạy bộ của các thành viên CLB"
    >
      <Breadcrumb
        items={[{ label: "Trang chủ", href: "/" }, { label: "Bảng xếp hạng" }]}
        className="mb-8"
      />

      <AuthGuard message="Hãy đăng ký tài khoản và trở thành thành viên CLB để xem bảng xếp hạng thành viên">
        <div className="flex flex-col gap-4 lg:flex-row lg:gap-6">
          <div className="w-full lg:w-4/5">
            {error ? (
              <p className="py-8 text-center text-destructive">{error}</p>
            ) : (
              <LeaderboardTableWithRefresh
                initialData={leaderboardData ?? []}
                currentMemberName={user?.full_name}
              />
            )}
          </div>

          <div className="w-full lg:w-1/5">
            <LeaderboardNote />
          </div>
        </div>
      </AuthGuard>
    </Section>
  );
}
