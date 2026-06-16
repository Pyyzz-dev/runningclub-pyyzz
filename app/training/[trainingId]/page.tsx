import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Calendar, MapPin, Clock, Users, ArrowLeft } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { isNotDeleted } from "@/lib/utils/softDelete";
import { getCurrentUser } from "@/lib/utils/db-helpers";
import { getRegistrationStatus } from "@/app/actions/trainingParticipantActions";
import { getTrainingStatus } from "@/lib/utils/trainingStatus";
import { TrainingDetailRegistrationSection } from "@/components/training/TrainingDetailRegistrationSection";

export const revalidate = 60;

type TrainingDetailPageProps = {
  params: Promise<{ trainingId: string }>;
};

type ParticipantRow = {
  registered_at: string;
  users: {
    id: string;
    full_name: string;
    avatar_url: string | null;
  };
};

export default async function TrainingDetailPage({ params }: TrainingDetailPageProps) {
  const { trainingId } = await params;
  const supabase = await createClient();

  const { data: training, error } = await isNotDeleted(
    supabase.from("training_schedule").select("*, participant_count")
  )
    .eq("id", trainingId)
    .single();

  if (error || !training) {
    notFound();
  }

  const { data: participantRows, error: participantsError } = await supabase
    .from("training_participants")
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
    .eq("training_id", trainingId)
    .order("registered_at", { ascending: true });

  if (participantsError) {
    console.error("Failed to fetch training participants:", participantsError.message);
  }

  const participants = (participantRows ?? []) as ParticipantRow[];
  const { data: user } = await getCurrentUser();
  const { registered: isRegistered } = user
    ? await getRegistrationStatus(trainingId, user.id)
    : { registered: false };
  const status = getTrainingStatus(training.start_time, training.end_time);
  const isCompleted = status === "completed";

  return (
    <div className="container-custom section-padding">
      <Link
        href="/training"
        className="mb-6 inline-flex items-center gap-2 text-gray-600 hover:text-blue-600"
      >
        <ArrowLeft className="h-4 w-4" />
        Quay lại lịch tập
      </Link>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">{training.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3 text-gray-600">
                <Calendar className="h-5 w-5" />
                <span>
                  {new Date(training.start_time).toLocaleDateString("vi-VN", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </span>
              </div>
              <div className="flex items-center gap-3 text-gray-600">
                <Clock className="h-5 w-5" />
                <span>
                  {new Date(training.start_time).toLocaleTimeString("vi-VN", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                  {training.end_time &&
                    ` - ${new Date(training.end_time).toLocaleTimeString("vi-VN", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}`}
                </span>
              </div>
              {training.location && (
                <div className="flex items-center gap-3 text-gray-600">
                  <MapPin className="h-5 w-5" />
                  <span>{training.location}</span>
                </div>
              )}
              <TrainingDetailRegistrationSection
                trainingId={trainingId}
                userId={user?.id ?? null}
                initialRegistered={isRegistered}
                isCompleted={isCompleted}
                initialParticipantCount={training.participant_count ?? 0}
              />
              {training.description && (
                <div className="mt-4 rounded-lg bg-gray-50 p-4">
                  <p className="whitespace-pre-wrap text-gray-700">{training.description}</p>
                </div>
              )}
              {isCompleted && (
                <Badge variant="secondary" className="mt-2">
                  Đã diễn ra
                </Badge>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Danh sách đăng ký ({training.participant_count || 0})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {participants.length > 0 ? (
                <div className="space-y-3">
                  {participants.map((participant) => (
                    <div
                      key={participant.users.id}
                      className="flex items-center gap-3 rounded-lg p-2 hover:bg-gray-50"
                    >
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={participant.users.avatar_url ?? undefined} />
                        <AvatarFallback className="bg-blue-100 text-blue-600">
                          {participant.users.full_name?.charAt(0) || "?"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-medium">{participant.users.full_name}</p>
                        <p className="text-xs text-gray-500">
                          Đăng ký lúc:{" "}
                          {new Date(participant.registered_at).toLocaleString("vi-VN")}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center text-gray-500">
                  <Users className="mx-auto mb-2 h-12 w-12 opacity-50" />
                  <p>Chưa có ai đăng ký</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
