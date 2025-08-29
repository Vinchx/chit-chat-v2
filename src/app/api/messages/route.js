import clientPromise from "@/lib/mongodb";
import { broadcastMessage } from "../stream/route"; // pastikan path ini sesuai struktur project

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const userEmail = searchParams.get("userEmail");
    if (!userEmail) {
      return new Response("Missing userEmail", { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);

    const messages = await db
      .collection("messages")
      .find({ userEmail })
      .sort({ createdAt: 1 })
      .toArray();

    return new Response(JSON.stringify(messages), { status: 200 });
  } catch (err) {
    console.error(err);
    return new Response("Database error", { status: 500 });
  }
}

export async function POST(req) {
  try {
    const { messages, userEmail } = await req.json();
    if (!messages || !userEmail) {
      return new Response("Missing messages or userEmail", { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);

    const messagesWithMeta = messages.map((msg) => ({
      ...msg,
      userEmail,
      createdAt: new Date(),
    }));

    await db.collection("messages").insertMany(messagesWithMeta);

    // =====================================================
    // broadcast setiap pesan baru ke SSE clients
    messagesWithMeta.forEach((msg) => broadcastMessage(msg));
    // =====================================================

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (err) {
    console.error(err);
    return new Response("Database error", { status: 500 });
  }
}
