import { isStaff } from "@/lib/authz";
import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!isStaff(session)) {
    return new Response("Unauthorized", { status: 401 });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      // Send initial connection message
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "connected" })}\n\n`));

      // Poll database every 3 seconds for changes
      const intervalId = setInterval(async () => {
        try {
          const bookings = await prisma.booking.findMany({
            where: {
              status: {
                in: ["PENDING", "CONFIRMED"],
              },
            },
            orderBy: [{ date: "asc" }, { timeSlot: "asc" }],
          });

          const formattedBookings = bookings.map((b) => ({
            ...b,
            date: b.date.toISOString().split("T")[0],
          }));

          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: "update", bookings: formattedBookings })}\n\n`)
          );
        } catch (error) {
          console.error("SSE Error:", error);
        }
      }, 3000);

      // Cleanup on client disconnect
      req.signal.addEventListener("abort", () => {
        clearInterval(intervalId);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
