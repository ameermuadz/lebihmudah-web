import { prisma } from "@/lib/db";
import { OwnerMessage } from "@/lib/types";

export interface QueueOwnerMessageInput {
  ownerId: string;
  propertyId: string;
  question: string;
  sessionId: string;
}

const mapOwnerMessage = (message: {
  id: string;
  ownerId: string;
  propertyId: string;
  question: string;
  sessionId: string;
  status: string;
  ownerReply: string | null;
  createdAt: Date;
  resolvedAt: Date | null;
}): OwnerMessage => ({
  id: message.id,
  ownerId: message.ownerId,
  propertyId: message.propertyId,
  question: message.question,
  sessionId: message.sessionId,
  status: message.status,
  ownerReply: message.ownerReply,
  createdAt: message.createdAt.toISOString(),
  resolvedAt: message.resolvedAt ? message.resolvedAt.toISOString() : null,
});

export async function listPendingOwnerMessages(): Promise<OwnerMessage[]> {
  const messages = await prisma.ownerMessage.findMany({
    where: { status: "PENDING" },
    orderBy: { createdAt: "desc" },
  });

  return messages.map(mapOwnerMessage);
}

export async function queueOwnerMessage(
  payload: QueueOwnerMessageInput,
): Promise<OwnerMessage> {
  const message = await prisma.ownerMessage.create({
    data: {
      ownerId: payload.ownerId,
      propertyId: payload.propertyId,
      question: payload.question,
      sessionId: payload.sessionId,
      status: "PENDING",
    },
  });

  return mapOwnerMessage(message);
}

export async function resolveOwnerMessage(
  messageId: string,
  ownerReply?: string,
): Promise<OwnerMessage | null> {
  const existing = await prisma.ownerMessage.findUnique({
    where: { id: messageId },
  });

  if (!existing) {
    return null;
  }

  const resolved = await prisma.ownerMessage.update({
    where: { id: messageId },
    data: {
      status: "RESOLVED",
      ownerReply: ownerReply ?? existing.ownerReply,
      resolvedAt: new Date(),
    },
  });

  return mapOwnerMessage(resolved);
}
