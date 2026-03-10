import { Hono } from "hono";
import {
  trackPackage,
  trackMultiplePackages,
  validateTrackingNumber,
  detectCarrier,
  type Carrier,
} from "../services/tracking";

export const trackingRouter = new Hono();

/**
 * Track a single package
 * GET /api/tracking/:trackingNumber
 */
trackingRouter.get("/:trackingNumber", async (c) => {
  const trackingNumber = c.req.param("trackingNumber");
  const carrier = c.req.query("carrier") as Carrier | undefined;

  // Validate tracking number
  const validation = validateTrackingNumber(trackingNumber);
  if (!validation.valid) {
    return c.json({ error: validation.message }, 400);
  }

  try {
    const result = await trackPackage(trackingNumber, carrier);
    return c.json(result);
  } catch (error) {
    console.error("Tracking error:", error);
    return c.json({ error: "Failed to track package" }, 500);
  }
});

/**
 * Track multiple packages
 * POST /api/tracking/batch
 */
trackingRouter.post("/batch", async (c) => {
  const body = await c.req.json<{
    packages: Array<{ trackingNumber: string; carrier?: Carrier }>;
  }>();

  if (!body.packages || !Array.isArray(body.packages)) {
    return c.json({ error: "packages array required" }, 400);
  }

  if (body.packages.length > 50) {
    return c.json({ error: "Maximum 50 packages per request" }, 400);
  }

  try {
    const results = await trackMultiplePackages(body.packages);
    return c.json({ results });
  } catch (error) {
    console.error("Batch tracking error:", error);
    return c.json({ error: "Failed to track packages" }, 500);
  }
});

/**
 * Validate tracking number format
 * GET /api/tracking/validate/:trackingNumber
 */
trackingRouter.get("/validate/:trackingNumber", (c) => {
  const trackingNumber = c.req.param("trackingNumber");
  const validation = validateTrackingNumber(trackingNumber);
  return c.json(validation);
});

/**
 * Detect carrier from tracking number
 * GET /api/tracking/detect/:trackingNumber
 */
trackingRouter.get("/detect/:trackingNumber", (c) => {
  const trackingNumber = c.req.param("trackingNumber");
  const carrier = detectCarrier(trackingNumber);
  return c.json({ trackingNumber, carrier });
});

/**
 * Webhook endpoint for carrier tracking updates (for oracle integration)
 * POST /api/tracking/webhook
 */
trackingRouter.post("/webhook", async (c) => {
  const webhookSecret = process.env.TRACKING_WEBHOOK_SECRET;
  const signature = c.req.header("X-Webhook-Signature");

  // Verify webhook signature if secret is configured
  if (webhookSecret && signature !== webhookSecret) {
    return c.json({ error: "Invalid signature" }, 401);
  }

  const body = await c.req.json<{
    trackingNumber: string;
    carrier: string;
    status: string;
    deliveredAt?: string;
  }>();

  // Log webhook for processing
  console.log("Tracking webhook received:", body);

  // TODO: Update escrow contract via oracle when package is delivered
  // This would trigger the updateTracking function on the smart contract

  return c.json({ received: true });
});
