import { Hono } from "hono";
import { prisma } from "../prisma";
import { auth } from "../auth";

type AppEnv = {
  Variables: {
    user: typeof auth.$Infer.Session.user | null;
    session: typeof auth.$Infer.Session.session | null;
  };
};

export const messagesRouter = new Hono<AppEnv>();

// Get all conversations for current user
messagesRouter.get("/conversations", async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: "Unauthorized" }, 401);

  const conversations = await prisma.conversation.findMany({
    where: {
      participants: { some: { userId: user.id } },
    },
    include: {
      participants: {
        include: {
          user: {
            select: { id: true, name: true, username: true, displayName: true, avatarUrl: true },
          },
        },
      },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  return c.json({ conversations });
});

// Get or create a conversation with another user
messagesRouter.post("/conversations", async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: "Unauthorized" }, 401);

  const { otherUserId } = await c.req.json<{ otherUserId: string }>();
  if (!otherUserId) return c.json({ error: "otherUserId required" }, 400);
  if (otherUserId === user.id) return c.json({ error: "Cannot message yourself" }, 400);

  // Find existing conversation between the two users
  const existing = await prisma.conversation.findFirst({
    where: {
      AND: [
        { participants: { some: { userId: user.id } } },
        { participants: { some: { userId: otherUserId } } },
      ],
    },
    include: {
      participants: {
        include: {
          user: {
            select: { id: true, name: true, username: true, displayName: true, avatarUrl: true },
          },
        },
      },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });

  if (existing) return c.json({ conversation: existing });

  // Create new conversation
  const conversation = await prisma.conversation.create({
    data: {
      participants: {
        create: [
          { userId: user.id },
          { userId: otherUserId },
        ],
      },
    },
    include: {
      participants: {
        include: {
          user: {
            select: { id: true, name: true, username: true, displayName: true, avatarUrl: true },
          },
        },
      },
      messages: true,
    },
  });

  return c.json({ conversation }, 201);
});

// Get messages in a conversation
messagesRouter.get("/conversations/:conversationId/messages", async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: "Unauthorized" }, 401);

  const { conversationId } = c.req.param();

  // Verify user is a participant
  const participant = await prisma.conversationParticipant.findUnique({
    where: { conversationId_userId: { conversationId, userId: user.id } },
  });
  if (!participant) return c.json({ error: "Forbidden" }, 403);

  // Mark as read
  await prisma.conversationParticipant.update({
    where: { conversationId_userId: { conversationId, userId: user.id } },
    data: { unreadCount: 0, lastReadAt: new Date() },
  });

  const messages = await prisma.message.findMany({
    where: { conversationId },
    include: {
      sender: {
        select: { id: true, name: true, username: true, displayName: true, avatarUrl: true },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  return c.json({ messages });
});

// Send a message
messagesRouter.post("/conversations/:conversationId/messages", async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: "Unauthorized" }, 401);

  const { conversationId } = c.req.param();

  // Verify user is a participant
  const participant = await prisma.conversationParticipant.findUnique({
    where: { conversationId_userId: { conversationId, userId: user.id } },
  });
  if (!participant) return c.json({ error: "Forbidden" }, 403);

  const { text } = await c.req.json<{ text: string }>();
  if (!text?.trim()) return c.json({ error: "Text required" }, 400);

  // Create message
  const message = await prisma.message.create({
    data: { conversationId, senderId: user.id, text: text.trim() },
    include: {
      sender: {
        select: { id: true, name: true, username: true, displayName: true, avatarUrl: true },
      },
    },
  });

  // Update conversation updatedAt and increment unread for other participants
  await prisma.conversation.update({
    where: { id: conversationId },
    data: { updatedAt: new Date() },
  });

  await prisma.conversationParticipant.updateMany({
    where: { conversationId, userId: { not: user.id } },
    data: { unreadCount: { increment: 1 } },
  });

  return c.json({ message }, 201);
});

// Get total unread count for current user
messagesRouter.get("/unread", async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: "Unauthorized" }, 401);

  const result = await prisma.conversationParticipant.aggregate({
    where: { userId: user.id },
    _sum: { unreadCount: true },
  });

  return c.json({ unread: result._sum.unreadCount ?? 0 });
});
