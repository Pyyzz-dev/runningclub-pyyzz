import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  Clock,
  ExternalLink,
  MapPin,
  UserCheck,
  Users,
} from "lucide-react";
import { fetchCurrentUser, fetchEventById } from "@/app/actions/dataActions";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { Breadcrumb } from "@/components/common/Breadcrumb";
import { Container } from "@/components/common/Container";
import { AdminParticipantUpdate } from "@/components/events/AdminParticipantUpdate";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatPublishedAt } from "@/lib/format";

export const revalidate = 3600;

type EventDetailPageProps = {
  params: Promise<{ eventId: string }>;
};

export async function generateMetadata({ params }: EventDetailPageProps): Promise<Metadata> {
  const { eventId } = await params;
  const { data: event } = await fetchEventById(eventId);
  return { title: event?.name ?? "Chi tiết sự kiện" };
}

export default async function EventDetailPage({ params }: EventDetailPageProps) {
  const { eventId } = await params;
  const [{ data: event, error }, { data: user }] = await Promise.all([
    fetchEventById(eventId),
    fetchCurrentUser(),
  ]);

  if (error || !event) {
    notFound();
  }

  const isAdmin = user?.role === "admin";
  const participantCount = event.participant_count ?? 0;
  const isUpcoming = new Date(event.event_date) >= new Date();
  const isRegistrationDeadlinePassed = event.registration_deadline
    ? new Date(event.registration_deadline) < new Date()
    : false;
  const registrationOpen = !isRegistrationDeadlinePassed;

  return (
    <Container className="section-padding">
      <Breadcrumb
        items={[
          { label: "Trang chủ", href: "/" },
          { label: "Sự kiện", href: "/events" },
          { label: event.name },
        ]}
        className="mb-8"
      />

      <Link
        href="/events"
        className="mb-6 inline-flex items-center gap-2 text-muted-foreground transition-colors hover:text-primary"
      >
        <ArrowLeft className="h-4 w-4" />
        Quay lại danh sách sự kiện
      </Link>

      <AuthGuard message="Hãy đăng ký tài khoản và trở thành thành viên CLB để theo dõi lịch sự kiện của CLB">
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <div>
              {event.image_url && (
                <div className="relative mb-4 h-64 w-full overflow-hidden rounded-xl md:h-96">
                  <Image
                    src={event.image_url}
                    alt={event.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 66vw"
                    priority
                  />
                </div>
              )}
              <h1 className="mb-2 font-display text-3xl font-bold text-foreground md:text-4xl">
                {event.name}
              </h1>
              <div className="flex flex-wrap gap-2">
                {isRegistrationDeadlinePassed && (
                  <Badge variant="destructive">Đã đóng đăng ký</Badge>
                )}
                {isUpcoming && registrationOpen && (
                  <Badge className="bg-green-600 hover:bg-green-600">Đang mở đăng ký</Badge>
                )}
                {!isUpcoming && <Badge variant="secondary">Đã kết thúc</Badge>}
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Thông tin sự kiện</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3 text-muted-foreground">
                  <Calendar className="h-5 w-5 shrink-0" />
                  <span>{formatPublishedAt(event.event_date)}</span>
                </div>
                {event.location && (
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <MapPin className="h-5 w-5 shrink-0" />
                    <span>{event.location}</span>
                  </div>
                )}
                {event.registration_deadline && (
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <Clock className="h-5 w-5 shrink-0" />
                    <span>Hạn đăng ký: {formatPublishedAt(event.registration_deadline)}</span>
                  </div>
                )}
                <div className="flex items-center gap-3 text-muted-foreground">
                  <Users className="h-5 w-5 shrink-0" />
                  <span>
                    Số lượng đã đăng ký: <strong>{participantCount}</strong> thành viên
                  </span>
                </div>
              </CardContent>
            </Card>

            {event.description && (
              <Card>
                <CardHeader>
                  <CardTitle>Mô tả sự kiện</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-wrap text-muted-foreground">{event.description}</p>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="space-y-6">
            {event.event_link && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ExternalLink className="h-5 w-5" />
                    Đăng ký tham gia
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {registrationOpen && isUpcoming ? (
                    <>
                      <p className="text-sm text-muted-foreground">
                        Nhấn nút bên dưới để đăng ký tham gia sự kiện.
                      </p>
                      <Button asChild className="w-full bg-blue-600 hover:bg-blue-700">
                        <a
                          href={event.event_link}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Đăng ký ngay
                        </a>
                      </Button>
                    </>
                  ) : (
                    <div className="rounded-lg bg-muted p-3 text-center text-sm text-muted-foreground">
                      {isRegistrationDeadlinePassed
                        ? "Đã hết hạn đăng ký"
                        : "Sự kiện đã kết thúc"}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserCheck className="h-5 w-5" />
                  Thành viên tham gia
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-primary">{participantCount}</p>
                <p className="mt-1 text-sm text-muted-foreground">thành viên đã đăng ký</p>
                {isAdmin && (
                  <AdminParticipantUpdate
                    eventId={event.id}
                    currentCount={participantCount}
                  />
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </AuthGuard>
    </Container>
  );
}
