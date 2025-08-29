// app/api/stream/route.js
let clients = [];

/**
 * SSE GET - setiap client yang connect akan disimpan di array clients
 * client = { userEmail, controller }
 */
export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const userEmail = searchParams.get("userEmail");
  if (!userEmail) return new Response("Missing userEmail", { status: 400 });

  const headers = new Headers({
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  });

  const stream = new ReadableStream({
    start(controller) {
      const client = { userEmail, controller };
      clients.push(client);

      // kirim ping setiap 20 detik biar connection tetap hidup
      const interval = setInterval(() => {
        controller.enqueue(`event: ping\ndata: {}\n\n`);
      }, 20000);

      // cleanup saat client disconnect
      streamClosed().then(() => {
        clearInterval(interval);
        clients = clients.filter((c) => c !== client);
      });

      function streamClosed() {
        return new Promise((resolve) => {
          controller.closed.then(resolve).catch(resolve);
        });
      }
    },
  });

  return new Response(stream, { headers });
}

/**
 * Broadcast message ke semua client SSE
 * bisa dikembangkan nanti untuk broadcast per user / room
 */
export function broadcastMessage(message) {
  clients.forEach((client) => {
    try {
      client.controller.enqueue(`data: ${JSON.stringify(message)}\n\n`);
    } catch (err) {
      console.error("Failed to send SSE", err);
    }
  });
}
