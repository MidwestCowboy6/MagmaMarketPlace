import { betterAuth } from "better-auth";
import { expo } from "@better-auth/expo";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "./prisma";
import { env } from "./env";
import { createVibecodeSDK } from "@vibecodeapp/backend-sdk";

const vibecode = createVibecodeSDK();

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "sqlite" }),
  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.BACKEND_URL,

  trustedOrigins: [
    "vibecode://*/*",
    "exp://*/*",
    "http://localhost:*",
    "http://127.0.0.1:*",
    "https://*.dev.vibecode.run",
    "https://*.vibecode.run",
    "https://*.vibecodeapp.com",
    "https://*.vibecode.dev",
    "https://vibecode.dev",
  ],

  emailAndPassword: {
    enabled: true,
  },

  plugins: [
    expo(),
  ],

  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          try {
            await vibecode.email.sendWelcome({
              to: user.email,
              name: user.name || "there",
              appName: "Magma Market",
              fromName: "Magma Market",
              lang: "en",
            });
          } catch (error) {
            console.error("Failed to send welcome email:", error);
          }
        },
      },
    },
  },

  advanced: {
    trustedProxyHeaders: true,
    disableCSRFCheck: true,
    defaultCookieAttributes: {
      sameSite: "none",
      secure: true,
      partitioned: true,
    },
  },
});
