import { createHash, randomBytes } from "crypto";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { isNotDeleted, softDelete } from "@/lib/utils/softDelete";
import type {
  Achievement,
  ClubHistory,
  ClubInfo,
  CommentWithAuthor,
  Database,
  DbResult,
  Event,
  LeaderboardPeriodType,
  LeaderboardWithUser,
  PostWithAuthor,
  PostWithAuthorAndCount,
  PostWithComments,
  TrainingSchedule,
  User,
} from "@/lib/supabase/types";

const ANONYMOUS_DISPLAY_NAME = "Thành viên ẩn danh";

type PostInsert = Database["public"]["Tables"]["posts"]["Insert"];
type PostUpdate = Database["public"]["Tables"]["posts"]["Update"];
type ClubHistoryInsert = Database["public"]["Tables"]["club_history"]["Insert"];
type ClubHistoryUpdate = Database["public"]["Tables"]["club_history"]["Update"];
type ClubInfoUpdate = Database["public"]["Tables"]["club_info"]["Update"];
type AchievementInsert = Database["public"]["Tables"]["achievements"]["Insert"];
type TrainingInsert = Database["public"]["Tables"]["training_schedule"]["Insert"];
type EventInsert = Database["public"]["Tables"]["events"]["Insert"];
type LeaderboardInsert = Database["public"]["Tables"]["leaderboard"]["Insert"];

type CommentRowWithUser = CommentWithAuthor & {
  users: Pick<User, "id" | "full_name" | "avatar_url"> | null;
};

function mapCommentWithAuthor(comment: CommentRowWithUser): CommentWithAuthor {
  const author = comment.users ?? {
    id: comment.user_id,
    full_name: "",
    avatar_url: null,
  };

  return {
    id: comment.id,
    post_id: comment.post_id,
    user_id: comment.user_id,
    content: comment.content,
    is_anonymous: comment.is_anonymous,
    created_at: comment.created_at,
    deleted_at: comment.deleted_at ?? null,
    author: {
      id: author.id,
      full_name: author.full_name,
      avatar_url: author.avatar_url,
    },
    display_name: comment.is_anonymous
      ? ANONYMOUS_DISPLAY_NAME
      : author.full_name,
  };
}

// ─── Authentication ───────────────────────────────────────────────────────────

export async function getCurrentUser(): Promise<DbResult<User>> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { data: null, error: authError?.message ?? "Chưa đăng nhập" };
  }

  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .single();

  return { data, error: error?.message ?? null };
}

export async function isAdmin(): Promise<boolean> {
  const { data } = await getCurrentUser();
  return data?.role === "admin";
}

export async function updateOwnPassword(
  oldPassword: string,
  newPassword: string
): Promise<DbResult<boolean>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return { data: null, error: "Chưa đăng nhập" };
  }

  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: oldPassword,
  });

  if (signInError) {
    return { data: null, error: "Mật khẩu hiện tại không đúng" };
  }

  const { error } = await supabase.auth.updateUser({ password: newPassword });
  return { data: error ? null : true, error: error?.message ?? null };
}

// ─── Posts & Comments ─────────────────────────────────────────────────────────

export async function getAllPosts(): Promise<DbResult<PostWithAuthorAndCount[]>> {
  const supabase = await createClient();

  const { data, error } = await isNotDeleted(
    supabase.from("posts").select(
      `
      *,
      author:users!posts_author_id_fkey(id, full_name, avatar_url),
      comments(count)
    `
    )
  )
    .eq("status", "published")
    .order("published_at", { ascending: false });

  if (error) {
    return { data: null, error: error.message };
  }

  const mapped = (data ?? []).map((post) => {
    const { comments, ...rest } = post as PostWithAuthor & {
      comments: { count: number }[];
    };
    return {
      ...rest,
      comment_count: comments?.[0]?.count ?? 0,
    } as PostWithAuthorAndCount;
  });

  return { data: mapped, error: null };
}

/** Trang chủ: chỉ lấy cột cần thiết, giới hạn số lượng */
export async function getHomepagePosts(
  limit = 3
): Promise<DbResult<PostWithAuthorAndCount[]>> {
  const supabase = await createClient();

  const { data, error } = await isNotDeleted(
    supabase.from("posts").select(
      `
      id,
      title,
      content,
      cover_image_url,
      published_at,
      updated_at,
      author_id,
      status,
      author:users!posts_author_id_fkey(id, full_name, avatar_url),
      comments(count)
    `
    )
  )
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(limit);

  if (error) {
    return { data: null, error: error.message };
  }

  const mapped = (data ?? []).map((post) => {
    const { comments, ...rest } = post as PostWithAuthor & {
      comments: { count: number }[];
    };
    return {
      ...rest,
      comment_count: comments?.[0]?.count ?? 0,
    } as PostWithAuthorAndCount;
  });

  return { data: mapped, error: null };
}

export async function getAllPostsAdmin(): Promise<DbResult<PostWithAuthor[]>> {
  if (!(await isAdmin())) {
    return { data: null, error: "Không có quyền thực hiện thao tác này" };
  }

  const supabase = await createClient();
  const { data, error } = await isNotDeleted(
    supabase.from("posts").select(
      `
      *,
      author:users!posts_author_id_fkey(id, full_name, avatar_url)
    `
    )
  ).order("updated_at", { ascending: false });

  return { data: data as PostWithAuthor[] | null, error: error?.message ?? null };
}

export async function getPostById(
  id: string
): Promise<DbResult<PostWithComments>> {
  const supabase = await createClient();

  const { data: post, error: postError } = await isNotDeleted(
    supabase.from("posts").select(
      `
      *,
      author:users!posts_author_id_fkey(id, full_name, avatar_url)
    `
    )
  )
    .eq("id", id)
    .single();

  if (postError) {
    return { data: null, error: postError.message };
  }

  const { data: comments, error: commentsError } = await isNotDeleted(
    supabase.from("comments").select(
      `
      *,
      users(id, full_name, avatar_url)
    `
    )
  )
    .eq("post_id", id)
    .order("created_at", { ascending: true });

  if (commentsError) {
    return { data: null, error: commentsError.message };
  }

  const mappedComments = (comments ?? []).map((c) =>
    mapCommentWithAuthor(c as CommentRowWithUser)
  );

  return {
    data: {
      ...(post as PostWithAuthor),
      comments: mappedComments,
    },
    error: null,
  };
}

export async function createPost(
  postData: Omit<PostInsert, "author_id">
): Promise<DbResult<PostWithAuthor>> {
  if (!(await isAdmin())) {
    return { data: null, error: "Không có quyền thực hiện thao tác này" };
  }

  const supabase = await createClient();
  const { data: currentUser } = await getCurrentUser();

  if (!currentUser) {
    return { data: null, error: "Chưa đăng nhập" };
  }

  const { data, error } = await supabase
    .from("posts")
    .insert({
      ...postData,
      author_id: currentUser.id,
      published_at:
        postData.status === "published" ? new Date().toISOString() : null,
    })
    .select(
      `
      *,
      author:users!posts_author_id_fkey(id, full_name, avatar_url)
    `
    )
    .single();

  return { data: data as PostWithAuthor | null, error: error?.message ?? null };
}

export async function updatePost(
  id: string,
  data: PostUpdate
): Promise<DbResult<PostWithAuthor>> {
  if (!(await isAdmin())) {
    return { data: null, error: "Không có quyền thực hiện thao tác này" };
  }

  const supabase = await createClient();

  const updatePayload: PostUpdate = {
    ...data,
    updated_at: new Date().toISOString(),
  };

  if (data.status === "published") {
    updatePayload.published_at = new Date().toISOString();
  }

  const { data: updated, error } = await supabase
    .from("posts")
    .update(updatePayload)
    .eq("id", id)
    .select(
      `
      *,
      author:users!posts_author_id_fkey(id, full_name, avatar_url)
    `
    )
    .single();

  return {
    data: updated as PostWithAuthor | null,
    error: error?.message ?? null,
  };
}

export async function deletePost(id: string): Promise<DbResult<boolean>> {
  if (!(await isAdmin())) {
    return { data: null, error: "Không có quyền thực hiện thao tác này" };
  }

  const supabase = await createClient();
  const { error } = await softDelete(supabase, "posts", id);

  return { data: error ? null : true, error: error?.message ?? null };
}

export async function addComment(
  postId: string,
  userId: string,
  content: string,
  isAnonymous: boolean
): Promise<DbResult<CommentWithAuthor>> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("comments")
    .insert({
      post_id: postId,
      user_id: userId,
      content,
      is_anonymous: isAnonymous,
    })
    .select(
      `
      *,
      users(id, full_name, avatar_url)
    `
    )
    .single();

  if (error) {
    return { data: null, error: error.message };
  }

  return {
    data: mapCommentWithAuthor(data as CommentRowWithUser),
    error: null,
  };
}

export async function deleteComment(
  commentId: string,
  userId: string
): Promise<DbResult<boolean>> {
  const supabase = await createClient();
  const admin = await isAdmin();

  let query = supabase
    .from("comments")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", commentId);

  if (!admin) {
    query = query.eq("user_id", userId);
  }

  const { error } = await query;

  return { data: error ? null : true, error: error?.message ?? null };
}

// ─── Club History & Achievements ──────────────────────────────────────────────

export async function getHistoryTimeline(): Promise<DbResult<ClubHistory[]>> {
  const supabase = await createClient();

  const { data, error } = await isNotDeleted(supabase.from("club_history").select("*"))
    .order("order_index", { ascending: true })
    .order("event_date", { ascending: false });

  return { data, error: error?.message ?? null };
}

export async function getHistoryEventById(id: string): Promise<DbResult<ClubHistory>> {
  const supabase = await createClient();

  const { data, error } = await isNotDeleted(supabase.from("club_history").select("*"))
    .eq("id", id)
    .maybeSingle();

  return { data, error: error?.message ?? null };
}

export async function addHistoryEntry(
  data: ClubHistoryInsert
): Promise<DbResult<ClubHistory>> {
  if (!(await isAdmin())) {
    return { data: null, error: "Không có quyền thực hiện thao tác này" };
  }

  const supabase = await createClient();
  const { data: entry, error } = await supabase
    .from("club_history")
    .insert(data)
    .select()
    .single();

  return { data: entry, error: error?.message ?? null };
}

export async function updateHistoryEntry(
  id: string,
  data: ClubHistoryUpdate
): Promise<DbResult<ClubHistory>> {
  if (!(await isAdmin())) {
    return { data: null, error: "Không có quyền thực hiện thao tác này" };
  }

  const supabase = await createClient();
  const { data: entry, error } = await supabase
    .from("club_history")
    .update(data)
    .eq("id", id)
    .select()
    .single();

  return { data: entry, error: error?.message ?? null };
}

export async function deleteHistoryEntry(
  id: string
): Promise<DbResult<boolean>> {
  if (!(await isAdmin())) {
    return { data: null, error: "Không có quyền thực hiện thao tác này" };
  }

  const supabase = await createClient();
  const { error } = await softDelete(supabase, "club_history", id);
  return { data: error ? null : true, error: error?.message ?? null };
}

export async function reorderHistoryEntries(
  orderedIds: string[]
): Promise<DbResult<boolean>> {
  if (!(await isAdmin())) {
    return { data: null, error: "Không có quyền thực hiện thao tác này" };
  }

  const supabase = await createClient();
  const updates = orderedIds.map((id, index) =>
    supabase.from("club_history").update({ order_index: index }).eq("id", id)
  );
  const results = await Promise.all(updates);
  const failed = results.find((r) => r.error);
  if (failed?.error) {
    return { data: null, error: failed.error.message };
  }
  return { data: true, error: null };
}

export async function getClubInfo(): Promise<DbResult<ClubInfo>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("club_info")
    .select("*")
    .eq("id", "about")
    .maybeSingle();

  if (error) {
    return { data: null, error: error.message };
  }

  if (!data) {
    return {
      data: {
        id: "about",
        title: "Giới thiệu CLB",
        content: "",
        cover_image_url: null,
        updated_at: new Date().toISOString(),
      },
      error: null,
    };
  }

  return { data, error: null };
}

export async function updateClubInfo(
  data: Omit<ClubInfoUpdate, "id"> & { title: string; content: string }
): Promise<DbResult<ClubInfo>> {
  if (!(await isAdmin())) {
    return { data: null, error: "Không có quyền thực hiện thao tác này" };
  }

  const supabase = await createClient();
  const { data: info, error } = await supabase
    .from("club_info")
    .upsert({
      id: "about",
      ...data,
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  return { data: info, error: error?.message ?? null };
}

export async function getAchievements(): Promise<DbResult<Achievement[]>> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("achievements")
    .select("*")
    .order("achieved_date", { ascending: false });

  return { data, error: error?.message ?? null };
}

export async function addAchievement(
  data: AchievementInsert
): Promise<DbResult<Achievement>> {
  if (!(await isAdmin())) {
    return { data: null, error: "Không có quyền thực hiện thao tác này" };
  }

  const supabase = await createClient();
  const { data: achievement, error } = await supabase
    .from("achievements")
    .insert(data)
    .select()
    .single();

  return { data: achievement, error: error?.message ?? null };
}

// ─── Training & Events ────────────────────────────────────────────────────────

export async function getUpcomingTraining(
  limit = 10
): Promise<DbResult<TrainingSchedule[]>> {
  const supabase = await createClient();
  const now = new Date().toISOString();

  const { data, error } = await isNotDeleted(
    supabase
      .from("training_schedule")
      .select(
        "id, title, description, location, start_time, end_time, created_by, deleted_at"
      )
  )
    .gte("start_time", now)
    .order("start_time", { ascending: true })
    .limit(limit);

  return { data: data as TrainingSchedule[] | null, error: error?.message ?? null };
}

export async function getUpcomingEvents(
  limit = 10
): Promise<DbResult<Event[]>> {
  const supabase = await createClient();
  const now = new Date().toISOString();

  const { data, error } = await isNotDeleted(
    supabase.from("events").select(
      "id, name, description, location, event_date, registration_deadline, event_link, participant_count, image_url, deleted_at"
    )
  )
    .gte("event_date", now)
    .order("event_date", { ascending: true })
    .limit(limit);

  return { data, error: error?.message ?? null };
}

export async function getAllEvents(): Promise<DbResult<Event[]>> {
  const supabase = await createClient();

  const { data, error } = await isNotDeleted(supabase.from("events").select("*")).order(
    "event_date",
    { ascending: false }
  );

  return { data, error: error?.message ?? null };
}

export async function updateEvent(
  id: string,
  data: EventInsert
): Promise<DbResult<Event>> {
  if (!(await isAdmin())) {
    return { data: null, error: "Không có quyền thực hiện thao tác này" };
  }

  const supabase = await createClient();
  const { data: event, error } = await supabase
    .from("events")
    .update(data)
    .eq("id", id)
    .select()
    .single();

  return { data: event, error: error?.message ?? null };
}

export async function deleteEvent(id: string): Promise<DbResult<boolean>> {
  if (!(await isAdmin())) {
    return { data: null, error: "Không có quyền thực hiện thao tác này" };
  }

  const supabase = await createClient();
  const { error } = await softDelete(supabase, "events", id);

  return { data: error ? null : true, error: error?.message ?? null };
}

export async function updateEventParticipantCount(
  id: string,
  count: number
): Promise<DbResult<Event>> {
  if (!(await isAdmin())) {
    return { data: null, error: "Không có quyền thực hiện thao tác này" };
  }

  const safeCount = Math.max(0, Math.floor(count));
  const supabase = await createClient();
  const { data: event, error } = await supabase
    .from("events")
    .update({ participant_count: safeCount })
    .eq("id", id)
    .select()
    .single();

  return { data: event, error: error?.message ?? null };
}

export async function createTrainingSchedule(
  data: Omit<TrainingInsert, "created_by">
): Promise<DbResult<TrainingSchedule>> {
  if (!(await isAdmin())) {
    return { data: null, error: "Không có quyền thực hiện thao tác này" };
  }

  const supabase = await createClient();
  const { data: currentUser } = await getCurrentUser();

  if (!currentUser) {
    return { data: null, error: "Chưa đăng nhập" };
  }

  const { data: schedule, error } = await supabase
    .from("training_schedule")
    .insert({ ...data, created_by: currentUser.id })
    .select()
    .single();

  return { data: schedule, error: error?.message ?? null };
}

export async function getAllTrainings(filters?: {
  month?: string;
}): Promise<DbResult<TrainingSchedule[]>> {
  const supabase = await createClient();
  let query = isNotDeleted(supabase.from("training_schedule").select("*")).order(
    "start_time",
    { ascending: false }
  );

  if (filters?.month) {
    const [year, month] = filters.month.split("-").map(Number);
    const start = new Date(year, month - 1, 1).toISOString();
    const end = new Date(year, month, 0, 23, 59, 59, 999).toISOString();
    query = query.gte("start_time", start).lte("start_time", end);
  }

  const { data, error } = await query;
  return { data, error: error?.message ?? null };
}

export async function updateTrainingSchedule(
  id: string,
  data: Omit<TrainingInsert, "created_by">
): Promise<DbResult<TrainingSchedule>> {
  if (!(await isAdmin())) {
    return { data: null, error: "Không có quyền thực hiện thao tác này" };
  }

  const supabase = await createClient();
  const { data: schedule, error } = await supabase
    .from("training_schedule")
    .update(data)
    .eq("id", id)
    .select()
    .single();

  return { data: schedule, error: error?.message ?? null };
}

export async function deleteTrainingSchedule(
  id: string
): Promise<DbResult<boolean>> {
  if (!(await isAdmin())) {
    return { data: null, error: "Không có quyền thực hiện thao tác này" };
  }

  const supabase = await createClient();
  const { error } = await softDelete(supabase, "training_schedule", id);

  return { data: error ? null : true, error: error?.message ?? null };
}

export async function createEvent(
  data: EventInsert
): Promise<DbResult<Event>> {
  if (!(await isAdmin())) {
    return { data: null, error: "Không có quyền thực hiện thao tác này" };
  }

  const supabase = await createClient();
  const { data: event, error } = await supabase
    .from("events")
    .insert(data)
    .select()
    .single();

  return { data: event, error: error?.message ?? null };
}

// ─── Leaderboard ──────────────────────────────────────────────────────────────

export async function getLeaderboard(
  periodType: LeaderboardPeriodType,
  startDate: string,
  endDate: string
): Promise<DbResult<LeaderboardWithUser[]>> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("leaderboard")
    .select(
      `
      *,
      user:users!leaderboard_user_id_fkey(id, full_name, avatar_url)
    `
    )
    .eq("period_type", periodType)
    .eq("period_start", startDate)
    .eq("period_end", endDate)
    .order("total_distance_km", { ascending: false });

  return { data: data as LeaderboardWithUser[] | null, error: error?.message ?? null };
}

export async function updateLeaderboard(
  data: LeaderboardInsert
): Promise<DbResult<LeaderboardWithUser>> {
  if (!(await isAdmin())) {
    return { data: null, error: "Không có quyền thực hiện thao tác này" };
  }

  const supabase = await createClient();

  const { data: entry, error } = await supabase
    .from("leaderboard")
    .upsert(data, { onConflict: "user_id,period_type,period_start,period_end" })
    .select(
      `
      *,
      user:users!leaderboard_user_id_fkey(id, full_name, avatar_url)
    `
    )
    .single();

  return {
    data: entry as LeaderboardWithUser | null,
    error: error?.message ?? null,
  };
}

// ─── User Management (admin only) ─────────────────────────────────────────────

export async function getAllMembers(): Promise<DbResult<User[]>> {
  if (!(await isAdmin())) {
    return { data: null, error: "Không có quyền thực hiện thao tác này" };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .order("created_at", { ascending: false });

  return { data, error: error?.message ?? null };
}

export async function createMemberAccount(
  email: string,
  password: string,
  fullName: string
): Promise<DbResult<User>> {
  if (!(await isAdmin())) {
    return { data: null, error: "Không có quyền thực hiện thao tác này" };
  }

  const adminClient = createAdminClient();

  const { data: authData, error: authError } =
    await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

  if (authError || !authData.user) {
    return { data: null, error: authError?.message ?? "Không thể tạo tài khoản" };
  }

  const { data, error } = await adminClient
    .from("users")
    .insert({
      id: authData.user.id,
      full_name: fullName,
      role: "member",
    })
    .select()
    .single();

  return { data, error: error?.message ?? null };
}

export async function updateUserRole(
  userId: string,
  newRole: User["role"]
): Promise<DbResult<User>> {
  if (!(await isAdmin())) {
    return { data: null, error: "Không có quyền thực hiện thao tác này" };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("users")
    .update({ role: newRole })
    .eq("id", userId)
    .select()
    .single();

  return { data, error: error?.message ?? null };
}

export async function resetUserPassword(
  userId: string,
  newPassword: string
): Promise<DbResult<{ token: string }>> {
  if (!(await isAdmin())) {
    return { data: null, error: "Không có quyền thực hiện thao tác này" };
  }

  const { data: currentUser } = await getCurrentUser();
  if (!currentUser) {
    return { data: null, error: "Chưa đăng nhập" };
  }

  const token = randomBytes(32).toString("hex");
  const newPasswordHash = createHash("sha256")
    .update(newPassword)
    .digest("hex");
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

  const supabase = await createClient();
  const { error } = await supabase
    .from("member_password_reset_requests")
    .insert({
      user_id: userId,
      new_password_hash: newPasswordHash,
      token,
      expires_at: expiresAt,
      status: "pending",
      requested_by: currentUser.id,
    });

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: { token }, error: null };
}

export type AdminDashboardStats = {
  memberCount: number;
  publishedPostCount: number;
  upcomingTrainingCount: number;
  recentPosts: PostWithAuthor[];
  upcomingTrainings: TrainingSchedule[];
};

export async function getAdminDashboardStats(): Promise<
  DbResult<AdminDashboardStats>
> {
  if (!(await isAdmin())) {
    return { data: null, error: "Không có quyền thực hiện thao tác này" };
  }

  const supabase = await createClient();
  const now = new Date().toISOString();
  const thirtyDays = new Date(
    Date.now() + 30 * 24 * 60 * 60 * 1000
  ).toISOString();

  const [
    membersRes,
    postsRes,
    trainingsRes,
    recentPostsRes,
    upcomingRes,
  ] = await Promise.all([
    supabase.from("users").select("*", { count: "exact", head: true }),
    isNotDeleted(supabase.from("posts").select("*", { count: "exact", head: true })).eq(
      "status",
      "published"
    ),
    isNotDeleted(
      supabase.from("training_schedule").select("*", { count: "exact", head: true })
    )
      .gte("start_time", now)
      .lte("start_time", thirtyDays),
    isNotDeleted(
      supabase.from("posts").select(
        `*, author:users!posts_author_id_fkey(id, full_name, avatar_url)`
      )
    )
      .order("updated_at", { ascending: false })
      .limit(5),
    isNotDeleted(supabase.from("training_schedule").select("*"))
      .gte("start_time", now)
      .order("start_time", { ascending: true })
      .limit(3),
  ]);

  return {
    data: {
      memberCount: membersRes.count ?? 0,
      publishedPostCount: postsRes.count ?? 0,
      upcomingTrainingCount: trainingsRes.count ?? 0,
      recentPosts: (recentPostsRes.data ?? []) as PostWithAuthor[],
      upcomingTrainings: upcomingRes.data ?? [],
    },
    error: null,
  };
}
