import { Hono } from "hono";
import { prisma } from "../prisma";
import { auth } from "../auth";

type AppEnv = {
  Variables: {
    user: typeof auth.$Infer.Session.user | null;
    session: typeof auth.$Infer.Session.session | null;
  };
};

export const ratingsRouter = new Hono<AppEnv>();

// Get ratings for a user
ratingsRouter.get("/user/:userId", async (c) => {
  const { userId } = c.req.param();

  const ratings = await prisma.rating.findMany({
    where: { rateeId: userId },
    include: {
      rater: {
        select: { id: true, username: true, displayName: true, avatarUrl: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const average =
    ratings.length > 0
      ? ratings.reduce((sum, r) => sum + r.score, 0) / ratings.length
      : 0;

  return c.json({ ratings, average, total: ratings.length });
});

// Submit a rating
ratingsRouter.post("/", async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: "Unauthorized" }, 401);

  const body = await c.req.json<{
    rateeId: string;
    score: number;
    comment?: string;
    listingId?: string;
  }>();

  if (!body.rateeId) return c.json({ error: "rateeId required" }, 400);
  if (body.rateeId === user.id) return c.json({ error: "Cannot rate yourself" }, 400);
  if (body.score < 1 || body.score > 5) return c.json({ error: "Score must be 1-5" }, 400);

  const rating = await prisma.rating.create({
    data: {
      raterId: user.id,
      rateeId: body.rateeId,
      score: body.score,
      comment: body.comment,
      listingId: body.listingId,
    },
    include: {
      rater: {
        select: { id: true, username: true, displayName: true, avatarUrl: true },
      },
    },
  });

  return c.json({ rating }, 201);
});

// Add seller response to a rating
ratingsRouter.patch("/:id/response", async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: "Unauthorized" }, 401);

  const { id } = c.req.param();
  const rating = await prisma.rating.findUnique({ where: { id } });
  if (!rating) return c.json({ error: "Not found" }, 404);
  if (rating.rateeId !== user.id) return c.json({ error: "Forbidden" }, 403);

  const { response } = await c.req.json<{ response: string }>();
  const updated = await prisma.rating.update({
    where: { id },
    data: { response },
  });

  return c.json({ rating: updated });
});
