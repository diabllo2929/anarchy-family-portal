import { NextResponse } from "next/server";

const APPLY_WEBHOOK_URL =
  process.env.DISCORD_APPLY_WEBHOOK_URL ||
  "https://discord.com/api/webhooks/1574929775129133136/N3mXHexvNH6vbzzkD_lCtAgIxFkPsoG8rtgQWUmPJUF6CMNhZ72emoNECZ9bRY2nNFwr";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      category = "family", // "family" | "clippers"
      realNameAge,
      icName,
      discordUsername,
      fivemHours,
      previousGangs,
      whyAnarchy,
      email,
    } = body;

    if (!icName || !discordUsername) {
      return NextResponse.json(
        { error: "بيانات التقديم ناقصة" },
        { status: 400 }
      );
    }

    const isClipper = category === "clippers";
    const title = isClipper
      ? "🎬 طلب تقديم جديد — قسم الكليبرز (ANARCHY)"
      : "🛡️ طلب تقديم جديد — دخول عيلة ANARCHY";

    const lines: string[] = [
      `@here`,
      ``,
      `**${title}**`,
      `━━━━━━━━━━━━━━━━━━`,
      `🎭 **الاسم IC / الكليبر:** ${icName}`,
      `👤 **الاسم الحقيقي والسن:** ${realNameAge || "غير محدد"}`,
      `💬 **يوزر الديسكورد:** ${discordUsername}`,
      `⏱️ **الساعات / الخبرة:** ${fivemHours || "غير محدد"}`,
    ];

    if (previousGangs) {
      lines.push(
        `${isClipper ? "🔗 **الأعمال / الحسابات السابقة:**" : "🏴 **العائلات السابقة:**"} ${previousGangs}`
      );
    }

    if (whyAnarchy) {
      lines.push(`📌 **السبب والإضافة:** ${whyAnarchy}`);
    }

    if (email) {
      lines.push(`📧 **البريد:** ${email}`);
    }

    lines.push(`━━━━━━━━━━━━━━━━━━`);
    lines.push(`*— بوابة التقديم الرسمية • ANARCHY*`);

    const res = await fetch(APPLY_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: "ANARCHY APPLICATIONS",
        content: lines.join("\n"),
        allowed_mentions: {
          parse: ["everyone", "roles", "users"],
        },
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      return NextResponse.json(
        { error: `Discord ${res.status}: ${errText}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Server error" },
      { status: 500 }
    );
  }
}