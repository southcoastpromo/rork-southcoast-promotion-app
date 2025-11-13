import { z } from "zod";
import { publicProcedure } from "@/backend/trpc/create-context";
import { db } from "@/lib/database";
import { Campaign, CampaignWindow } from "@/types/models";

export const getCampaignsRoute = publicProcedure
  .input(
    z.object({
      date: z.string().optional(),
      time: z.string().optional(),
      location: z.string().optional(),
      page: z.number().default(1),
    })
  )
  .query(({ input }) => {
    const { date, time, location, page } = input;
    const limit = 20;

    let windows = db.getCampaignWindows();

    if (date) {
      windows = windows.filter((w) => w.date === date);
    }

    if (location) {
      windows = windows.filter((w) =>
        w.campaignName.toLowerCase().includes(location.toLowerCase())
      );
    }

    if (time) {
      const timeRange = time.split("-");
      if (timeRange.length === 2) {
        const [startTime, endTime] = timeRange;
        windows = windows.filter((w) => {
          return w.startTime >= startTime && w.endTime <= endTime;
        });
      }
    }

    const total = windows.length;
    const offset = (page - 1) * limit;
    const paginatedWindows = windows.slice(offset, offset + limit);

    const campaigns = db.getAllCampaigns();
    const groupedByCampaign = paginatedWindows.reduce(
      (acc, window) => {
        if (!acc[window.campaignId]) {
          const campaign = campaigns.find((c) => c.id === window.campaignId);
          acc[window.campaignId] = {
            campaign: campaign || null,
            windows: [],
          };
        }
        acc[window.campaignId].windows.push(window);
        return acc;
      },
      {} as Record<
        string,
        { campaign: Campaign | null; windows: CampaignWindow[] }
      >
    );

    return {
      data: Object.values(groupedByCampaign),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  });
