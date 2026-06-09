import type { Metadata } from "next";
import { Section } from "@/components/common/Section";
import { Breadcrumb } from "@/components/common/Breadcrumb";
import { CommunitySection } from "@/components/modules/CommunitySection";
import { fetchAllPosts } from "@/app/actions/dataActions";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Cộng đồng",
};

export default async function CommunityPage() {
  const { data: posts, error } = await fetchAllPosts();

  return (
    <Section title="Cộng đồng" subtitle="Chia sẻ, kết nối và truyền cảm hứng cùng nhau">
      <Breadcrumb
        items={[{ label: "Trang chủ", href: "/" }, { label: "Cộng đồng" }]}
        className="mb-8"
      />
      {error ? (
        <p className="text-center text-destructive">{error}</p>
      ) : (
        <CommunitySection posts={posts ?? []} />
      )}
    </Section>
  );
}
