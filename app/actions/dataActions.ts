"use server";

import {
  getAchievements,
  getAllMembers,
  getAllPosts,
  getAllPostsAdmin,
  getAllTrainings,
  getCurrentUser,
  getEventById,
  getHistoryEventById,
  getHistoryTimeline,
  getHomepagePosts,
  getLeaderboard,
  getPostById,
  getTrainingById,
  getUpcomingEvents,
  getUpcomingTraining,
} from "@/lib/utils/db-helpers";
import type { LeaderboardPeriodType } from "@/lib/supabase/types";

export async function fetchCurrentUser() {
  return getCurrentUser();
}

export async function fetchAllPosts(viewerIsAdmin = false) {
  return getAllPosts(viewerIsAdmin);
}

export async function fetchAllPostsAdmin() {
  return getAllPostsAdmin();
}

export async function fetchPostById(id: string, viewerIsAdmin = false) {
  return getPostById(id, viewerIsAdmin);
}

export async function fetchTrainingById(id: string) {
  return getTrainingById(id);
}

export async function fetchHistoryTimeline() {
  return getHistoryTimeline();
}

export async function fetchHistoryEventById(id: string) {
  return getHistoryEventById(id);
}

export async function fetchAchievements() {
  return getAchievements();
}

export async function fetchUpcomingTraining(limit = 10) {
  return getUpcomingTraining(limit);
}

export async function fetchAllTrainings() {
  return getAllTrainings();
}

export async function fetchUpcomingEvents(limit = 10) {
  return getUpcomingEvents(limit);
}

export async function fetchEventById(id: string) {
  return getEventById(id);
}

/** Trang chủ: posts + events + trainings song song, query tối giản */
export async function fetchHomepageData() {
  const { data: user } = await getCurrentUser();
  const viewerIsAdmin = user?.role === "admin";

  const [posts, events, trainings] = await Promise.all([
    getHomepagePosts(3, viewerIsAdmin),
    getUpcomingEvents(3),
    getUpcomingTraining(3),
  ]);

  return {
    posts: posts.data ?? [],
    events: events.data ?? [],
    trainings: trainings.data ?? [],
    errors: [posts.error, events.error, trainings.error].filter(Boolean) as string[],
  };
}

export async function fetchLeaderboard(
  periodType: LeaderboardPeriodType,
  startDate: string,
  endDate: string
) {
  return getLeaderboard(periodType, startDate, endDate);
}

export async function fetchAllMembers() {
  return getAllMembers();
}
