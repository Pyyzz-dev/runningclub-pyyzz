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
import {
  getParticipationStatus,
} from "@/app/actions/eventParticipantActions";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { Breadcrumb } from "@/components/common/Breadcrumb";
import { Container } from "@/components/common/Container";
import { HydrationSafeDateTime } from "@/components/common/HydrationSafeDateTime";
import { AdminParticipantUpdate } from "@/components/events/AdminParticipantUpdate";
import { EventDetailParticipationSection } from "@/components/events/EventDetailParticipationSection";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";

export const revalidate = 3600;

type EventDetailPageProps = {
  params: Promise<{ eventId: string }>;
};

type ParticipantRow = {
  registered_at: string;
  users: {
    id: string;
    full_name: string;
    avatar_url: string | null;
  };
};

export async function generateMetadata({ params }: EventDetailPageProps): Promise<Metadata> {
  const { eventId } = await params;
  const { data: event } = await fetchEventById(eventId);
  return { title: event?.name ?? "Chi tiết sự kiện" };
}

export default async function EventDetailPage({ params }: EventDetailPageProps) {
  const { eventId } = await params;
  const supabase = await createClient();

  const [{ data: event, error }, { data: user }] = await Promise.all([
    fetchEventById(eventId),
    fetchCurrentUser(),
  ]);

  if (error || !event) {
    notFound();
  }

  const { data: participantRows, error: participantsError } = await supabase
    .from("event_participants")
    .select(
      `
      registered_at,
      users!inner (
        id,
        full_name,
        avatar_url
      )
    `
    )
    .eq("event_id", eventId)
    .order("registered_at", { ascending: true });

  if (participantsError) {
    console.error("Failed to fetch event participants:", participantsError.message);
  }

  const participants = (participantRows ?? []) as ParticipantRow[];
  const isAdmin = user?.role === "admin";
  const participantCount = event.participant_count ?? 0;
  const isUpcoming = new Date(event.event_date) >= new Date();
  const isRegistrationDeadlinePassed = event.registration_deadline
    ? new Date(event.registration_deadline) < new Date()
    : false;
  const registrationOpen = !isRegistrationDeadlinePassed;
  const canJoin = isUpcoming && registrationOpen;
  const closedMessage = !isUpcoming
    ? "Sự kiện đã kết thúc"
    : "Đã hết hạn đăng ký";

  const { joined: isJoined } = user
    ? await getParticipationStatus(eventId, user.id)
    : { joined: false };

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
                  <span>{formatDate(event.event_date)}</span>
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
                    <span>Hạn đăng ký: {formatDate(event.registration_deadline)}</span>
                  </div>
                )}
                <EventDetailParticipationSection
                  eventId={event.id}
                  userId={user?.id ?? null}
                  initialJoined={isJoined}
                  canJoin={canJoin}
                  closedMessage={closedMessage}
                  initialParticipantCount={participantCount}
                />
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
                    Đăng ký bên ngoài
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {registrationOpen && isUpcoming ? (
                    <>
                      <p className="text-sm text-muted-foreground">
                        Nhấn nút bên dưới để đăng ký qua liên kết bên ngoài.
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
                  Danh sách tham gia ({participantCount})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {participants.length > 0 ? (
                  <div className="space-y-3">
                    {participants.map((participant) => (
                      <div
                        key={participant.users.id}
                        className="flex items-center gap-3 rounded-lg p-2 hover:bg-muted/50"
                      >
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={participant.users.avatar_url ?? undefined} />
                          <AvatarFallback className="bg-primary/10 text-primary">
                            {participant.users.full_name?.charAt(0) || "?"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="font-medium">{participant.users.full_name}</p>
                          <p className="text-xs text-muted-foreground">
                            Tham gia lúc:{" "}
                            <HydrationSafeDateTime date={participant.registered_at} />
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-8 text-center text-muted-foreground">
                    <Users className="mx-auto mb-2 h-12 w-12 opacity-50" />
                    <p>Chưa có ai tham gia</p>
                  </div>
                )}
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
