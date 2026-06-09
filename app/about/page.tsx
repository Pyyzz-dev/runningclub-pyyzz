import type { Metadata } from "next";
import Image from "next/image";
import { Section } from "@/components/common/Section";
import { Breadcrumb } from "@/components/common/Breadcrumb";
import { getClubInfo } from "@/app/actions/clubInfoActions";
import { cleanHtmlContent } from "@/lib/utils/cleanHtml";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Giới thiệu",
};

export default async function AboutPage() {
  const clubInfo = await getClubInfo();

  return (
    <Section
      title={clubInfo?.title ?? "Giới thiệu CLB"}
      subtitle="Câu lạc bộ Chạy bộ CMC Global"
      containerClassName="max-w-4xl"
    >
      <Breadcrumb
        items={[{ label: "Trang chủ", href: "/" }, { label: "Giới thiệu" }]}
        className="mb-8"
      />

      {clubInfo?.cover_image_url && (
        <div className="relative mb-8 aspect-[21/9] overflow-hidden rounded-xl">
          <Image
            src={clubInfo.cover_image_url}
            alt={clubInfo.title}
            fill
            sizes="(max-width: 896px) 100vw, 896px"
            className="object-cover"
            priority
          />
        </div>
      )}

      {clubInfo?.content ? (
        <div
          className="prose prose-slate max-w-none dark:prose-invert"
          dangerouslySetInnerHTML={{ __html: cleanHtmlContent(clubInfo.content) }}
        />
      ) : (
        <div className="prose prose-slate max-w-none space-y-6 text-muted-foreground dark:prose-invert">
          <p>
            <strong className="text-foreground">Câu lạc bộ Chạy bộ CMC Global</strong>{" "}
            được thành lập với sứ mệnh xây dựng cộng đồng chạy bộ lành mạnh,
            chuyên nghiệp và gắn kết tại Việt Nam.
          </p>
          <p>
            Quản trị viên có thể cập nhật nội dung trang này tại Admin → Giới
            thiệu & Lịch sử.
          </p>
        </div>
      )}
    </Section>
  );
}
