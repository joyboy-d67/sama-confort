import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  const userId = session.user?.id;
  const email = session.user?.email;

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      // Send initial connection message
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "connected" })}\n\n`));

      // Poll database every 5 seconds for user's bookings
      const intervalId = setInterval(async () => {
        try {
          // Build where clause dynamically
          const whereConditions = [];
          
          if (userId) {
            whereConditions.push({ userId });
          }
          if (email) {
            whereConditions.push({ email });
          }
          
          // If no valid filters, skip this iteration
          if (whereConditions.length === 0) {
            return;
          }

          const bookings = await prisma.booking.findMany({
            where: { OR: whereConditions as Prisma.BookingWhereInput[] },
            orderBy: { date: "desc" },
          });

          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: "update", bookings })}\n\n`)
          );
        } catch (error) {
          console.error("SSE Error:", error);
        }
      }, 5000);

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
