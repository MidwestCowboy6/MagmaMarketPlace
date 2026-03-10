import "@vibecodeapp/proxy"; // DO NOT REMOVE OTHERWISE VIBECODE PROXY WILL NOT WORK
import { Hono } from "hono";
import { cors } from "hono/cors";
import "./env";
import { auth } from "./auth";
import { sampleRouter } from "./routes/sample";
import { trackingRouter } from "./routes/tracking";
import { contractsRouter } from "./routes/contracts";
import { usersRouter } from "./routes/users";
import { listingsRouter } from "./routes/listings";
import { messagesRouter } from "./routes/messages";
import { ratingsRouter } from "./routes/ratings";
import { priceRouter } from "./routes/price";
import { logger } from "hono/logger";

const app = new Hono<{
  Variables: {
    user: typeof auth.$Infer.Session.user | null;
    session: typeof auth.$Infer.Session.session | null;
  };
}>();

// CORS
const allowed = [
  /^http:\/\/localhost(:\d+)?$/,
  /^http:\/\/127\.0\.0\.1(:\d+)?$/,
  /^https:\/\/[a-z0-9-]+\.dev\.vibecode\.run$/,
  /^https:\/\/[a-z0-9-]+\.vibecode\.run$/,
  /^https:\/\/[a-z0-9-]+\.vibecodeapp\.com$/,
];

app.use(
  "*",
  cors({
    origin: (origin) => (origin && allowed.some((re) => re.test(origin)) ? origin : null),
    credentials: true,
  })
);

app.use("*", logger());

// Auth middleware
app.use("*", async (c, next) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!session) {
    c.set("user", null);
    c.set("session", null);
  } else {
    c.set("user", session.user);
    c.set("session", session.session);
  }
  await next();
});

// Auth handler
app.on(["GET", "POST"], "/api/auth/*", (c) => auth.handler(c.req.raw));

// Health check
app.get("/health", (c) => c.json({ status: "ok" }));

// Routes
app.route("/api/sample", sampleRouter);
app.route("/api/tracking", trackingRouter);
app.route("/api/contracts", contractsRouter);
app.route("/api/users", usersRouter);
app.route("/api/listings", listingsRouter);
app.route("/api/messages", messagesRouter);
app.route("/api/ratings", ratingsRouter);
app.route("/api/price", priceRouter);

const port = Number(process.env.PORT) || 3000;

export default {
  port,
  fetch: app.fetch,
};
