import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const DEV_ROLE_ID = "1573355148556763319";
const GANG_ROLE_ID = "1543700433099563099";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId, email, discordId, username, oauthAvatar, oauthName } = body;

    const botToken = process.env.DISCORD_BOT_TOKEN;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!botToken || !supabaseUrl || !serviceKey) {
      return NextResponse.json({ isDev: false, isGang: false, debug: "Missing env" });
    }

    const headers = { Authorization: `Bot ${botToken}` };

    // جلب كل السيرفرات التي يوجد بها البوت حتى لا يختار سيرفراً خاطئاً
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

    let memberRoles: string[] = [];
    let discordUserObj: any = null;
    let resolvedDiscordId = (discordId || "").trim();
    let matchedGuildId = "";

    // البحث في كل السيرفرات عن العضو بالـ ID أو باليوزر
    for (const gId of candidateGuildIds) {
      if (resolvedDiscordId) {
        const mRes = await fetch(
          `https://discord.com/api/v10/guilds/${gId}/members/${resolvedDiscordId}`,
          { headers, cache: "no-store" }
        );
        if (mRes.ok) {
          const mData = await mRes.json();
          memberRoles = mData.roles || [];
          discordUserObj = mData.user;
          matchedGuildId = gId;
          if (memberRoles.includes(DEV_ROLE_ID) || memberRoles.includes(GANG_ROLE_ID)) {
            break;
          }
        }
      }

      const searchNames = [username, oauthName]
        .filter(Boolean)
        .map((s) => String(s).toLowerCase().trim());

      if (searchNames.length > 0 && (!discordUserObj || memberRoles.length === 0)) {
        const allRes = await fetch(
          `https://discord.com/api/v10/guilds/${gId}/members?limit=1000`,
          { headers, cache: "no-store" }
        );
        if (allRes.ok) {
          const allMembers = await allRes.json();
          const found = allMembers.find((gm: any) => {
            const u = gm.user;
            if (!u || u.bot) return false;
            return (
              searchNames.includes((u.username || "").toLowerCase()) ||
              searchNames.includes((u.global_name || "").toLowerCase()) ||
              searchNames.includes((gm.nick || "").toLowerCase())
            );
          });
          if (found) {
            memberRoles = found.roles || [];
            discordUserObj = found.user;
            resolvedDiscordId = found.user.id;
            matchedGuildId = gId;
            if (memberRoles.includes(DEV_ROLE_ID) || memberRoles.includes(GANG_ROLE_ID)) {
              break;
            }
          }
        }
      }
    }

    if (!discordUserObj && resolvedDiscordId) {
      const uRes = await fetch(
        `https://discord.com/api/v10/users/${resolvedDiscordId}`,
        { headers, cache: "no-store" }
      );
      if (uRes.ok) discordUserObj = await uRes.json();
    }

    const isDev = memberRoles.includes(DEV_ROLE_ID);
    const isGang = isDev || memberRoles.includes(GANG_ROLE_ID);

    const finalDiscordId = discordUserObj?.id || resolvedDiscordId || null;
    const finalDiscordUsername =
      discordUserObj?.username || username || oauthName || null;

    let finalAvatarUrl = oauthAvatar || null;
    if (discordUserObj?.id) {
      finalAvatarUrl = discordUserObj.avatar
        ? `https://cdn.discordapp.com/avatars/${discordUserObj.id}/${discordUserObj.avatar}.${
            discordUserObj.avatar.startsWith("a_") ? "gif" : "png"
          }?size=256`
        : `https://cdn.discordapp.com/embed/avatars/${
            Number(BigInt(discordUserObj.id) >> BigInt(22)) % 6
          }.png`;
    }

    const supabase = createClient(supabaseUrl, serviceKey);
    const { data: existingMembers } = await supabase.from("members").select("*");

    const existing = (existingMembers || []).find(
      (m: any) =>
        (userId && m.user_id === userId) ||
        (finalDiscordId && m.discord_id === finalDiscordId) ||
        (email && m.email && m.email.toLowerCase() === String(email).toLowerCase()) ||
        (finalDiscordUsername &&
          m.discord_username &&
          m.discord_username.toLowerCase() === finalDiscordUsername.toLowerCase())
    );

    let updatedMember = existing || null;

    if (existing) {
      const currentRoles: string[] = Array.isArray(existing.roles_list)
        ? [...existing.roles_list]
        : existing.rank_name
        ? [existing.rank_name]
        : [];

      let nextRoles = currentRoles.filter((r) => r !== "Dev" && r !== "Gang" && r !== "زائر");
      if (isDev) nextRoles.unshift("Dev");
      if (isGang && !isDev) nextRoles.unshift("Gang");
      if (isDev && memberRoles.includes(GANG_ROLE_ID)) nextRoles.push("Gang");
      if (nextRoles.length === 0) nextRoles = ["زائر"];

      const patch: any = {
        ...(userId ? { user_id: userId } : {}),
        ...(finalDiscordId ? { discord_id: finalDiscordId } : {}),
        ...(finalDiscordUsername ? { discord_username: finalDiscordUsername } : {}),
        ...(finalAvatarUrl ? { avatar_url: finalAvatarUrl } : {}),
        roles_list: nextRoles,
        rank_name: nextRoles[0],
        rank_order: isDev ? 3 : isGang ? 6 : 8,
        role: isDev ? "super_admin" : isGang ? "member" : "visitor",
      };

      const { data: saved } = await supabase
        .from("members")
        .update(patch)
        .eq("id", existing.id)
        .select()
        .single();

      if (saved) updatedMember = saved;
    } else if (isGang || isDev) {
      const autoRoles = isDev ? ["Dev"] : ["Gang"];
      const { data: inserted } = await supabase
        .from("members")
        .insert({
          user_id: userId || null,
          email: email || `${finalDiscordId || Date.now()}@discord.user`,
          ic_name:
            discordUserObj?.global_name ||
            oauthName ||
            finalDiscordUsername ||
            "Anarchy Member",
          discord_username: finalDiscordUsername || "Discord User",
          discord_id: finalDiscordId,
          avatar_url: finalAvatarUrl,
          rank_name: autoRoles[0],
          rank_order: isDev ? 3 : 6,
          roles_list: autoRoles,
          role: isDev ? "super_admin" : "member",
          points: 0,
        })
        .select()
        .single();

      if (inserted) updatedMember = inserted;
    }

    return NextResponse.json({
      isDev,
      isGang,
      resolvedDiscordId: finalDiscordId,
      member: updatedMember,
      debug: {
        matchedGuildId,
        candidateGuildIds,
        foundRolesCount: memberRoles.length,
        memberRoles,
        sentDiscordId: discordId,
        sentUsername: username,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ isDev: false, isGang: false, error: err.message });
  }
}