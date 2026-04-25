import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createNotification } from "@/lib/services/notificationService";
import { AUTH_COOKIE_NAME } from "@/lib/auth";
import { getSessionUser } from "@/lib/services/authService";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const sessionToken = request.cookies.get(AUTH_COOKIE_NAME)?.value;
    const session = await getSessionUser(sessionToken);

    if (!session || session.user.role !== "OWNER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { reply } = await request.json();

    if (!reply) {
      return NextResponse.json({ error: "reply is required" }, { status: 400 });
    }

    const ownerMessage = await prisma.ownerMessage.findUnique({
      where: { id: params.id },
      include: { property: true },
    });

    if (!ownerMessage || ownerMessage.ownerId !== session.user.id) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 });
    }

    const updatedMessage = await prisma.ownerMessage.update({
      where: { id: params.id },
      data: {
        ownerReply: reply,
        status: "RESOLVED",
        resolvedAt: new Date(),
      },
    });

    // We need to notify the renter if they are a registered user.
    // sessionId is typically "user-{userId}" or "guest-{random}"
    const sessionId = ownerMessage.sessionId;
    if (sessionId.startsWith("user-")) {
      const renterUserId = sessionId.replace("user-", "");
      await createNotification({
        recipientUserId: renterUserId,
        type: "OWNER_MESSAGE_REPLY",
        title: "Owner replied to your question",
        message: `The owner of ${ownerMessage.property.title} has answered your question.`,
        targetUrl: "/chat",
      });
    }

    // Call webhook to inject reply into Renter's chat session
    try {
      await fetch("http://localhost:8000/api/webhook/owner_reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: ownerMessage.sessionId,
          owner_message: reply,
        }),
      });
    } catch (e) {
      console.error("Failed to notify python agent webhook for renter", e);
    }

    return NextResponse.json(updatedMessage);
  } catch (error) {
    const reason = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `Failed to save reply: ${reason}` },
      { status: 500 },
    );
  }
}
