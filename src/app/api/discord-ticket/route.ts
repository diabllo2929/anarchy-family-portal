import { NextResponse } from "next/server";

const TICKET_CHANNEL_WEBHOOK =
  "https://discord.com/api/webhooks/1576291226162962472/RtxYBalTyJ-hFaMeDUDbrHHTQP9qAdO6sDy-qeWBtwGvv7wDv8M-VVTcQGqYGyaDJVbm";

const CATEGORY_META: Record<
  string,
  { label: string; emoji: string; color: number; tag: string }
> = {
  complaint_report: {
    label: "شكوى أو بلاغ داخلي",
    emoji: "⚠️",
    color: 0xdc2626,
    tag: "INTERNAL REPORT",
  },
  leave_excuse: {
    label: "طلب إجازة",
    emoji: "🛡️",
    color: 0x06b6d4,
    tag: "LEAVE REQUEST",
  },
  tech_support: {
    label: "مشكلة تقنية في الموقع أو الديسكورد",
    emoji: "🛠️",
    color: 0xa855f7,
    tag: "TECH & DISCORD",
  },
  general_inquiry: {
    label: "استفسار أو اقتراح لتطوير الموقع",
    emoji: "💡",
    color: 0x10b981,
    tag: "SUGGESTION & INQUIRY",
  },
};

const PRIORITY_LABELS: Record<string, string> = {
  normal: "🟢 عادي (Normal)",
  urgent: "🟠 عاجل (Urgent)",
  critical: "🔴 طارئ جداً (Critical)",
};

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      action = "created",
      ticketCode: incomingCode,
      category = "complaint_report",
      priority = "normal",
      subject = "",
      details = "",
      proofUrl = "",
      memberIcName = "عضو غير معروف",
      memberDiscordId = "",
      memberDiscordUsername = "",
      memberRank = "Gang",
      actorName = "",
      actorDiscordId = "",
      decision = "accepted",
      adminReply = "",
    } = body;

    const meta = CATEGORY_META[category] || CATEGORY_META.complaint_report;
    const ticketCode =
      incomingCode || `TKT-${Math.floor(1000 + Math.random() * 9000)}`;

    const memberDisplay = memberDiscordId
      ? `<@${memberDiscordId}> (**${memberIcName}**)`
      : `**${memberIcName}**${
          memberDiscordUsername ? ` (@${memberDiscordUsername})` : ""
        }`;

    const actorDisplay = actorDiscordId
      ? `<@${actorDiscordId}> (**${actorName}**)`
      : `**${actorName || "Dev"}**`;

    let payload: any;

    if (action === "claimed") {
      payload = {
        username: "ANARCHY TICKET SYSTEM",
        content: `✋ **تم استلام التيكت** \`#${ticketCode}\` بواسطة ${actorDisplay}`,
        embeds: [
          {
            title: `✋ استلام تيكت • #${ticketCode}`,
            description: `قام المطور ${actorDisplay} باستلام التيكت وجارٍ مراجعته والتعامل معه.`,
            color: 0x3b82f6,
            fields: [
              { name: "👤 صاحب التيكت", value: memberDisplay, inline: true },
              {
                name: "📂 القسم",
                value: `${meta.emoji} ${meta.label}`,
                inline: true,
              },
              { name: "🛠️ المستلم (Dev)", value: actorDisplay, inline: true },
            ],
            footer: {
              text: `ANARCHY SYNDICATE • Ticket #${ticketCode} • Claimed`,
            },
            timestamp: new Date().toISOString(),
          },
        ],
        allowed_mentions: { parse: ["users"] },
      };
    } else if (action === "decided") {
      const isAccepted = decision === "accepted";
      const statusTitle = isAccepted
        ? "✅ تمت الموافقة على التيكت"
        : "❌ تم رفض التيكت";
      const embedFields: any[] = [
        { name: "👤 صاحب التيكت", value: memberDisplay, inline: true },
        {
          name: "📂 القسم",
          value: `${meta.emoji} ${meta.label}`,
          inline: true,
        },
        {
          name: isAccepted
            ? "✅ تمت الموافقة بواسطة"
            : "❌ تم الرفض بواسطة",
          value: actorDisplay,
          inline: true,
        },
      ];

      if (String(subject || "").trim()) {
        embedFields.push({
          name: "📌 الموضوع",
          value: String(subject).trim(),
          inline: false,
        });
      }

      if (String(adminReply || "").trim()) {
        embedFields.push({
          name: "💬 رد الإدارة / السبب",
          value: String(adminReply).trim().slice(0, 900),
          inline: false,
        });
      }

      payload = {
        username: "ANARCHY TICKET SYSTEM",
        content: `${
          isAccepted ? "✅" : "❌"
        } **${statusTitle}** \`#${ticketCode}\` بواسطة ${actorDisplay} • ${
          memberDiscordId ? `<@${memberDiscordId}>` : memberIcName
        }`,
        embeds: [
          {
            title: `${statusTitle} — #${ticketCode}`,
            color: isAccepted ? 0x10b981 : 0xef4444,
            fields: embedFields,
            footer: {
              text: `ANARCHY SYNDICATE • Ticket #${ticketCode} • ${
                isAccepted ? "Accepted" : "Rejected"
              }`,
            },
            timestamp: new Date().toISOString(),
          },
        ],
        allowed_mentions: { parse: ["users"] },
      };
    } else if (action === "closed") {
      payload = {
        username: "ANARCHY TICKET SYSTEM",
        content: `🔒 **تم إغلاق وحل التيكت** \`#${ticketCode}\` بواسطة ${actorDisplay}`,
        embeds: [
          {
            title: `🔒 إغلاق تيكت • #${ticketCode}`,
            description: `تم حل المشكلة وإغلاق التيكت وحذفه من البوابة بواسطة ${actorDisplay}.`,
            color: 0x64748b,
            fields: [
              { name: "👤 صاحب التيكت", value: memberDisplay, inline: true },
              {
                name: "📂 القسم",
                value: `${meta.emoji} ${meta.label}`,
                inline: true,
              },
            ],
            footer: {
              text: `ANARCHY SYNDICATE • Ticket #${ticketCode} • Closed`,
            },
            timestamp: new Date().toISOString(),
          },
        ],
        allowed_mentions: { parse: ["users"] },
      };
    } else {
      if (!String(details || "").trim()) {
        return NextResponse.json(
          { error: "يرجى كتابة تفاصيل التيكت أولاً" },
          { status: 400 }
        );
      }

      const priorityText =
        PRIORITY_LABELS[priority] || PRIORITY_LABELS.normal;

      const fields: any[] = [
        {
          name: "👤 مقدم التيكت",
          value: memberDisplay,
          inline: true,
        },
        {
          name: "🎖️ الرتبة",
          value: String(memberRank || "Gang"),
          inline: true,
        },
        {
          name: "⚡ درجة الأهمية",
          value: priorityText,
          inline: true,
        },
        {
          name: "📂 نوع التيكت",
          value: `${meta.emoji} ${meta.label} (\`${meta.tag}\`)`,
          inline: false,
        },
      ];

      if (String(subject || "").trim()) {
        fields.push({
          name: "📌 عنوان الموضوع",
          value: String(subject).trim(),
          inline: false,
        });
      }

      fields.push({
        name: "📝 تفاصيل الرسالة",
        value: String(details).trim().slice(0, 1000),
        inline: false,
      });

      if (String(proofUrl || "").trim()) {
        fields.push({
          name: "🔗 رابط مرفق / دليل",
          value: String(proofUrl).trim(),
          inline: false,
        });
      }

      payload = {
        username: "ANARCHY TICKET SYSTEM",
        content: `🎫 **تيكت جديد وارد من البوابة** • \`#${ticketCode}\` | ${meta.emoji} **${meta.label}**`,
        embeds: [
          {
            title: `${meta.emoji} ${meta.label} — #${ticketCode}`,
            description:
              "حالة التيكت: **⏳ قيد المراجعة** — في انتظار استلام أحد مطوري (`Dev`) العيلة.",
            color: meta.color,
            fields,
            footer: {
              text: `ANARCHY SYNDICATE PORTAL • Ticket #${ticketCode}`,
            },
            timestamp: new Date().toISOString(),
          },
        ],
        allowed_mentions: {
          parse: ["users", "roles"],
        },
      };
    }

    const res = await fetch(TICKET_CHANNEL_WEBHOOK, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errText = await res.text();
      return NextResponse.json(
        { error: `فشل الإرسال للديسكورد (${res.status}): ${errText}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      ticketCode,
      categoryLabel: meta.label,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "حدث خطأ في السيرفر" },
      { status: 500 }
    );
  }
}