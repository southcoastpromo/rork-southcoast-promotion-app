import { createTRPCRouter } from "@/backend/trpc/create-context";
import { getCampaignsRoute } from "@/backend/trpc/routes/campaigns/get-all";
import { getCampaignWindowRoute } from "@/backend/trpc/routes/campaigns/get-window";
import { createBookingRoute } from "@/backend/trpc/routes/bookings/create";
import { seedRoute } from "@/backend/trpc/routes/admin/seed";

export const appRouter = createTRPCRouter({
  campaigns: createTRPCRouter({
    getAll: getCampaignsRoute,
    getWindow: getCampaignWindowRoute,
  }),
  bookings: createTRPCRouter({
    create: createBookingRoute,
  }),
  admin: createTRPCRouter({
    seed: seedRoute,
  }),
});

export type AppRouter = typeof appRouter;
