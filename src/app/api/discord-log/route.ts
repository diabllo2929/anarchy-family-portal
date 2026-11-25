import { NextResponse } from "next/server";

const LOGS_WEBHOOK = process.env.DISCORD_LOGS_WEBHOOK_URL;
const WARNS_WEBHOOK = process.env.DISCORD_WARNS_WEBHOOK_URL;
const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
const GUILD_ID = process.env.DISCORD_GUILD_ID;

const WARN_ROLE_MAP: Record<number, string | undefined> = {
  1: process.env.DISCORD_WARN_1_ROLE_ID,
  2: process.env.DISCORD_WARN_2_ROLE_ID,
  3: process.env.DISCORD_WARN_3_ROLE_ID,
};

async function findDiscordMemberId(
  discordId?: string | null,
  discordUsername?: string | null,
  icName?: string | null
): Promise<{ id: string | null; debug: string }> {
  if (discordId && /^\d{17,20}$/.test(discordId.trim())) {
    return { id: discordId.trim(), debug: "Matched from DB discord_id" };
  }
  if (!BOT_TOKEN || !GUILD_ID) {
    return { id: null, debug: "Missing BOT_TOKEN or GUILD_ID in .env.local" };
  }

  const rawQueries = [discordUsername, icName]
    .map((q) => (q || "").replace(/^@/, "").trim().toLowerCase())
    .filter(Boolean);

  if (rawQueries.length === 0) {
    return { id: null, debug: "No discordUsername or icName provided" };
  }

  // المحاولة 1: البحث المباشر في السيرفر
  for (const q of rawQueries) {
    try {
      const res = await fetch(
        `https://discord.com/api/v10/guilds/${GUILD_ID}/members/search?query=${encodeURIComponent(
          q
        )}&limit=10`,
        {
          headers: { Authorization: `Bot ${BOT_TOKEN}` },
        }
      );
      if (res.ok) {
        const members = await res.json();
        if (Array.isArray(members) && members.length > 0) {
          const exact = members.find(
            (m: any) =>
              m.user?.username?.toLowerCase() === q ||
              m.user?.global_name?.toLowerCase() === q ||
              m.nick?.toLowerCase()?.includes(q)
          );
          const chosen = exact || members[0];
          if (chosen?.user?.id) {
            return { id: chosen.user.id, debug: `Found via search (${q})` };
          }
        }
      }
    } catch {}
  }

  // المحاولة 2: جلب الأعضاء ومطابقتهم يدوياً (يعمل مع Server Members Intent)
  try {
    const listRes = await fetch(
      `https://discord.com/api/v10/guilds/${GUILD_ID}/members?limit=1000`,
      {
        headers: { Authorization: `Bot ${BOT_TOKEN}` },
      }
    );
    if (listRes.ok) {
      const allMembers = await listRes.json();
      if (Array.isArray(allMembers)) {
        const match = allMembers.find((m: any) => {
          const u = (m.user?.username || "").toLowerCase();
          const g = (m.user?.global_name || "").toLowerCase();
          const n = (m.nick || "").toLowerCase();
          return rawQueries.some(
            (q) => u === q || g === q || n.includes(q) || u.includes(q)
          );
        });
        if (match?.user?.id) {
          return { id: match.user.id, debug: "Found via guild members list" };
        }
      }
    } else {
      const errTxt = await listRes.text();
      return {
        id: null,
        debug: `Discord API Members List Error (${listRes.status}): ${errTxt}`,
      };
    }
  } catch (e: any) {
    return { id: null, debug: `Fetch error: ${e.message}` };
  }

  return {
    id: null,
    debug: `Member not found in guild for queries: ${rawQueries.join(", ")}`,
  };
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      category = "log",
      title,
      description,
      actor,
      color = 0xdc2626,
      fields = [],
      targetDiscordId,
      targetDiscordUsername,
      targetIcName,
      warnNumber,
      warnReason,
      expiresAt,
    } = body;

    if (category === "warn") {
      const { id: resolvedId, debug: lookupDebug } = await findDiscordMemberId(
        targetDiscordId,
        targetDiscordUsername,
        targetIcName
      );

      let roleApplied = false;
      let roleError = "";
      let dmSent = false;

      const warnNum = Math.min(3, Math.max(1, Number(warnNumber) || 1));
      const roleId = WARN_ROLE_MAP[warnNum];

      if (resolvedId && BOT_TOKEN && GUILD_ID) {
        if (roleId) {
          const roleRes = await fetch(
            `https://discord.com/api/v10/guilds/${GUILD_ID}/members/${resolvedId}/roles/${roleId}`,
            {
              method: "PUT",
              headers: {
                Authorization: `Bot ${BOT_TOKEN}`,
                "X-Audit-Log-Reason": encodeURIComponent(
                  `Anarchy Portal Warn #${warnNum}`
                ),
              },
            }
          );
          roleApplied = roleRes.ok;
          if (!roleRes.ok) {
            roleError = `(${roleRes.status}) ${await roleRes.text()}`;
            console.error("Failed to assign warn role:", roleError);
          }
        } else {
          roleError = `No Role ID configured for Warn #${warnNum}`;
        }

        // إرسال رسالة خاصة للعضو (DM)
        try {
          const dmChannelRes = await fetch(
            `https://discord.com/api/v10/users/@me/channels`,
            {
              method: "POST",
              headers: {
                Authorization: `Bot ${BOT_TOKEN}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ recipient_id: resolvedId }),
            }
          );
          if (dmChannelRes.ok) {
            const dmChannel = await dmChannelRes.json();
            const sendDmRes = await fetch(
              `https://discord.com/api/v10/channels/${dmChannel.id}/messages`,
              {
                method: "POST",
                headers: {
                  Authorization: `Bot ${BOT_TOKEN}`,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  embeds: [
                    {
                      title: `⚠️ تحذير رسمي من قيادة ANARCHY (Warn #${warnNum})`,
                      description: `تم تسجيل تحذير عليك في سيرفر العيلة وخصم **3 نقاط** من رصيدك.`,
                      color: 0xf59e0b,
                      fields: [
                        {
                          name: "السبب",
                          value: warnReason || "مخالفة القوانين",
                          inline: false,
                        },
                        {
                          name: "بواسطة",
                          value: actor || "الإدارة",
                          inline: true,
                        },
                        {
                          name: "تاريخ الانتهاء",
                          value: expiresAt
                            ? new Date(expiresAt).toLocaleDateString("ar-EG")
                            : "بعد 7 أيام",
                          inline: true,
                        },
                      ],
                      timestamp: new Date().toISOString(),
                    },
                  ],
                }),
              }
            );
            dmSent = sendDmRes.ok;
          }
        } catch {}
      }

      const warnEmbed = {
        title: `🚨 تم تسجيل Warn #${warnNum} على ${targetIcName || "عضو"}`,
        color: 0xf59e0b,
        fields: [
          {
            name: "العضو",
            value: resolvedId
              ? `<@${resolvedId}> (${targetIcName || ""})`
              : targetIcName || targetDiscordUsername || "عضو",
            inline: true,
          },
          { name: "بواسطة الأدمن", value: actor || "الإدارة", inline: true },
          { name: "العقوبة", value: "-3 نقاط + رول تحذير أسبوع", inline: true },
          { name: "السبب", value: warnReason || "غير محدد", inline: false },
        ],
        footer: {
          text: `Role: ${roleApplied ? "تم الإضافة ✓" : "لم يُضف"} • DM: ${
            dmSent ? "وصل للعضو ✓" : "مغلق"
          }`,
        },
        timestamp: new Date().toISOString(),
      };

      let webhookOk = false;
      let webhookError = "";

      if (WARNS_WEBHOOK) {
        const wRes = await fetch(WARNS_WEBHOOK, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: "ANARCHY SYNDICATE • DISCIPLINE",
            content: resolvedId
              ? `⚠️ <@${resolvedId}>`
              : `⚠️ **${targetIcName || targetDiscordUsername || "عضو"}**`,
            allowed_mentions: { parse: ["users"] },
            embeds: [warnEmbed],
          }),
        });
        webhookOk = wRes.ok;
        if (!wRes.ok) {
          webhookError = await wRes.text();
          console.error("WARNS_WEBHOOK error:", webhookError);
        }
      } else {
        webhookError = "DISCORD_WARNS_WEBHOOK_URL missing in .env.local";
      }

      if (LOGS_WEBHOOK && LOGS_WEBHOOK !== WARNS_WEBHOOK) {
        await fetch(LOGS_WEBHOOK, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: "ANARCHY PORTAL • AUDIT LOG",
            embeds: [warnEmbed],
          }),
        });
      }

      return NextResponse.json({
        ok: true,
        resolvedId,
        lookupDebug,
        roleApplied,
        roleError,
        dmSent,
        webhookOk,
        webhookError,
      });
    }

    // أي لوج عادي
    if (LOGS_WEBHOOK) {
      await fetch(LOGS_WEBHOOK, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: "ANARCHY PORTAL • AUDIT LOG",
          embeds: [
            {
              title: title || "تحديث في النظام",
              description: description || undefined,
              color,
              fields: [
                ...fields,
                { name: "بواسطة", value: actor || "System", inline: true },
              ],
              footer: { text: "ANARCHY SYNDICATE • KAYAN CFW" },
              timestamp: new Date().toISOString(),
            },
          ],
        }),
      });
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("discord-log route crash:", err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}