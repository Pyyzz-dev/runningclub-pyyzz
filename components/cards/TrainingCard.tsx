"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { downloadICS, formatDateTime, generateICS } from "@/lib/format";
import type { TrainingSchedule } from "@/lib/supabase/types";
import { cn } from "@/lib/utils";
import { CalendarPlus, Clock, MapPin } from "lucide-react";

interface TrainingCardProps {
  training: TrainingSchedule;
  isAdmin?: boolean;
  className?: string;
  onDownloadICS?: (icsContent: string) => void;
}

export function TrainingCard({
  training,
  isAdmin = false,
  className,
  onDownloadICS,
}: TrainingCardProps) {
  const isUpcoming = new Date(training.start_time) > new Date();

  const handleDownload = () => {
    const icsContent = generateICS({
      title: training.title,
      description: training.description,
      location: training.location,
      startTime: training.start_time,
      endTime: training.end_time,
    });

    if (onDownloadICS) {
      onDownloadICS(icsContent);
    } else {
      downloadICS(icsContent, `${training.title.replace(/\s+/g, "-")}.ics`);
    }
  };

  return (
    <Card className={cn("flex flex-col", className)}>
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-lg">{training.title}</CardTitle>
          {isUpcoming ? (
            <Badge variant="default">Sắp tới</Badge>
          ) : (
            <Badge variant="secondary">Đã qua</Badge>
          )}
        </div>
        {training.description && (
          <CardDescription className="line-clamp-3">
            {training.description}
          </CardDescription>
        )}
      </CardHeader>

      <CardContent className="flex-1 space-y-3 pt-0">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4 shrink-0" />
          <span>
            {formatDateTime(training.start_time)}
            {training.end_time && ` – ${formatDateTime(training.end_time)}`}
          </span>
        </div>

        {training.location && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4 shrink-0" />
            <span>{training.location}</span>
          </div>
        )}
      </CardContent>

      <CardFooter className="gap-2">
        <Button variant="outline" size="sm" onClick={handleDownload}>
          <CalendarPlus className="h-4 w-4" />
          Thêm vào lịch
        </Button>
        {isAdmin && (
          <Badge variant="outline" className="ml-auto">
            Quản trị
          </Badge>
        )}
      </CardFooter>
    </Card>
  );
}
