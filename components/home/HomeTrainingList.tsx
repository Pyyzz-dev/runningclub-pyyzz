"use client";

import { useEffect, useState } from "react";
import { TrainingCard } from "@/components/cards/TrainingCard";
import type { TrainingSchedule } from "@/lib/supabase/types";

interface HomeTrainingListProps {
  trainings: TrainingSchedule[];
  userId: string | null;
  registeredMap: Record<string, boolean>;
  isAdmin?: boolean;
}

export function HomeTrainingList({
  trainings: initialTrainings,
  userId,
  registeredMap: initialRegisteredMap,
  isAdmin = false,
}: HomeTrainingListProps) {
  const [trainings, setTrainings] = useState(initialTrainings);
  const [registeredMap, setRegisteredMap] = useState(initialRegisteredMap);

  useEffect(() => {
    setTrainings(initialTrainings);
  }, [initialTrainings]);

  useEffect(() => {
    setRegisteredMap(initialRegisteredMap);
  }, [initialRegisteredMap]);

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {trainings.map((training) => (
        <TrainingCard
          key={training.id}
          training={training}
          isAdmin={isAdmin}
          userId={userId}
          isRegistered={registeredMap[training.id] ?? false}
          enableRegistration
          loginRedirect="/"
          onRegistrationChange={(trainingId, registered, participantCount) => {
            setRegisteredMap((prev) => ({ ...prev, [trainingId]: registered }));
            setTrainings((prev) =>
              prev.map((item) =>
                item.id === trainingId
                  ? { ...item, participant_count: participantCount }
                  : item
              )
            );
          }}
        />
      ))}
    </div>
  );
}
