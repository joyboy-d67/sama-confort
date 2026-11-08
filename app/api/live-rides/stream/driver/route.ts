import { isStaff } from "@/lib/authz";
import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// SSE stream for driver to receive new live ride requests
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!isStaff(session)) {
    return new Response("Unauthorized", { status: 401 });
  }

  const encoder = new TextEncoder();
  let intervalId: NodeJS.Timeout;

  const stream = new ReadableStream({
    async start(controller) {
      // Send initial connection message
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "connected" })}\n\n`));

      // Poll for new REQUESTED rides every 3 seconds
      intervalId = setInterval(async () => {
        try {
          const requestedRides = await prisma.liveRide.findMany({
            where: { status: "REQUESTED" },
            orderBy: { requestedAt: "desc" },
            take: 10,
          });

          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: "rides", data: requestedRides })}\n\n`)
          );
        } catch (error) {
          console.error("SSE polling error:", error);
        }
      }, 3000);
    },
    cancel() {
      if (intervalId) clearInterval(intervalId);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
