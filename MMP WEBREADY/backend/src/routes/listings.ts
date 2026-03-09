import { Hono } from "hono";
import { prisma } from "../prisma";
import { auth } from "../auth";

type AppEnv = {
  Variables: {
    user: typeof auth.$Infer.Session.user | null;
    session: typeof auth.$Infer.Session.session | null;
  };
};

export const listingsRouter = new Hono<AppEnv>();

// Get all active listings
listingsRouter.get("/", async (c) => {
  const status = c.req.query("status") ?? "active";
  const sellerId = c.req.query("sellerId");
  const category = c.req.query("category");

  const listings = await prisma.listing.findMany({
    where: {
      status,
      ...(sellerId ? { sellerId } : {}),
      ...(category ? { category } : {}),
    },
    include: {
      seller: {
        select: { id: true, username: true, displayName: true, avatarUrl: true },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return c.json({ listings });
});

// Get a single listing
listingsRouter.get("/:id", async (c) => {
  const { id } = c.req.param();
  const listing = await prisma.listing.findUnique({
    where: { id },
    include: {
      seller: {
        select: { id: true, username: true, displayName: true, avatarUrl: true },
      },
    },
  });
  if (!listing) return c.json({ error: "Not found" }, 404);
  return c.json({ listing });
});

// Create a listing
listingsRouter.post("/", async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: "Unauthorized" }, 401);

  const body = await c.req.json<{
    title: string;
    description: string;
    price: number;
    imageUrl?: string;
    category?: string;
    itemType?: string;
    listingType?: string;
  }>();

  const listing = await prisma.listing.create({
    data: {
      title: body.title,
      description: body.description,
      price: body.price,
      imageUrl: body.imageUrl,
      category: body.category ?? "other",
      itemType: body.itemType ?? "physical",
      listingType: body.listingType ?? "fixed",
      sellerId: user.id,
    },
    include: {
      seller: {
        select: { id: true, username: true, displayName: true, avatarUrl: true },
      },
    },
  });

  return c.json({ listing }, 201);
});

// Update a listing
listingsRouter.patch("/:id", async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: "Unauthorized" }, 401);

  const { id } = c.req.param();
  const existing = await prisma.listing.findUnique({ where: { id } });
  if (!existing) return c.json({ error: "Not found" }, 404);
  if (existing.sellerId !== user.id) return c.json({ error: "Forbidden" }, 403);

  const body = await c.req.json<{
    title?: string;
    description?: string;
    price?: number;
    imageUrl?: string;
    status?: string;
  }>();

  const listing = await prisma.listing.update({
    where: { id },
    data: body,
    include: {
      seller: {
        select: { id: true, username: true, displayName: true, avatarUrl: true },
      },
    },
  });

  return c.json({ listing });
});

// Delete a listing
listingsRouter.delete("/:id", async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: "Unauthorized" }, 401);

  const { id } = c.req.param();
  const existing = await prisma.listing.findUnique({ where: { id } });
  if (!existing) return c.json({ error: "Not found" }, 404);
  if (existing.sellerId !== user.id) return c.json({ error: "Forbidden" }, 403);

  await prisma.listing.delete({ where: { id } });
  return c.json({ success: true });
});
