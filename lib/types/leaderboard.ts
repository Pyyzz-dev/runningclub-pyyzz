export interface LeaderboardEntry {
  rank: number;
  memberName: string;
  totalActivities: number;
  validActivities: number;
  totalKm: number;
  totalTime: string;
}

export type LeaderboardSheetResult =
  | { data: LeaderboardEntry[]; error?: undefined }
  | { data?: undefined; error: string };
