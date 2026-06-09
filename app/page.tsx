import Link from "next/link";
import { Calendar, Trophy, Users } from "lucide-react";
import { Section } from "@/components/common/Section";
import { PostCard } from "@/components/cards/PostCard";
import { EventCard } from "@/components/cards/EventCard";
import { TrainingCard } from "@/components/cards/TrainingCard";
import { Button } from "@/components/ui/button";
import { HeroSection } from "@/components/home/HeroSection";
import { fetchHomepageData } from "@/app/actions/dataActions";

export const revalidate = 3600;

export default async function HomePage() {
  const { posts, events, trainings } = await fetchHomepageData();

  return (
    <>
      <HeroSection />

      <Section
        title="Tại sao tham gia CLB?"
        subtitle="Ba lý do để bạn bắt đầu hành trình chạy bộ cùng chúng tôi"
      >
        <div className="grid gap-6 md:grid-cols-3">
          {[
            {
              icon: Users,
              title: "Cộng đồng gắn kết",
              desc: "Kết nối với hàng trăm runner đam mê, chia sẻ hành trình và động lực.",
            },
            {
              icon: Calendar,
              title: "Lịch tập cố định",
              desc: "Buổi tập hàng tuần với lộ trình phù hợp mọi trình độ.",
            },
            {
              icon: Trophy,
              title: "Thi đua & ghi nhận",
              desc: "Bảng xếp hạng tuần/tháng và các giải thưởng thành tích.",
            },
          ].map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="rounded-xl border bg-card p-6 shadow-sm transition-shadow hover:shadow-md animate-fade-in"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Icon className="h-6 w-6" />
              </div>
              <h3 className="font-display text-lg font-semibold">{title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{desc}</p>
            </div>
          ))}
        </div>
      </Section>

      {posts.length > 0 && (
        <Section title="Bài viết nổi bật" subtitle="Cập nhật mới nhất từ cộng đồng">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((post, index) => (
              <PostCard key={post.id} post={post} priority={index === 0} />
            ))}
          </div>
          <div className="mt-8 text-center">
            <Button asChild variant="outline">
              <Link href="/community">Xem tất cả bài viết</Link>
            </Button>
          </div>
        </Section>
      )}

      {events.length > 0 && (
        <Section
          title="Sự kiện sắp tới"
          subtitle="Đừng bỏ lỡ các giải chạy và hoạt động thú vị"
          bg="muted"
        >
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {events.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
          <div className="mt-8 text-center">
            <Button asChild variant="outline">
              <Link href="/events">Xem tất cả sự kiện</Link>
            </Button>
          </div>
        </Section>
      )}

      {trainings.length > 0 && (
        <Section title="Lịch tập sắp tới" subtitle="Tham gia buổi tập cùng CLB">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {trainings.map((training) => (
              <TrainingCard key={training.id} training={training} />
            ))}
          </div>
          <div className="mt-8 text-center">
            <Button asChild variant="outline">
              <Link href="/training">Xem lịch tập đầy đủ</Link>
            </Button>
          </div>
        </Section>
      )}
    </>
  );
}
