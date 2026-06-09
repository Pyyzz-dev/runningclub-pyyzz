"use server";

import type {
  LeaderboardEntry,
  LeaderboardSheetResult,
} from "@/lib/types/leaderboard";

const CACHE_SECONDS = 600; // 10 phút

function parseSheetRow(row: string[]): LeaderboardEntry | null {
  const rankRaw = String(row[0] ?? "").trim();
  const memberName = String(row[1] ?? "").trim();

  if (!rankRaw || !memberName || rankRaw.toLowerCase() === "rank") {
    return null;
  }

  const rank = parseInt(rankRaw, 10);
  if (Number.isNaN(rank)) return null;

  const kmRaw = String(row[4] ?? "0").trim().replace(",", ".");

  return {
    rank,
    memberName,
    totalActivities: parseInt(String(row[2] ?? "0"), 10) || 0,
    validActivities: parseInt(String(row[3] ?? "0"), 10) || 0,
    totalKm: parseFloat(kmRaw) || 0,
    totalTime: String(row[5] ?? "00:00:00").trim() || "00:00:00",
  };
}

function buildSheetRange(sheetName: string): string {
  const escaped = sheetName.replace(/'/g, "''");
  return `'${escaped}'!A:F`;
}

async function fetchLeaderboardRows(): Promise<LeaderboardSheetResult> {
  const sheetId = process.env.GOOGLE_SHEETS_ID;
  const apiKey = process.env.GOOGLE_SHEETS_API_KEY;
  const sheetName = process.env.LEADERBOARD_SHEET_NAME || "Bảng_1";

  if (!sheetId || !apiKey) {
    return {
      error:
        "Chưa cấu hình GOOGLE_SHEETS_ID hoặc GOOGLE_SHEETS_API_KEY trong .env.local",
    };
  }

  const range = buildSheetRange(sheetName);
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodeURIComponent(range)}?key=${apiKey}`;

  try {
    const response = await fetch(url, {
      next: { revalidate: CACHE_SECONDS },
    });

    if (!response.ok) {
      const body = await response.text();
      return {
        error: `Google Sheets API lỗi (${response.status}): ${body.slice(0, 200)}`,
      };
    }

    const data = (await response.json()) as { values?: string[][] };

    if (!data.values?.length) {
      return { data: [] };
    }

    const entries = data.values
      .slice(1)
      .map(parseSheetRow)
      .filter((entry): entry is LeaderboardEntry => entry !== null)
      .sort((a, b) => a.rank - b.rank);

    return { data: entries };
  } catch (err) {
    return {
      error:
        err instanceof Error
          ? err.message
          : "Không thể tải dữ liệu từ Google Sheets",
    };
  }
}

export async function getLeaderboardFromSheet(): Promise<LeaderboardEntry[]> {
  const result = await fetchLeaderboardRows();
  if (result.error) {
    console.error("[leaderboard]", result.error);
    return [];
  }
  return result.data ?? [];
}

export async function getLeaderboardFromSheetWithError(): Promise<LeaderboardSheetResult> {
  return fetchLeaderboardRows();
}
