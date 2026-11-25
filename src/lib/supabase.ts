import { createBrowserClient } from "@supabase/ssr";

export type Member = any;
export type MemberWarn = any;
export type FamilySetting = any;
export type WeeklyTask = any;
export type TaskSubmission = any;
export type WeaponLog = any;
export type GalleryPhoto = any;
export type Application = any;

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: {
        maxAge: 60 * 60 * 24 * 365,
        path: "/",
        sameSite: "lax",
        secure: true,
      },
    }
  );
}