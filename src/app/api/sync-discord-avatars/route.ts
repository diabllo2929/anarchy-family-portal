import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST() {
  try {
    const botToken = process.env.DISCORD_BOT_TOKEN;
    const envGuildId = process.env.DISCORD_GUILD_ID;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!botToken || !supabaseUrl || !serviceKey) {
      return NextResponse.json(
        { error: "متغير DISCORD_BOT_TOKEN أو Supabase ناقص في Vercel" },
        { status: 500 }
      );
    }

    const headers = { Authorization: `Bot ${botToken}` };
    let guildMembers: any[] = [];
    let resolvedGuildId = envGuildId || "";

    // محاولة جلب أعضاء السيرفر المحدد، ولو رجع Unknown Guild نجيب أول سيرفر البوت موجود فيه تلقائياً
    let discordRes = resolvedGuildId
      ? await fetch(
          `https://discord.com/api/v10/guilds/${resolvedGuildId}/members?limit=1000`,
          { headers, cache: "no-store" }
        )
      : null;

    if (!discordRes || !discordRes.ok) {
      const guildsRes = await fetch("https://discord.com/api/v10/users/@me/guilds", {
        headers,
        cache: "no-store",
      });
      if (guildsRes.ok) {
        const guilds = await guildsRes.json();
        if (Array.isArray(guilds) && guilds.length > 0) {
          resolvedGuildId = guilds[0].id;
          discordRes = await fetch(
            `https://discord.com/api/v10/guilds/${resolvedGuildId}/members?limit=1000`,
            { headers, cache: "no-store" }
          );
        }
      }
    }

    if (discordRes && discordRes.ok) {
      guildMembers = await discordRes.json();
    }

    const supabase = createClient(supabaseUrl, serviceKey);
    const { data: dbMembers } = await supabase.from("members").select("*");

    let updatedCount = 0;

    for (const m of dbMembers || []) {
      const uname = (m.discord_username || "").toLowerCase().trim();
      const ic = (m.ic_name || "").toLowerCase().trim();
      let matchedUser: any = null;

      if (guildMembers.length > 0) {
        const match = guildMembers.find((gm: any) => {
          const u = gm.user;
          if (!u || u.bot) return false;
          const gUser = (u.username || "").toLowerCase();
          const gGlobal = (u.global_name || "").toLowerCase();
          const gNick = (gm.nick || "").toLowerCase();

          return (
            (m.discord_id && u.id === m.discord_id) ||
            (uname &&
              (gUser === uname ||
                gGlobal === uname ||
                gNick.includes(uname) ||
                uname.includes(gUser))) ||
            (ic && (gNick.includes(ic) || gGlobal === ic || gUser === ic))
          );
        });
        if (match?.user) matchedUser = match.user;
      }

      // لو ملقيناهوش في السيرفر وعندنا discord_id بتاعه، نجيب بياناته وصورته مباشرة من Discord API
      if (!matchedUser && m.discord_id) {
        const uRes = await fetch(
          `https://discord.com/api/v10/users/${m.discord_id}`,
          { headers, cache: "no-store" }
        );
        if (uRes.ok) {
          matchedUser = await uRes.json();
        }
      }

      if (matchedUser) {
        const avatarUrl = matchedUser.avatar
          ? `https://cdn.discordapp.com/avatars/${matchedUser.id}/${matchedUser.avatar}.${
              matchedUser.avatar.startsWith("a_") ? "gif" : "png"
            }?size=256`
          : `https://cdn.discordapp.com/embed/avatars/${
              Number(BigInt(matchedUser.id) >> BigInt(22)) % 6
            }.png`;

        await supabase
          .from("members")
          .update({
            avatar_url: avatarUrl,
            discord_id: matchedUser.id,
            discord_username: matchedUser.username,
          })
          .eq("id", m.id);

        updatedCount++;
      }
    }

    if (updatedCount === 0 && guildMembers.length === 0) {
      return NextResponse.json(
        {
          error:
            "البوت مش مضاف في أي سيرفر ديسكورد أو محتاج تفعيل Server Members Intent في Discord Developer Portal",
        },
        { status: 400 }
      );
    }

    return NextResponse.json({ ok: true, updatedCount });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}