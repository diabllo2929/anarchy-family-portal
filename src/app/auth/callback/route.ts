import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

const GUILD_ID = process.env.DISCORD_GUILD_ID || "1512911336982581338";
const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN || "";

const DEV_ROLE_ID = "1573355148556763319";
const GANG_ROLE_ID = "1543700433099563099";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=no_code`);
  }

  const cookieStore = await cookies();
  const pendingCookies: { name: string; value: string; options: any }[] = [];

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            const persistentOpts = {
              ...options,
              maxAge: 60 * 60 * 24 * 365,
              path: "/",
              sameSite: "lax" as const,
              secure: true,
            };
            pendingCookies.push({ name, value, options: persistentOpts });
            try {
              cookieStore.set(name, value, persistentOpts);
            } catch {}
          });
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

  let siteRole: "super_admin" | "admin" | "member" = "member";
  let rankName = "زائر";
  let rankOrder = 99;
  let rolesList = ["زائر"];

  if (hasDevRole) {
    siteRole = "super_admin";
    rankName = "Dev";
    rankOrder = 3;
    rolesList = ["Dev"];
  } else if (hasGangRole) {
    siteRole = "member";
    rankName = "Gang";
    rankOrder = 6;
    rolesList = ["Gang"];
  }

  const { data: existingMember } = await supabase
    .from("members")
    .select("*")
    .or(
      discordId
        ? `user_id.eq.${user.id},discord_id.eq.${discordId},email.eq.${email}`
        : `user_id.eq.${user.id},email.eq.${email}`
    )
    .maybeSingle();

  const resolvedIcName =
    serverNick || existingMember?.ic_name || discordUsername || email.split("@")[0];

  if (existingMember) {
    const existingRoles: string[] = Array.isArray(existingMember.roles_list)
      ? existingMember.roles_list.filter((r: string) => r !== "زائر")
      : [];
    const mergedRoles = Array.from(
      new Set([
        ...(hasDevRole ? ["Dev"] : []),
        ...(hasGangRole && !hasDevRole ? ["Gang"] : []),
        ...existingRoles,
      ])
    );
    const finalRoles = mergedRoles.length > 0 ? mergedRoles : rolesList;

    await supabase
      .from("members")
      .update({
        user_id: user.id,
        discord_id: discordId,
        discord_username: discordUsername,
        avatar_url: avatarUrl || existingMember.avatar_url,
        role: hasDevRole ? "super_admin" : existingMember.role || "member",
        rank_name: hasDevRole ? "Dev" : hasGangRole ? "Gang" : existingMember.rank_name,
        rank_order: hasDevRole ? 3 : hasGangRole ? 6 : existingMember.rank_order,
        roles_list: finalRoles,
      })
      .eq("id", existingMember.id);
  } else if (hasDevRole || hasGangRole) {
    await supabase.from("members").insert({
      user_id: user.id,
      email: discordId ? `${discordId}@anarchy.discord` : email,
      ic_name: resolvedIcName,
      discord_id: discordId,
      discord_username: discordUsername,
      avatar_url: avatarUrl,
      rank_name: rankName,
      rank_order: rankOrder,
      roles_list: rolesList,
      role: siteRole,
      points: 0,
      tasks_completed_count: 0,
    });
  }

  const response = NextResponse.redirect(`${origin}/`);
  for (const c of pendingCookies) {
    response.cookies.set(c.name, c.value, c.options);
  }
  return response;
}