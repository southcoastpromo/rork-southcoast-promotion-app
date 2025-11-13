import { createTRPCReact } from "@trpc/react-query";
import { httpLink } from "@trpc/client";
import type { AppRouter } from "@/backend/trpc/app-router";
import superjson from "superjson";

export const trpc = createTRPCReact<AppRouter>();

const getBaseUrl = () => {
  const envValue = process.env.EXPO_PUBLIC_API_BASE;
  if (!envValue) {
    throw new Error("EXPO_PUBLIC_API_BASE is required");
  }
  const trimmed = envValue.trim();
  if (trimmed.length === 0) {
    throw new Error("EXPO_PUBLIC_API_BASE cannot be empty");
  }
  if (!trimmed.startsWith("https://")) {
    throw new Error("EXPO_PUBLIC_API_BASE must use https");
  }
  if (trimmed.endsWith("/")) {
    throw new Error("EXPO_PUBLIC_API_BASE must not have trailing slash");
  }
  return trimmed;
};

export const API_BASE = getBaseUrl();

let adminAuthToken: string | null = null;

export const setAdminAuthToken = (token: string | null) => {
  adminAuthToken = token;
  console.log(`[trpc] Admin auth token ${token ? "set" : "cleared"}`);
};

export const trpcClient = trpc.createClient({
  links: [
    httpLink({
      url: `${API_BASE}/api/trpc`,
      transformer: superjson,
      headers() {
        const headers: Record<string, string> = {};
        if (adminAuthToken) {
          headers.authorization = `Bearer ${adminAuthToken}`;
        }
        return headers;
      },
    }),
  ],
});
