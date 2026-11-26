import { createBrowserClient } from "@supabase/ssr";

export type Member = any;
export type MemberWarn = any;
export type FamilySetting = any;
export type WeeklyTask = any;
export type TaskSubmission = any;
export type WeaponLog = any;
export type GalleryPhoto = any;
export type Application = any;

const createRawBrowserClient = () =>
  createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
      cookieOptions: {
        maxAge: 60 * 60 * 24 * 365,
        path: "/",
        sameSite: "lax",
        secure: true,
      },
    }
  );

let browserClient: ReturnType<typeof createRawBrowserClient> | null = null;

export function createClient() {
  if (!browserClient) {
    browserClient = createRawBrowserClient();
  }
  return browserClient;
}