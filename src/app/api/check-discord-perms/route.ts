import { NextResponse } from "next/server";

const DEV_ROLE_ID = "1573355148556763319";
const GANG_ROLE_ID = "1543700433099563099";

export async function POST(req: Request) {
  try {
    const { discordId, username } = await req.json();
    const botToken = process.env.DISCORD_BOT_TOKEN;
    let guildId = process.env.DISCORD_GUILD_ID || "";

    if (!botToken) {
      return NextResponse.json({ isDev: false, isGang: false, error: "No bot token" });
    }

    const headers = { Authorization: `Bot ${botToken}` };

    // التأكد من رقم السيرفر اللي البوت موجود فيه
    let guildValid = false;
    if (guildId) {
      const gCheck = await fetch(`https://discord.com/api/v10/guilds/${guildId}`, {
        headers,
        cache: "no-store",
      });
      guildValid = gCheck.ok;
    }
    if (!guildValid) {
      const guildsRes = await fetch("https://discord.com/api/v10/users/@me/guilds", {
        headers,
        cache: "no-store",
      });
      if (guildsRes.ok) {
        const guilds = await guildsRes.json();
        if (Array.isArray(guilds) && guilds.length > 0) guildId = guilds[0].id;
      }
    }

    if (!guildId) {
      return NextResponse.json({ isDev: false, isGang: false, error: "Bot not in server" });
    }

    let memberRoles: string[] = [];
    let resolvedDiscordId = discordId || "";

    // البحث بالـ Discord ID مباشرة (أسرع وأدق)
    if (resolvedDiscordId) {
      const mRes = await fetch(
        `https://discord.com/api/v10/guilds/${guildId}/members/${resolvedDiscordId}`,
        { headers, cache: "no-store" }
      );
      if (mRes.ok) {
        const mData = await mRes.json();
        memberRoles = mData.roles || [];
      }
    }

    // لو مش معانا الـ ID أو ملقيناهوش، ندور باليوزر نيم في السيرفر
    if (memberRoles.length === 0 && username) {
      const cleanName = String(username).toLowerCase().trim();
      const allRes = await fetch(
        `https://discord.com/api/v10/guilds/${guildId}/members?limit=1000`,
        { headers, cache: "no-store" }
      );
      if (allRes.ok) {
        const allMembers = await allRes.json();
        const found = allMembers.find((gm: any) => {
          const u = gm.user;
          if (!u || u.bot) return false;
          return (
            (u.username || "").toLowerCase() === cleanName ||
            (u.global_name || "").toLowerCase() === cleanName
          );
        });
        if (found) {
          memberRoles = found.roles || [];
          resolvedDiscordId = found.user.id;
        }
      }
    }

    const isDev = memberRoles.includes(DEV_ROLE_ID);
    const isGang = isDev || memberRoles.includes(GANG_ROLE_ID);

    return NextResponse.json({
      isDev,
      isGang,
      resolvedDiscordId,
    });
  } catch (err: any) {
    return NextResponse.json({ isDev: false, isGang: false, error: err.message });
  }
}