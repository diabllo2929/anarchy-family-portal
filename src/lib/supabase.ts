import { createBrowserClient } from "@supabase/ssr";

export type Member = any;
export type MemberWarn = any;
export type FamilySetting = any;
export type WeeklyTask = any;
export type TaskSubmission = any;
export type WeaponLog = any;
export type GalleryPhoto = any;
export type Application = any;

function safeDecode(val: string): string {
  try {
    return decodeURIComponent(val);
  } catch {
    return val;
  }
}

function parseBrowserCookies(): { name: string; value: string }[] {
  if (typeof document === "undefined" || !document.cookie) return [];
  return document.cookie
    .split(";")
    .map((part) => {
      const eqIdx = part.indexOf("=");
      if (eqIdx === -1) return { name: part.trim(), value: "" };
      return {
        name: safeDecode(part.slice(0, eqIdx).trim()),
        value: safeDecode(part.slice(eqIdx + 1)),
      };
    })
    .filter((c) => Boolean(c.name));
}

function restoreBackedUpAuthCookies() {
  if (typeof window === "undefined" || typeof document === "undefined") return;
  try {
    if ((window as any).__anarchyExplicitSignOut) return;
    const current = parseBrowserCookies();
    const hasSbAuth = current.some(
      (c) => c.name.startsWith("sb-") && c.name.includes("-auth-token") && Boolean(c.value)
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
          const isExplicitLogout = Boolean(
            typeof window !== "undefined" && (window as any).__anarchyExplicitSignOut
          );
          const secureFlag =
            typeof window !== "undefined" && window.location.protocol === "https:"
              ? "; Secure"
              : "";

          cookiesToSet.forEach(({ name, value, options }) => {
            const isClearing = options?.maxAge === 0 || !value;
            if (isClearing && !isExplicitLogout && name.startsWith("sb-")) {
              return;
            }
            const maxAge = isClearing ? 0 : 60 * 60 * 24 * 365;
            document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(
              value
            )}; path=${options?.path || "/"}; max-age=${maxAge}; SameSite=Lax${secureFlag}`;
          });

          try {
            if (isExplicitLogout) {
              window.localStorage.removeItem("anarchy_sb_cookies_v1");
              return;
            }
            const latestCookies = parseBrowserCookies();
            const cleanBackup: Record<string, string> = {};
            for (const c of latestCookies) {
              if (c.name.startsWith("sb-") && c.value) {
                cleanBackup[c.name] = c.value;
              }
            }
            if (Object.keys(cleanBackup).length > 0) {
              window.localStorage.setItem("anarchy_sb_cookies_v1", JSON.stringify(cleanBackup));
            }
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