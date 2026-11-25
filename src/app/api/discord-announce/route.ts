import { NextResponse } from "next/server";

const CHANNEL_WEBHOOKS: Record<string, { label: string; url: string }> = {
  gang_ann: {
    label: "Gang Announcement",
    url: "https://discord.com/api/webhooks/1574922189180768398/sUCcNJDgNdOeOyvLwTURU6P9BQFWwtHnBF8sDvNNcHXHMSlNHUOJSnF_VTjBDzzSr3LE",
  },
  server_ann: {
    label: "Announcement كل السيرفر",
    url: "https://discord.com/api/webhooks/1574918787562733780/QTDBUuDvxTicEj02p1ot37hchwz_shwfgNb7ivdMiLHIJgb4sUY6F2qfgs5De1D5gQWN",
  },
  family_chat: {
    label: "شات العيلة",
    url: "https://discord.com/api/webhooks/1574918886208307262/GYcLHRE549RxbtuNXWP-n5rvrc0OgENLbvykL43qBMohxpBL19AjpUJNqciMb6bV8gAm",
  },
  admin_chat: {
    label: "شات الأدمن",
    url: "https://discord.com/api/webhooks/1574919119470596157/imq0vOP6T5eHeJO5T-9LLlddINRZHfzwWZb2cEQKVfWqu6KCUi5eVn5OjPxHPpghLDz6",
  },
  task_system: {
    label: "التاسك سيستم",
    url: "https://discord.com/api/webhooks/1574919424513671258/XfJwvlWgMZnPZY9JaI35lvHzNxk4I7w31x3DMR7NQXSHbzHFPH-7lzmkKrVdMho3W68w",
  },
};

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      title,
      mention = "@everyone",
      message,
      location,
      time,
      actor,
      channels = ["gang_ann"],
    } = body;

    if (!title || !message) {
      return NextResponse.json(
        { error: "العنوان ونص الرسالة مطلوبان" },
        { status: 400 }
      );
    }

    const selectedKeys: string[] =
      Array.isArray(channels) && channels.length > 0 ? channels : ["gang_ann"];

    const mentionText =
      mention && mention !== "none" ? `${mention}\n\n` : "";

    let formattedContent = `${mentionText}**📢 ${title}**\n━━━━━━━━━━━━━━━━━━\n${message}`;

    if (location || time) {
      formattedContent += `\n━━━━━━━━━━━━━━━━━━`;
      if (location) formattedContent += `\n📍 **المكان:** ${location}`;
      if (time) formattedContent += `\n⏰ **الميعاد:** ${time}`;
    }

    if (actor) {
      formattedContent += `\n\n*— إدارة عيلة ANARCHY (${actor})*`;
    }

    const results = await Promise.all(
      selectedKeys.map(async (key) => {
        const target = CHANNEL_WEBHOOKS[key];
        if (!target || !target.url) {
          return {
            key,
            label: target?.label || key,
            ok: false,
            error: "رابط الـ Webhook غير مضبوط",
          };
        }

        const res = await fetch(target.url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: "ANARCHY SYNDICATE",
            content: formattedContent,
            allowed_mentions: {
              parse: ["everyone", "roles", "users"],
            },
          }),
        });

        if (!res.ok) {
          const errText = await res.text();
          return {
            key,
            label: target.label,
            ok: false,
            error: `Discord ${res.status}: ${errText}`,
          };
        }

        return { key, label: target.label, ok: true };
      })
    );

    const succeeded = results.filter((r) => r.ok);
    const failed = results.filter((r) => !r.ok);

    if (succeeded.length === 0) {
      return NextResponse.json(
        {
          error: failed.map((f) => `${f.label}: ${f.error}`).join(" | "),
          results,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      succeeded,
      failed,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Server error" },
      { status: 500 }
    );
  }
}