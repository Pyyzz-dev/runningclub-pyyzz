import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Container } from "@/components/common/Container";
import { HeroImageSlideshow } from "@/components/home/HeroImageSlideshow";
import { Button } from "@/components/ui/button";
import { getHeroSlideshowImages } from "@/lib/supabase/hero-images";

export async function HeroSection() {
  const images = await getHeroSlideshowImages();

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-primary-50 via-white to-secondary/10 section-padding">
      <Container>
        <div className="grid items-center gap-10 md:grid-cols-2 md:gap-12">
          <div className="animate-slide-up space-y-6">
            <p className="text-sm font-semibold uppercase tracking-wider text-primary-700">
              CMC Global Running Club
            </p>
            <h1 className="font-display text-4xl font-bold leading-tight text-gray-900 md:text-5xl">
              Cùng nhau chinh phục <br />
              <span className="text-blue-600">từng cây số</span>
            </h1>
            <p className="text-lg text-gray-600">
              Câu lạc bộ Chạy bộ CMC Global – nơi kết nối những người yêu thể thao, chia sẻ kinh
              nghiệm và cùng nhau tiến bộ mỗi ngày.
            </p>
            <div className="flex flex-wrap gap-4">
              <Button asChild size="lg" className="bg-blue-600 hover:bg-blue-700">
                <Link href="/community">
                  Khám phá cộng đồng
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/training">Xem lịch tập</Link>
              </Button>
            </div>
          </div>

          <div className="relative animate-fade-in">
            <HeroImageSlideshow images={images} />
            <div
              className="absolute -bottom-4 -left-4 z-10 rounded-full bg-yellow-400 p-3 text-2xl shadow-lg"
              aria-hidden
            >
              🏃‍♂️
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
