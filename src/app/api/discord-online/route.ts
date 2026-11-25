import { NextResponse } from "next/server";

const DISCORD_GUILD_ID = "1512911336982581338";

export async function GET() {
  try {
    const res = await fetch(
      `https://discord.com/api/guilds/${DISCORD_GUILD_ID}/widget.json`,
      { cache: "no-store" }
    );

    if (!res.ok) {
      return NextResponse.json({ onlineUsers: [], presenceCount: 0 });
    }

    const data = await res.json();
    const onlineUsers = (data.members || []).map((m: any) => ({
      id: m.id,
      username: (m.username || "").toLowerCase(),
      status: m.status || "online",
      game: m.game?.name || null,
    }));

    return NextResponse.json({
      onlineUsers,
      presenceCount: data.presence_count || onlineUsers.length,
    });
  } catch {
    return NextResponse.json({ onlineUsers: [], presenceCount: 0 });
  }
}