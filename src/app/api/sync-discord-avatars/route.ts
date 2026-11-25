import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST() {
  try {
    const botToken = process.env.DISCORD_BOT_TOKEN;
    const guildId = process.env.DISCORD_GUILD_ID;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!botToken || !guildId || !supabaseUrl || !serviceKey) {
      return NextResponse.json(
        { error: "متغيرات الديسكورد أو Supabase ناقصة في Vercel" },
        { status: 500 }
      );
    }

    const discordRes = await fetch(
      `https://discord.com/api/v10/guilds/${guildId}/members?limit=1000`,
      {
        headers: { Authorization: `Bot ${botToken}` },
        cache: "no-store",
      }
    );

    if (!discordRes.ok) {
      const errText = await discordRes.text();
      return NextResponse.json(
        { error: `Discord API Error: ${errText}` },
        { status: 500 }
      );
    }

    const guildMembers = await discordRes.json();
    const supabase = createClient(supabaseUrl, serviceKey);
    const { data: dbMembers } = await supabase.from("members").select("*");

    let updatedCount = 0;

    for (const m of dbMembers || []) {
      const uname = (m.discord_username || "").toLowerCase().trim();
      const ic = (m.ic_name || "").toLowerCase().trim();

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

      if (match?.user) {
        const u = match.user;
        const avatarUrl = u.avatar
          ? `https://cdn.discordapp.com/avatars/${u.id}/${u.avatar}.${
              u.avatar.startsWith("a_") ? "gif" : "png"
            }?size=256`
          : `https://cdn.discordapp.com/embed/avatars/${
              Number(BigInt(u.id) >> BigInt(22)) % 6
            }.png`;

        await supabase
          .from("members")
          .update({
            avatar_url: avatarUrl,
            discord_id: u.id,
            discord_username: u.username,
          })
          .eq("id", m.id);

        updatedCount++;
      }
    }

    return NextResponse.json({ ok: true, updatedCount });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}