"use client";

import { useEffect, useState } from "react";
import { Users } from "lucide-react";
import { TrainingRegistrationActions } from "@/components/training/TrainingRegistrationActions";

interface TrainingDetailRegistrationSectionProps {
  trainingId: string;
  userId: string | null;
  initialRegistered: boolean;
  isCompleted: boolean;
  initialParticipantCount: number;
}

export function TrainingDetailRegistrationSection({
  trainingId,
  userId,
  initialRegistered,
  isCompleted,
  initialParticipantCount,
}: TrainingDetailRegistrationSectionProps) {
  const [participantCount, setParticipantCount] = useState(initialParticipantCount);

  useEffect(() => {
    setParticipantCount(initialParticipantCount);
  }, [initialParticipantCount]);

  return (
    <div className="space-y-4 border-t pt-4">
      <div className="flex items-center gap-3 text-gray-600">
        <Users className="h-5 w-5" />
        <span>{participantCount} thành viên đã đăng ký</span>
      </div>
      <TrainingRegistrationActions
        trainingId={trainingId}
        userId={userId}
        initialRegistered={initialRegistered}
        isCompleted={isCompleted}
        loginRedirect={`/training/${trainingId}`}
        initialParticipantCount={participantCount}
        onParticipantCountChange={setParticipantCount}
      />
    </div>
  );
}
