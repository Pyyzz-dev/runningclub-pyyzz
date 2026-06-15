export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type UserRole = "admin" | "member";

export type PostStatus = "draft" | "published";

export type LeaderboardPeriodType = "weekly" | "monthly" | "yearly" | "all_time";

export type PasswordResetStatus = "pending" | "approved" | "rejected" | "completed";

export type PendingMemberStatus = "pending" | "approved" | "rejected";

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string | null;
          full_name: string;
          username: string | null;
          role: UserRole;
          remarks: string | null;
          avatar_url: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          email?: string | null;
          full_name: string;
          username?: string | null;
          role?: UserRole;
          remarks?: string | null;
          avatar_url?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string | null;
          full_name?: string;
          username?: string | null;
          role?: UserRole;
          remarks?: string | null;
          avatar_url?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      posts: {
        Row: {
          id: string;
          title: string;
          content: string;
          author_id: string;
          published_at: string | null;
          updated_at: string;
          status: PostStatus;
          cover_image_url: string | null;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          title: string;
          content: string;
          author_id: string;
          published_at?: string | null;
          updated_at?: string;
          status?: PostStatus;
          cover_image_url?: string | null;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          title?: string;
          content?: string;
          author_id?: string;
          published_at?: string | null;
          updated_at?: string;
          status?: PostStatus;
          cover_image_url?: string | null;
          deleted_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "posts_author_id_fkey";
            columns: ["author_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      comments: {
        Row: {
          id: string;
          post_id: string;
          user_id: string;
          content: string;
          is_anonymous: boolean;
          created_at: string;
          is_hidden: boolean;
        };
        Insert: {
          id?: string;
          post_id: string;
          user_id: string;
          content: string;
          is_anonymous?: boolean;
          created_at?: string;
          is_hidden?: boolean;
        };
        Update: {
          id?: string;
          post_id?: string;
          user_id?: string;
          content?: string;
          is_anonymous?: boolean;
          created_at?: string;
          is_hidden?: boolean;
        };
        Relationships: [
          {
            foreignKeyName: "comments_post_id_fkey";
            columns: ["post_id"];
            referencedRelation: "posts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "comments_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      club_history: {
        Row: {
          id: string;
          title: string;
          content: string;
          event_date: string;
          image_url: string | null;
          order_index: number;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          title: string;
          content: string;
          event_date: string;
          image_url?: string | null;
          order_index?: number;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          title?: string;
          content?: string;
          event_date?: string;
          image_url?: string | null;
          order_index?: number;
          deleted_at?: string | null;
        };
        Relationships: [];
      };
      club_info: {
        Row: {
          id: string;
          content: string;
          cover_image_url: string | null;
          updated_at: string;
        };
        Insert: {
          id?: string;
          content: string;
          cover_image_url?: string | null;
          updated_at?: string;
        };
        Update: {
          id?: string;
          content?: string;
          cover_image_url?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      achievements: {
        Row: {
          id: string;
          title: string;
          description: string;
          achieved_date: string;
          medal_type: string | null;
          image_url: string | null;
        };
        Insert: {
          id?: string;
          title: string;
          description: string;
          achieved_date: string;
          medal_type?: string | null;
          image_url?: string | null;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string;
          achieved_date?: string;
          medal_type?: string | null;
          image_url?: string | null;
        };
        Relationships: [];
      };
      training_schedule: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          location: string | null;
          start_time: string;
          end_time: string | null;
          participant_count: number;
          created_by: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string | null;
          location?: string | null;
          start_time: string;
          end_time?: string | null;
          participant_count?: number;
          created_by: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string | null;
          location?: string | null;
          start_time?: string;
          end_time?: string | null;
          participant_count?: number;
          created_by?: string;
          deleted_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "training_schedule_created_by_fkey";
            columns: ["created_by"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      training_participants: {
        Row: {
          id: string;
          training_id: string;
          user_id: string;
          registered_at: string;
        };
        Insert: {
          id?: string;
          training_id: string;
          user_id: string;
          registered_at?: string;
        };
        Update: {
          id?: string;
          training_id?: string;
          user_id?: string;
          registered_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "training_participants_training_id_fkey";
            columns: ["training_id"];
            referencedRelation: "training_schedule";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "training_participants_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      events: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          location: string | null;
          event_date: string;
          registration_deadline: string | null;
          event_link: string | null;
          participant_count: number;
          image_url: string | null;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          location?: string | null;
          event_date: string;
          registration_deadline?: string | null;
          event_link?: string | null;
          participant_count?: number;
          image_url?: string | null;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          location?: string | null;
          event_date?: string;
          registration_deadline?: string | null;
          event_link?: string | null;
          participant_count?: number;
          image_url?: string | null;
          deleted_at?: string | null;
        };
        Relationships: [];
      };
      pending_members: {
        Row: {
          id: string;
          email: string;
          full_name: string;
          status: PendingMemberStatus;
          created_at: string;
          remarks: string | null;
          approved_at: string | null;
          approved_by: string | null;
        };
        Insert: {
          id?: string;
          email: string;
          full_name: string;
          status?: PendingMemberStatus;
          created_at?: string;
          remarks?: string | null;
          approved_at?: string | null;
          approved_by?: string | null;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string;
          status?: PendingMemberStatus;
          created_at?: string;
          remarks?: string | null;
          approved_at?: string | null;
          approved_by?: string | null;
        };
        Relationships: [];
      };
      leaderboard: {
        Row: {
          id: string;
          user_id: string;
          total_distance_km: number;
          total_time_minutes: number;
          average_pace: number | null;
          period_type: LeaderboardPeriodType;
          period_start: string;
          period_end: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          total_distance_km: number;
          total_time_minutes: number;
          average_pace?: number | null;
          period_type: LeaderboardPeriodType;
          period_start: string;
          period_end: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          total_distance_km?: number;
          total_time_minutes?: number;
          average_pace?: number | null;
          period_type?: LeaderboardPeriodType;
          period_start?: string;
          period_end?: string;
        };
        Relationships: [
          {
            foreignKeyName: "leaderboard_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      password_resets: {
        Row: {
          id: string;
          email: string;
          token: string;
          expires_at: string;
          used: boolean;
          created_by_ip: string | null;
          user_agent: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          token: string;
          expires_at: string;
          used?: boolean;
          created_by_ip?: string | null;
          user_agent?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          token?: string;
          expires_at?: string;
          used?: boolean;
          created_by_ip?: string | null;
          user_agent?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      member_password_reset_requests: {
        Row: {
          id: string;
          user_id: string;
          new_password_hash: string;
          token: string;
          expires_at: string;
          status: PasswordResetStatus;
          requested_by: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          new_password_hash: string;
          token: string;
          expires_at: string;
          status?: PasswordResetStatus;
          requested_by: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          new_password_hash?: string;
          token?: string;
          expires_at?: string;
          status?: PasswordResetStatus;
          requested_by?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "member_password_reset_requests_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "member_password_reset_requests_requested_by_fkey";
            columns: ["requested_by"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: {
      cleanup_soft_deleted_records: {
        Args: Record<string, never>;
        Returns: Json;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

export type User = Database["public"]["Tables"]["users"]["Row"];
export type Post = Database["public"]["Tables"]["posts"]["Row"];
export type Comment = Database["public"]["Tables"]["comments"]["Row"];
export type ClubHistory = Database["public"]["Tables"]["club_history"]["Row"];
export type ClubInfo = Database["public"]["Tables"]["club_info"]["Row"];
export type Achievement = Database["public"]["Tables"]["achievements"]["Row"];
export type TrainingSchedule =
  Database["public"]["Tables"]["training_schedule"]["Row"];
export type Event = Database["public"]["Tables"]["events"]["Row"];
export type PendingMember = Database["public"]["Tables"]["pending_members"]["Row"];
export type LeaderboardEntry = Database["public"]["Tables"]["leaderboard"]["Row"];

export type PostWithAuthor = Post & {
  author: Pick<User, "id" | "full_name" | "avatar_url">;
};

export type PostWithAuthorEmail = PostWithAuthor & {
  author: PostWithAuthor["author"] & { email: string | null };
};

export type PostWithAuthorAndCount = PostWithAuthor & {
  comment_count: number;
};

export type CommentWithAuthor = Comment & {
  author: Pick<User, "id" | "full_name" | "avatar_url">;
  display_name: string;
};

export type PostWithComments = PostWithAuthor & {
  comments: CommentWithAuthor[];
};

export type LeaderboardWithUser = LeaderboardEntry & {
  user: Pick<User, "id" | "full_name" | "avatar_url">;
};

export type TrainingParticipantWithUser = {
  id: string;
  registered_at: string;
  user: Pick<User, "id" | "full_name" | "avatar_url">;
};

export type TrainingWithParticipants = TrainingSchedule & {
  participants: TrainingParticipantWithUser[];
};

export type DbResult<T> = {
  data: T | null;
  error: string | null;
};
