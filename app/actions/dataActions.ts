"use server";

import {
  getAchievements,
  getAllMembers,
  getAllPosts,
  getAllPostsAdmin,
  getCurrentUser,
  getHistoryEventById,
  getHistoryTimeline,
  getHomepagePosts,
  getLeaderboard,
  getPostById,
  getUpcomingEvents,
  getUpcomingTraining,
} from "@/lib/utils/db-helpers";
import type { LeaderboardPeriodType } from "@/lib/supabase/types";

export async function fetchCurrentUser() {
  return getCurrentUser();
}

export async function fetchAllPosts() {
  return getAllPosts();
}

export async function fetchAllPostsAdmin() {
  return getAllPostsAdmin();
}

export async function fetchPostById(id: string) {
  return getPostById(id);
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

export async function fetchUpcomingEvents(limit = 10) {
  return getUpcomingEvents(limit);
}

/** Trang chủ: posts + events + trainings song song, query tối giản */
export async function fetchHomepageData() {
  const [posts, events, trainings] = await Promise.all([
    getHomepagePosts(3),
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
