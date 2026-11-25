import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const DEV_ROLE_ID = "1573355148556763319";
const GANG_ROLE_ID = "1543700433099563099";

function formatDiscordMember(gm: any) {
  const u = gm.user;
  const roles: string[] = gm.roles || [];
  const isDev = roles.includes(DEV_ROLE_ID);
  const isGang = isDev || roles.includes(GANG_ROLE_ID);
  const avatarUrl = u.avatar
    ? `https://cdn.discordapp.com/avatars/${u.id}/${u.avatar}.${
        u.avatar.startsWith("a_") ? "gif" : "png"
      }?size=256`
    : `https://cdn.discordapp.com/embed/avatars/${
        Number(BigInt(u.id) >> BigInt(22)) % 6
      }.png`;

  return {
    discord_id: u.id,
    ic_name: gm.nick || u.global_name || u.username,
    discord_username: u.username,
    avatar_url: avatarUrl,
    isDev,
    isGang,
    roles_list: isDev ? ["Dev"] : ["Gang"],
    rank_name: isDev ? "Dev" : "Gang",
    rank_order: isDev ? 3 : 6,
    role: isDev ? "admin" : "member",
  };
}

export async function GET() {
  try {
    const botToken = process.env.DISCORD_BOT_TOKEN;
    if (!botToken) {
      return NextResponse.json({ members: [] });
    }

    const headers = { Authorization: `Bot ${botToken}` };
    const candidateGuildIds: string[] = [];

    if (process.env.DISCORD_GUILD_ID) {
      candidateGuildIds.push(process.env.DISCORD_GUILD_ID.trim());
    }

    const guildsRes = await fetch("https://discord.com/api/v10/users/@me/guilds", {
      headers,
      cache: "no-store",
    });
    if (guildsRes.ok) {
      const guilds = await guildsRes.json();
      if (Array.isArray(guilds)) {
        for (const g of guilds) {
          if (g?.id && !candidateGuildIds.includes(g.id)) {
            candidateGuildIds.push(g.id);
          }
        }
      }
    }

    for (const gId of candidateGuildIds) {
      const mRes = await fetch(
        `https://discord.com/api/v10/guilds/${gId}/members?limit=1000`,
        { headers, cache: "no-store" }
      );
      if (mRes.ok) {
        const allMembers = await mRes.json();
        if (Array.isArray(allMembers)) {
          const gangMembers = allMembers
            .filter((gm: any) => {
              const u = gm?.user;
              if (!u || u.bot) return false;
              const roles: string[] = gm.roles || [];
              return roles.includes(DEV_ROLE_ID) || roles.includes(GANG_ROLE_ID);
            })
            .map(formatDiscordMember);

          if (gangMembers.length > 0) {
            return NextResponse.json({ members: gangMembers, guildId: gId });
          }
        }
      }

      // بديل مباشر في حال عدم تفعيل Server Members Intent: فحص الأعضاء المسجلين بالـ discord_id
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const serviceKey =
        process.env.SUPABASE_SERVICE_ROLE_KEY ||
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      if (supabaseUrl && serviceKey) {
        const supabase = createClient(supabaseUrl, serviceKey);
        const { data: dbRows } = await supabase.from("members").select("discord_id");
        const ids = Array.from(
          new Set((dbRows || []).map((r: any) => r.discord_id).filter(Boolean))
        );
        const resolved: any[] = [];
        for (const dId of ids) {
          const singleRes = await fetch(
            `https://discord.com/api/v10/guilds/${gId}/members/${dId}`,
            { headers, cache: "no-store" }
          );
          if (singleRes.ok) {
            const gm = await singleRes.json();
            const roles: string[] = gm.roles || [];
            if (roles.includes(DEV_ROLE_ID) || roles.includes(GANG_ROLE_ID)) {
              resolved.push(formatDiscordMember(gm));
            }
          }
        }
        if (resolved.length > 0) {
          return NextResponse.json({ members: resolved, guildId: gId });
        }
      }
    }

    return NextResponse.json({ members: [] });
  } catch (err: any) {
    return NextResponse.json({ members: [], error: err.message });
  }
}