import { z } from "zod";
import { publicProcedure } from "@/backend/trpc/create-context";
import { db } from "@/lib/database";

export const getCampaignWindowRoute = publicProcedure
  .input(
    z.object({
      campaignId: z.string(),
      windowId: z.string(),
    })
  )
  .query(({ input }) => {
    const { campaignId, windowId } = input;
    
    const window = db.getCampaignWindow(windowId);
    
    if (!window || window.campaignId !== campaignId) {
      throw new Error("Campaign window not found");
    }

    const campaign = db.getCampaign(campaignId);
    
    const availableSlots = window.slotsAvailable - window.bookedSlots;

    return {
      window,
      campaign,
      availableSlots,
    };
  });
