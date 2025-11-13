import { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import { TRPCError, initTRPC } from "@trpc/server";
import superjson from "superjson";

const ADMIN_RATE_LIMIT_WINDOW_MS = 60_000;
const ADMIN_RATE_LIMIT_MAX_REQUESTS = 20;

type RateLimitState = {
  windowStart: number;
  count: number;
};

const adminRateLimitMap = new Map<string, RateLimitState>();

const getRequestIp = (req: Request) => {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    const parts = forwarded.split(",");
    const first = parts[0]?.trim();
    if (first) {
      return first;
    }
  }
  const realIp = req.headers.get("x-real-ip");
  if (realIp && realIp.trim().length > 0) {
    return realIp.trim();
  }
  return "unknown";
};

const validateAdminToken = (token: string | null) => {
  const adminToken = process.env.ADMIN_TOKEN;
  if (!adminToken || adminToken.trim().length === 0) {
    console.error("ADMIN_TOKEN is not configured");
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Admin security not configured",
    });
  }
  if (!token || !token.toLowerCase().startsWith("bearer ")) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Missing admin authorization",
    });
  }
  const providedToken = token.slice(7).trim();
  if (providedToken.length === 0 || providedToken !== adminToken) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Invalid admin authorization",
    });
  }
};

const enforceAdminRateLimit = (req: Request) => {
  const ip = getRequestIp(req);
  const now = Date.now();
  const current = adminRateLimitMap.get(ip);
  if (!current) {
    adminRateLimitMap.set(ip, {
      count: 1,
      windowStart: now,
    });
    return;
  }
  if (now - current.windowStart > ADMIN_RATE_LIMIT_WINDOW_MS) {
    adminRateLimitMap.set(ip, {
      count: 1,
      windowStart: now,
    });
    return;
  }
  if (current.count >= ADMIN_RATE_LIMIT_MAX_REQUESTS) {
    throw new TRPCError({
      code: "TOO_MANY_REQUESTS",
      message: "Admin rate limit exceeded",
    });
  }
  current.count += 1;
  adminRateLimitMap.set(ip, current);
};

export const createContext = async (opts: FetchCreateContextFnOptions) => {
  return {
    req: opts.req,
  };
};

export type Context = Awaited<ReturnType<typeof createContext>>;

const t = initTRPC.context<Context>().create({
  transformer: superjson,
});

export const createTRPCRouter = t.router;
export const publicProcedure = t.procedure;
export const adminProcedure = t.procedure.use(async ({ ctx, next }) => {
  validateAdminToken(ctx.req.headers.get("authorization"));
  enforceAdminRateLimit(ctx.req);
  return next();
});
