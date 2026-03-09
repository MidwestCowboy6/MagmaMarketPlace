import { Hono } from "hono";

export const priceRouter = new Hono();

// Proxy CoinGecko AVAX price to avoid CORS/network issues from the client
priceRouter.get("/avax", async (c) => {
  try {
    const response = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=avalanche-2&vs_currencies=usd"
    );
    if (!response.ok) {
      return c.json({ error: "Failed to fetch price" }, 502);
    }
    const data = await response.json() as Record<string, Record<string, number>>;
    const price = data["avalanche-2"]?.usd ?? 0;
    return c.json({ price });
  } catch (error) {
    console.error("Error proxying AVAX price:", error);
    return c.json({ price: 0 }, 500);
  }
});
