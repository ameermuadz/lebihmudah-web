import { NextRequest, NextResponse } from "next/server";
import {
  listPendingOwnerMessages,
  queueOwnerMessage,
  resolveOwnerMessage,
} from "@/lib/services/ownerMessageService";

interface MessageOwnerPayload {
  ownerId?: string;
  propertyId?: string;
  question?: string;
  sessionId?: string;
}

export async function GET() {
  try {
    const messages = await listPendingOwnerMessages();
    return NextResponse.json(messages);
  } catch (error) {
    const reason = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `Failed to load pending messages: ${reason}` },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request
      .json()
      .catch(() => ({}))) as MessageOwnerPayload;

    if (
      !body.ownerId ||
      !body.propertyId ||
      !body.question ||
      !body.sessionId
    ) {
      return NextResponse.json(
        { error: "ownerId, propertyId, question, and sessionId are required" },
        { status: 400 },
      );
    }

    await queueOwnerMessage({
      ownerId: body.ownerId,
      propertyId: body.propertyId,
      question: body.question,
      sessionId: body.sessionId,
    });

    return NextResponse.json({
      status: "Message queued. Awaiting owner response.",
    });
  } catch (error) {
    const reason = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `Failed to queue owner message: ${reason}` },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => ({}))) as {
      messageId?: string;
      ownerReply?: string;
    };

    if (!body.messageId) {
      return NextResponse.json(
        { error: "messageId is required" },
        { status: 400 },
      );
    }

    const resolvedMessage = await resolveOwnerMessage(
      body.messageId,
      body.ownerReply,
    );

    if (!resolvedMessage) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 });
    }

    return NextResponse.json({
      status: "Message marked as resolved",
      resolvedMessage,
    });
  } catch (error) {
    const reason = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `Failed to resolve owner message: ${reason}` },
      { status: 500 },
    );
  }
}
