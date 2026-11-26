import { NextResponse } from "next/server";

const LOGS_WEBHOOK = process.env.DISCORD_LOGS_WEBHOOK_URL;
const WARNS_WEBHOOK = process.env.DISCORD_WARNS_WEBHOOK_URL;
const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
const GUILD_ID = process.env.DISCORD_GUILD_ID || "1512911336982581338";

const WARN_ROLE_MAP: Record<number, string> = {
  1: process.env.DISCORD_WARN_1_ROLE_ID || "1561170161539621004",
  2: process.env.DISCORD_WARN_2_ROLE_ID || "1561170414061756507",
  3: process.env.DISCORD_WARN_3_ROLE_ID || "1561170402116370472",
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
    return { id: null, debug: "Missing BOT_TOKEN or GUILD_ID" };
  }

  const rawQueries = [discordUsername, icName]
    .map((q) => (q || "").replace(/^@/, "").trim().toLowerCase())
    .filter(Boolean);

  if (rawQueries.length === 0) {
    return { id: null, debug: "No discordUsername or icName provided" };
  }

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

async function syncDiscordWarnRole(resolvedId: string, activeWarnCount: number) {
  if (!BOT_TOKEN || !GUILD_ID) {
    return { roleApplied: false, roleError: "Missing BOT_TOKEN or GUILD_ID" };
  }

  const targetLevel = activeWarnCount <= 0 ? 0 : Math.min(3, activeWarnCount);
  const targetRoleId = targetLevel > 0 ? WARN_ROLE_MAP[targetLevel] : null;

  let currentRoles: string[] | null = null;
  try {
    const memberRes = await fetch(
      `https://discord.com/api/v10/guilds/${GUILD_ID}/members/${resolvedId}`,
      {
        headers: { Authorization: `Bot ${BOT_TOKEN}` },
        cache: "no-store",
      }
    );
    if (memberRes.ok) {
      const memberData = await memberRes.json();
      if (Array.isArray(memberData.roles)) {
        currentRoles = memberData.roles;
      }
    }
  } catch {}

  for (const lvl of [1, 2, 3]) {
    if (lvl === targetLevel) continue;
    const oldRoleId = WARN_ROLE_MAP[lvl];
    if (!oldRoleId) continue;
    if (currentRoles && !currentRoles.includes(oldRoleId)) continue;

    try {
      await fetch(
        `https://discord.com/api/v10/guilds/${GUILD_ID}/members/${resolvedId}/roles/${oldRoleId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bot ${BOT_TOKEN}`,
            "X-Audit-Log-Reason": encodeURIComponent(
              `Anarchy Portal Warn Sync (Level ${targetLevel})`
            ),
          },
        }
      );
    } catch {}
  }

  if (!targetRoleId) {
    return { roleApplied: true, roleError: "" };
  }

  if (currentRoles && currentRoles.includes(targetRoleId)) {
    return { roleApplied: true, roleError: "" };
  }

  const putRes = await fetch(
    `https://discord.com/api/v10/guilds/${GUILD_ID}/members/${resolvedId}/roles/${targetRoleId}`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bot ${BOT_TOKEN}`,
        "X-Audit-Log-Reason": encodeURIComponent(
          `Anarchy Portal Warn #${targetLevel}`
        ),
      },
    }
  );

  if (!putRes.ok) {
    const errTxt = await putRes.text();
    console.error("Failed to assign warn role:", putRes.status, errTxt);
    return {
      roleApplied: false,
      roleError: `(${putRes.status}) ${errTxt}`,
    };
  }

  return { roleApplied: true, roleError: "" };
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

    if (category === "warn_sync") {
      const { id: resolvedId, debug: lookupDebug } = await findDiscordMemberId(
        targetDiscordId,
        targetDiscordUsername,
        targetIcName
      );

      let roleApplied = false;
      let roleError = "";
      const remainingCount = Math.max(0, Number(warnNumber) || 0);

      if (resolvedId) {
        const syncRes = await syncDiscordWarnRole(resolvedId, remainingCount);
        roleApplied = syncRes.roleApplied;
        roleError = syncRes.roleError;
      }

      if (LOGS_WEBHOOK && title) {
        await fetch(LOGS_WEBHOOK, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: "ANARCHY PORTAL \u2022 AUDIT LOG",
            embeds: [
              {
                title,
                description: description || undefined,
                color,
                fields: [
                  ...fields,
                  {
                    name: "\u0628\u0648\u0627\u0633\u0637\u0629",
                    value: actor || "System",
                    inline: true,
                  },
                ],
                footer: { text: "ANARCHY SYNDICATE \u2022 KAYAN CFW" },
                timestamp: new Date().toISOString(),
              },
            ],
          }),
        });
      }

      return NextResponse.json({
        ok: true,
        resolvedId,
        lookupDebug,
        roleApplied,
        roleError,
      });
    }

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

      if (resolvedId && BOT_TOKEN && GUILD_ID) {
        const syncRes = await syncDiscordWarnRole(resolvedId, warnNum);
        roleApplied = syncRes.roleApplied;
        roleError = syncRes.roleError;

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
                      title: `\u26A0\uFE0F \u062A\u062D\u0630\u064A\u0631 \u0631\u0633\u0645\u064A \u0645\u0646 \u0642\u064A\u0627\u062F\u0629 ANARCHY (Warn #${warnNum})`,
                      description: `\u062A\u0645 \u062A\u0633\u062C\u064A\u0644 \u062A\u062D\u0630\u064A\u0631 \u0639\u0644\u064A\u0643 \u0641\u064A \u0633\u064A\u0631\u0641\u0631 \u0627\u0644\u0639\u064A\u0644\u0629 \u0648\u062E\u0635\u0645 **3 \u0646\u0642\u0627\u0637** \u0645\u0646 \u0631\u0635\u064A\u062F\u0643.`,
                      color: 0xf59e0b,
                      fields: [
                        {
                          name: "\u0627\u0644\u0633\u0628\u0628",
                          value:
                            warnReason ||
                            "\u0645\u062E\u0627\u0644\u0641\u0629 \u0627\u0644\u0642\u0648\u0627\u0646\u064A\u0646",
                          inline: false,
                        },
                        {
                          name: "\u0628\u0648\u0627\u0633\u0637\u0629",
                          value: actor || "\u0627\u0644\u0625\u062F\u0627\u0631\u0629",
                          inline: true,
                        },
                        {
                          name: "\u062A\u0627\u0631\u064A\u062E \u0627\u0644\u0627\u0646\u062A\u0647\u0627\u0621",
                          value: expiresAt
                            ? new Date(expiresAt).toLocaleDateString("ar-EG")
                            : "\u0628\u0639\u062F 7 \u0623\u064A\u0627\u0645",
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
        title: `\uD83D\uDEA8 \u062A\u0645 \u062A\u0633\u062C\u064A\u0644 Warn #${warnNum} \u0639\u0644\u0649 ${
          targetIcName || "\u0639\u0636\u0648"
        }`,
        color: 0xf59e0b,
        fields: [
          {
            name: "\u0627\u0644\u0639\u0636\u0648",
            value: resolvedId
              ? `<@${resolvedId}> (${targetIcName || ""})`
              : targetIcName || targetDiscordUsername || "\u0639\u0636\u0648",
            inline: true,
          },
          {
            name: "\u0628\u0648\u0627\u0633\u0637\u0629 \u0627\u0644\u0623\u062F\u0645\u0646",
            value: actor || "\u0627\u0644\u0625\u062F\u0627\u0631\u0629",
            inline: true,
          },
          {
            name: "\u0627\u0644\u0639\u0642\u0648\u0628\u0629",
            value: `-3 \u0646\u0642\u0637 + \u0631\u0648\u0644 Warn ${warnNum}`,
            inline: true,
          },
          {
            name: "\u0627\u0644\u0633\u0628\u0628",
            value: warnReason || "\u063A\u064A\u0631 \u0645\u062D\u062F\u062F",
            inline: false,
          },
        ],
        footer: {
          text: `Role Warn ${warnNum}: ${
            roleApplied
              ? "\u062A\u0645 \u0627\u0644\u0625\u0636\u0627\u0641\u0629 \u2713"
              : "\u0644\u0645 \u064A\u064F\u0636\u0641"
          } \u2022 DM: ${
            dmSent
              ? "\u0648\u0635\u0644 \u0644\u0644\u0639\u0636\u0648 \u2713"
              : "\u0645\u063A\u0644\u0642"
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
            username: "ANARCHY SYNDICATE \u2022 DISCIPLINE",
            content: resolvedId
              ? `\u26A0\uFE0F <@${resolvedId}>`
              : `\u26A0\uFE0F **${
                  targetIcName || targetDiscordUsername || "\u0639\u0636\u0648"
                }**`,
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
        webhookError = "DISCORD_WARNS_WEBHOOK_URL missing";
      }

      if (LOGS_WEBHOOK && LOGS_WEBHOOK !== WARNS_WEBHOOK) {
        await fetch(LOGS_WEBHOOK, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: "ANARCHY PORTAL \u2022 AUDIT LOG",
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

    if (LOGS_WEBHOOK) {
      await fetch(LOGS_WEBHOOK, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: "ANARCHY PORTAL \u2022 AUDIT LOG",
          embeds: [
            {
              title:
                title ||
                "\u062A\u062D\u062F\u064A\u062B \u0641\u064A \u0627\u0644\u0646\u0638\u0627\u0645",
              description: description || undefined,
              color,
              fields: [
                ...fields,
                {
                  name: "\u0628\u0648\u0627\u0633\u0637\u0629",
                  value: actor || "System",
                  inline: true,
                },
              ],
              footer: { text: "ANARCHY SYNDICATE \u2022 KAYAN CFW" },
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