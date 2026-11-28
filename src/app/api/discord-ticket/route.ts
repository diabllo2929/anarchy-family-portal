import { NextResponse } from "next/server";

const DEFAULT_TICKET_WEBHOOK =
  "https://discord.com/api/webhooks/1574919119470596157/imq0vOP6T5eHeJO5T-9LLlddINRZHfzwWZb2cEQKVfWqu6KCUi5eVn5OjPxHPpghLDz6";

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
      category = "complaint_report",
      priority = "normal",
      subject = "",
      details = "",
      proofUrl = "",
      memberIcName = "عضو غير معروف",
      memberDiscordId = "",
      memberDiscordUsername = "",
      memberRank = "Gang",
    } = body;

    if (!String(details || "").trim()) {
      return NextResponse.json(
        { error: "يرجى كتابة تفاصيل التيكت أولاً" },
        { status: 400 }
      );
    }

    const webhookUrl =
      process.env.DISCORD_TICKET_WEBHOOK_URL || DEFAULT_TICKET_WEBHOOK;

    const meta = CATEGORY_META[category] || CATEGORY_META.complaint_report;
    const priorityText = PRIORITY_LABELS[priority] || PRIORITY_LABELS.normal;
    const ticketCode = `TKT-${Math.floor(1000 + Math.random() * 9000)}`;

    const memberDisplay = memberDiscordId
      ? `<@${memberDiscordId}> (**${memberIcName}**)`
      : `**${memberIcName}**${memberDiscordUsername ? ` (@${memberDiscordUsername})` : ""}`;

    const fields = [
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

    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: "ANARCHY TICKET SYSTEM",
        content: `🎫 **تيكت جديد وارد من البوابة** • \`#${ticketCode}\` | ${meta.emoji} **${meta.label}**`,
        embeds: [
          {
            title: `${meta.emoji} ${meta.label} — #${ticketCode}`,
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
      }),
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