import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createNotification } from "@/lib/services/notificationService";

export async function POST(request: NextRequest) {
  try {
    const { propertyId, question, sessionId } = await request.json();

    if (!propertyId || !question || !sessionId) {
      return NextResponse.json(
        { error: "propertyId, question, and sessionId are required" },
        { status: 400 },
      );
    }

    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      select: { ownerId: true, title: true },
    });

    if (!property) {
      return NextResponse.json(
        { error: "Property not found" },
        { status: 404 },
      );
    }

    let renterName = "Renter (Guest)";
    if (sessionId.startsWith("user-")) {
      const userId = sessionId.replace("user-", "");
      const renter = await prisma.user.findUnique({
        where: { id: userId },
        select: { name: true },
      });
      if (renter) {
        renterName = renter.name;
      }
    }

    const ownerMessage = await prisma.ownerMessage.create({
      data: {
        ownerId: property.ownerId,
        propertyId: propertyId,
        question: question,
        renterName: renterName,
        sessionId: sessionId,
        status: "PENDING",
      },
    });

    await createNotification({
      recipientUserId: property.ownerId,
      type: "OWNER_MESSAGE_REQUEST",
      title: "New question from renter",
      message: `${renterName} asked a question about ${property.title}.`,
      targetUrl: "/chat",
    });

    // We must also trigger the webhook to the Python agent so it actively asks the owner in the owner's chat session
    const ownerSessionId = `user-${property.ownerId}`;
    try {
      await fetch("http://localhost:8000/api/webhook/renter_question", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: ownerSessionId,
          renter_session_id: sessionId,
          renter_name: renterName,
          property_title: property.title,
          question: question,
        }),
      });
    } catch (e) {
      console.error("Failed to notify python agent webhook for owner", e);
    }

    return NextResponse.json(ownerMessage);
  } catch (error) {
    const reason = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `Failed to send message: ${reason}` },
      { status: 500 },
    );
  }
}
