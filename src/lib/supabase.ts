import { createBrowserClient } from "@supabase/ssr";

export type Member = any;
export type MemberWarn = any;
export type FamilySetting = any;
export type WeeklyTask = any;
export type TaskSubmission = any;
export type WeaponLog = any;
export type GalleryPhoto = any;
export type Application = any;

function parseBrowserCookies(): { name: string; value: string }[] {
  if (typeof document === "undefined" || !document.cookie) return [];
  return document.cookie.split(";").map((part) => {
    const eqIdx = part.indexOf("=");
    if (eqIdx === -1) return { name: part.trim(), value: "" };
    return {
      name: decodeURIComponent(part.slice(0, eqIdx).trim()),
      value: decodeURIComponent(part.slice(eqIdx + 1)),
    };
  });
}

function restoreBackedUpAuthCookies() {
  if (typeof window === "undefined" || typeof document === "undefined") return;
  try {
    const current = parseBrowserCookies();
    const hasSbAuth = current.some(
      (c) => c.name.startsWith("sb-") && c.name.includes("-auth-token") && c.value
    );
    if (hasSbAuth) return;
    const raw = window.localStorage.getItem("anarchy_sb_cookies_v1");
    if (!raw) return;
    const saved: Record<string, string> = JSON.parse(raw);
    const secureFlag = window.location.protocol === "https:" ? "; Secure" : "";
    for (const [name, value] of Object.entries(saved)) {
      if (name && value) {
        document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(
          value
        )}; path=/; max-age=31536000; SameSite=Lax${secureFlag}`;
      }
    }
  } catch {}
}

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
      cookies: {
        getAll() {
          restoreBackedUpAuthCookies();
          return parseBrowserCookies();
        },
        setAll(cookiesToSet) {
          if (typeof document === "undefined") return;
          const backup: Record<string, string> = {};
          try {
            const existingRaw = window.localStorage.getItem("anarchy_sb_cookies_v1");
            if (existingRaw) Object.assign(backup, JSON.parse(existingRaw));
          } catch {}

          const secureFlag =
            typeof window !== "undefined" && window.location.protocol === "https:"
              ? "; Secure"
              : "";

          cookiesToSet.forEach(({ name, value, options }) => {
            const maxAge = options?.maxAge === 0 ? 0 : 60 * 60 * 24 * 365;
            document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(
              value
            )}; path=${options?.path || "/"}; max-age=${maxAge}; SameSite=Lax${secureFlag}`;

            if (name.startsWith("sb-")) {
              if (maxAge === 0 || !value) {
                delete backup[name];
              } else {
                backup[name] = value;
              }
            }
          });

          try {
            window.localStorage.setItem("anarchy_sb_cookies_v1", JSON.stringify(backup));
          } catch {}
        },
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