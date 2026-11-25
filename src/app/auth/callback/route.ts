import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

const GUILD_ID = process.env.DISCORD_GUILD_ID || "1512911336982581338";
const BOT_TOKEN =
  process.env.DISCORD_BOT_TOKEN ||
  "process.env.DISCORD_BOT_TOKEN";

// Role IDs من سيرفر ANARCHY
const DEV_ROLE_ID = "1573355148556763319";
const GANG_ROLE_ID = "1543700433099563099";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=no_code`);
  }

  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: sessionData, error: sessionError } =
    await supabase.auth.exchangeCodeForSession(code);

  if (sessionError || !sessionData.user) {
    return NextResponse.redirect(`${origin}/login?error=auth_failed`);
  }

  const user = sessionData.user;
  const email = (user.email || "").toLowerCase();
  const meta = user.user_metadata || {};

  // استخراج بيانات الديسكورد
  const discordIdentity = user.identities?.find((i) => i.provider === "discord");
  const discordId: string | null =
    discordIdentity?.id || meta.provider_id || meta.sub || null;
  const discordUsername: string =
    meta.custom_claims?.global_name ||
    meta.full_name ||
    meta.user_name ||
    meta.name ||
    email.split("@")[0];
  const avatarUrl: string | null = meta.avatar_url || meta.picture || null;

  // فحص رولات العضو داخل سيرفر ديسكورد العيلة عبر البوت
  let memberRoleIds: string[] = [];
  let serverNick: string | null = null;

  if (discordId && BOT_TOKEN && GUILD_ID) {
    try {
      const guildMemberRes = await fetch(
        `https://discord.com/api/v10/guilds/${GUILD_ID}/members/${discordId}`,
        {
          headers: { Authorization: `Bot ${BOT_TOKEN}` },
          cache: "no-store",
        }
      );

      if (guildMemberRes.ok) {
        const guildMember = await guildMemberRes.json();
        memberRoleIds = Array.isArray(guildMember.roles) ? guildMember.roles : [];
        serverNick = guildMember.nick || null;
      }
    } catch (err) {
      console.error("Discord role check error:", err);
    }
  }

  const hasDevRole = memberRoleIds.includes(DEV_ROLE_ID);
  const hasGangRole = memberRoleIds.includes(GANG_ROLE_ID);

  // تحديد الصلاحية والرتبة بناءً على رول الديسكورد
  let siteRole: "super_admin" | "admin" | "member" = "member";
  let rankName = "Guest / Applicant";
  let rankOrder = 99;

  if (hasDevRole) {
    siteRole = "super_admin";
    rankName = "Dev";
    rankOrder = 3;
  } else if (hasGangRole) {
    siteRole = "member";
    rankName = "Soldier";
    rankOrder = 7;
  } else {
    siteRole = "member";
    rankName = "Guest / Applicant";
    rankOrder = 99;
  }

  // التحقق هل العضو مسجل مسبقاً في جدول members أم تسجيل جديد
  const { data: existingMember } = await supabase
    .from("members")
    .select("*")
    .or(`user_id.eq.${user.id},email.eq.${email}`)
    .maybeSingle();

  const resolvedIcName =
    existingMember?.ic_name || serverNick || discordUsername || email.split("@")[0];

  if (existingMember) {
    // تحديث بياناته ورتبته تلقائياً لو رولاته في الديسكورد اتغيرت
    const updatedRole = hasDevRole
      ? "super_admin"
      : existingMember.role === "admin" || existingMember.role === "super_admin"
      ? existingMember.role
      : "member";

    const updatedRankName = hasDevRole
      ? existingMember.rank_order < 3
        ? existingMember.rank_name
        : "Dev"
      : hasGangRole
      ? existingMember.rank_order >= 90
        ? "Soldier"
        : existingMember.rank_name
      : existingMember.rank_name;

    const updatedRankOrder = hasDevRole
      ? Math.min(existingMember.rank_order, 3)
      : hasGangRole
      ? existingMember.rank_order >= 90
        ? 7
        : existingMember.rank_order
      : existingMember.rank_order;

    await supabase
      .from("members")
      .update({
        user_id: user.id,
        discord_id: discordId,
        discord_username: discordUsername,
        avatar_url: avatarUrl || existingMember.avatar_url,
        role: updatedRole,
        rank_name: updatedRankName,
        rank_order: updatedRankOrder,
      })
      .eq("id", existingMember.id);
  } else {
    // إدراج العضو الجديد في جدول members
    await supabase.from("members").insert({
      user_id: user.id,
      email,
      ic_name: resolvedIcName,
      discord_id: discordId,
      discord_username: discordUsername,
      avatar_url: avatarUrl,
      rank_name: rankName,
      rank_order: rankOrder,
      role: siteRole,
      points: 0,
      tasks_completed_count: 0,
    });
  }

  return NextResponse.redirect(`${origin}/`);
}