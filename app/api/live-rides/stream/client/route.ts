import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// SSE stream for client to receive updates on their live ride
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  const url = new URL(req.url);
  const rideId = url.searchParams.get("rideId");

  if (!rideId) {
    return new Response("Missing rideId", { status: 400 });
  }

  const encoder = new TextEncoder();
  let intervalId: NodeJS.Timeout;

  const stream = new ReadableStream({
    async start(controller) {
      // Send initial connection message
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "connected" })}\n\n`));

      // Poll for ride updates every 2 seconds
      intervalId = setInterval(async () => {
        try {
          const liveRide = await prisma.liveRide.findUnique({
            where: { id: rideId },
          });

          if (liveRide && liveRide.userId === session.user.id) {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ type: "rideUpdate", data: liveRide })}\n\n`)
            );

            // If ride is completed or cancelled, close the stream
            if (liveRide.status === "COMPLETED" || liveRide.status === "CANCELLED") {
              clearInterval(intervalId);
              controller.close();
            }
          }
        } catch (error) {
          console.error("SSE polling error:", error);
        }
      }, 2000);
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
