import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export interface Member {
  id: string;
  user_id: string | null;
  email: string;
  ic_name: string;
  discord_id: string | null;
  discord_username: string | null;
  avatar_url: string | null;
  rank_name: string;
  rank_order: number;
  role: "member" | "admin" | "super_admin";
  points: number;
  total_shift_mins: number;
  tasks_completed_count: number;
  is_on_duty: boolean;
  last_shift_start: string | null;
  steam_url: string | null;
  tiktok_url: string | null;
  youtube_url: string | null;
  kick_or_twitch_url: string | null;
  bio: string | null;
  created_at: string;
}

export interface MemberWarn {
  id: string;
  member_id: string;
  reason: string;
  warn_number: number;
  issued_by: string | null;
  created_at: string;
  expires_at: string;
}

export interface FamilySetting {
  key: string;
  title: string | null;
  content: string;
  updated_at: string;
}

export interface WeeklyTask {
  id: string;
  title: string;
  description: string | null;
  points_reward: number;
  week_label: string;
  is_active: boolean;
  created_at: string;
}

export interface TaskSubmission {
  id: string;
  task_id: string;
  member_id: string;
  verified_by: string | null;
  submitted_at: string;
}

export interface WeaponLog {
  id: string;
  member_name: string;
  action_type: "withdraw" | "deposit";
  weapon_name: string;
  quantity: number;
  serial_or_notes: string | null;
  logged_by: string | null;
  logged_at: string;
}

export interface GalleryPhoto {
  id: string;
  title: string | null;
  image_url: string;
  uploaded_by: string | null;
  created_at: string;
}

export interface Application {
  id: string;
  applicant_user_id: string;
  email: string;
  real_name_age: string;
  ic_name: string;
  discord_username: string;
  fivem_hours: string;
  previous_gangs: string | null;
  why_anarchy: string;
  status: "pending" | "accepted" | "rejected";
  reviewed_by: string | null;
  created_at: string;
}