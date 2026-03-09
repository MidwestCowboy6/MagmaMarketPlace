import { Hono } from "hono";
import { prisma } from "../prisma";
import { auth } from "../auth";

type AppEnv = {
  Variables: {
    user: typeof auth.$Infer.Session.user | null;
    session: typeof auth.$Infer.Session.session | null;
  };
};

export const usersRouter = new Hono<AppEnv>();

// Get current user profile
usersRouter.get("/me", async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: "Unauthorized" }, 401);

  const profile = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      id: true,
      name: true,
      email: true,
      username: true,
      displayName: true,
      avatarUrl: true,
      walletAddress: true,
      bio: true,
      totalSales: true,
      totalPurchases: true,
      totalTrades: true,
      reputation: true,
      createdAt: true,
    },
  });

  return c.json({ user: profile });
});

// Update current user profile
usersRouter.patch("/me", async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: "Unauthorized" }, 401);

  const body = await c.req.json<{
    username?: string;
    displayName?: string;
    avatarUrl?: string;
    walletAddress?: string;
    bio?: string;
  }>();

  // Check username uniqueness
  if (body.username) {
    const existing = await prisma.user.findFirst({
      where: { username: body.username, id: { not: user.id } },
    });
    if (existing) return c.json({ error: "Username already taken" }, 400);
  }

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: {
      username: body.username,
      displayName: body.displayName,
      avatarUrl: body.avatarUrl,
      walletAddress: body.walletAddress,
      bio: body.bio,
    },
    select: {
      id: true,
      name: true,
      email: true,
      username: true,
      displayName: true,
      avatarUrl: true,
      walletAddress: true,
      bio: true,
      totalSales: true,
      totalPurchases: true,
      totalTrades: true,
      reputation: true,
      createdAt: true,
    },
  });

  return c.json({ user: updated });
});

// Get a public user profile by id
usersRouter.get("/:userId", async (c) => {
  const { userId } = c.req.param();

  const profile = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      username: true,
      displayName: true,
      avatarUrl: true,
      bio: true,
      totalSales: true,
      totalPurchases: true,
      totalTrades: true,
      reputation: true,
      createdAt: true,
    },
  });

  if (!profile) return c.json({ error: "User not found" }, 404);
  return c.json({ user: profile });
});

// Search users by name or username
usersRouter.get("/", async (c) => {
  const q = c.req.query("q") ?? "";
  const currentUserId = c.get("user")?.id;

  if (!q.trim()) return c.json({ users: [] });

  const users = await prisma.user.findMany({
    where: {
      AND: [
        currentUserId ? { id: { not: currentUserId } } : {},
        {
          OR: [
            { username: { contains: q } },
            { displayName: { contains: q } },
            { name: { contains: q } },
          ],
        },
      ],
    },
    select: {
      id: true,
      name: true,
      username: true,
      displayName: true,
      avatarUrl: true,
    },
    take: 20,
  });

  return c.json({ users });
});
