import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const ROLE_MAP: Record<string, string> = {
  Dev: "1573355148556763319",
  Leader: "1543701061951299664",
  Boss: "1543701842834362459",
  "Co-Boss": "1543701233590734888",
  Gang: "1543700433099563099",
};

const ADMIN_ROLES = ["Boss", "Co-Boss", "Dev", "Leader", "Manager"];
const ROLE_ORDER: Record<string, number> = {
  Boss: 1,
  "Co-Boss": 2,
  Dev: 3,
  Leader: 4,
  Manager: 5,
  Gang: 6,
  Streamer: 7,
  "زائر": 8,
};

async function resolveGuildId(botToken: string, envGuildId?: string) {
  if (envGuildId) {
    const check = await fetch(`https://discord.com/api/v10/guilds/${envGuildId}`, {
      headers: { Authorization: `Bot ${botToken}` },
      cache: "no-store",
    });
    if (check.ok) return envGuildId;
  }
  const guildsRes = await fetch("https://discord.com/api/v10/users/@me/guilds", {
    headers: { Authorization: `Bot ${botToken}` },
    cache: "no-store",
  });
  if (guildsRes.ok) {
    const guilds = await guildsRes.json();
    if (Array.isArray(guilds) && guilds.length > 0) return guilds[0].id;
  }
  return "";
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { action, discordId, rolesList } = body;

    const botToken = process.env.DISCORD_BOT_TOKEN;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!botToken || !supabaseUrl || !serviceKey) {
      return NextResponse.json({ error: "Missing env vars" }, { status: 500 });
    }

    const guildId = await resolveGuildId(botToken, process.env.DISCORD_GUILD_ID);
    if (!guildId) {
      return NextResponse.json({ error: "Bot not in guild" }, { status: 400 });
    }

    const headers = {
      Authorization: `Bot ${botToken}`,
      "Content-Type": "application/json",
    };

    // الحالة 1: تحديث رولات عضو في الديسكورد فوراً عند التعديل من لوحة تحكم الموقع
    if (action === "push" && discordId && Array.isArray(rolesList)) {
      const memberRes = await fetch(
        `https://discord.com/api/v10/guilds/${guildId}/members/${discordId}`,
        { headers, cache: "no-store" }
      );
      if (!memberRes.ok) {
        return NextResponse.json({ ok: false, reason: "Member not in Discord server" });
      }

      const memberData = await memberRes.json();
      const currentDiscordRoles: string[] = memberData.roles || [];

      for (const [label, roleId] of Object.entries(ROLE_MAP)) {
        const shouldHave = rolesList.includes(label);
        const hasIt = currentDiscordRoles.includes(roleId);

        if (shouldHave && !hasIt) {
          await fetch(
            `https://discord.com/api/v10/guilds/${guildId}/members/${discordId}/roles/${roleId}`,
            { method: "PUT", headers }
          );
        } else if (!shouldHave && hasIt) {
          await fetch(
            `https://discord.com/api/v10/guilds/${guildId}/members/${discordId}/roles/${roleId}`,
            { method: "DELETE", headers }
          );
        }
      }
      return NextResponse.json({ ok: true, mode: "pushed" });
    }

    // الحالة 2: سحب رولات الديسكورد وتحديث الموقع فوراً (عند فتح الموقع أو الضغط على مزامنة)
    const membersRes = await fetch(
      `https://discord.com/api/v10/guilds/${guildId}/members?limit=1000`,
      { headers, cache: "no-store" }
    );
    if (!membersRes.ok) {
      return NextResponse.json({ error: "Failed to fetch guild members" }, { status: 500 });
    }

    const guildMembers = await membersRes.json();
    const supabase = createClient(supabaseUrl, serviceKey);
    const { data: dbMembers } = await supabase.from("members").select("*");

    let syncedCount = 0;

    for (const m of dbMembers || []) {
      const uname = (m.discord_username || "").toLowerCase().trim();
      const match = guildMembers.find((gm: any) => {
        const u = gm.user;
        if (!u || u.bot) return false;
        return (
          (m.discord_id && u.id === m.discord_id) ||
          (uname &&
            ((u.username || "").toLowerCase() === uname ||
              (u.global_name || "").toLowerCase() === uname))
        );
      });

      if (!match) continue;

      const dRoles: string[] = match.roles || [];
      const existingRoles: string[] = Array.isArray(m.roles_list)
        ? m.roles_list
        : m.rank_name
        ? [m.rank_name]
        : ["زائر"];

      // نحتفظ بالرولات غير المربوطة بالديسكورد (مثل Streamer) ونحدث الرولات المربوطة حسب الديسكورد بالضبط
      const preservedRoles = existingRoles.filter((r) => !(r in ROLE_MAP) && r !== "زائر");
      const syncedDiscordRoles = Object.entries(ROLE_MAP)
        .filter(([, rId]) => dRoles.includes(rId))
        .map(([label]) => label);

      const finalRoles = Array.from(new Set([...syncedDiscordRoles, ...preservedRoles]));
      if (finalRoles.length === 0) finalRoles.push("زائر");

      finalRoles.sort((a, b) => (ROLE_ORDER[a] || 99) - (ROLE_ORDER[b] || 99));
      const highestRole = finalRoles[0];
      const hasAdmin = finalRoles.some((r) => ADMIN_ROLES.includes(r));
      const siteRole =
        finalRoles.includes("Dev") || finalRoles.includes("Boss")
          ? "super_admin"
          : hasAdmin
          ? "admin"
          : "member";

      await supabase
        .from("members")
        .update({
          discord_id: match.user.id,
          roles_list: finalRoles,
          rank_name: highestRole,
          rank_order: ROLE_ORDER[highestRole] || 8,
          role: siteRole,
        })
        .eq("id", m.id);

      syncedCount++;
    }

    return NextResponse.json({ ok: true, mode: "pulled", syncedCount });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}