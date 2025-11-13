import { z } from "zod";
import { adminProcedure } from "../../create-context";
import { db } from "../../../../lib/database";
import { SEED_DATA, SEED_VERSION } from "../../../../lib/seed-data";
import { Campaign, CampaignWindow } from "../../../../types/models";
import { format } from "date-fns";
import { auditLogger } from "../../../../lib/audit-logger";

export const seedRoute = adminProcedure
  .input(
    z.object({
      mode: z.enum(["upsert", "replace"]).default("upsert"),
      reset: z.boolean().default(false),
    })
  )
  .mutation(({ input, ctx }) => {
    const { mode, reset } = input;

    const ip = ctx.req.headers.get('x-forwarded-for') || ctx.req.headers.get('x-real-ip') || 'unknown';

    const startTime = Date.now();

    auditLogger.log(
      reset ? 'seed_reset' : (mode === 'replace' ? 'seed_replace' : 'seed_upsert'),
      { mode, reset, seedVersion: SEED_VERSION, totalRows: SEED_DATA.length },
      true,
      ip
    );

    if (reset) {
      db.clearAll();
    }

    let created = 0;
    let updated = 0;
    let archived = 0;

    const processedIds: string[] = [];

    for (const row of SEED_DATA) {
      const dateParts = row.date.split("/");
      let year = parseInt(dateParts[2]);
      if (year < 100) {
        year += 2000;
      }
      const dateObj = new Date(year, parseInt(dateParts[1]) - 1, parseInt(dateParts[0]));
      const dateStr = format(dateObj, "yyyy-MM-dd");

      const timeParts = row.time.split("-");
      let startTime = timeParts[0].trim();
      let endTime = timeParts[1].trim();

      if (endTime === "00:00") {
        endTime = "24:00";
      }

      let campaign = db.getCampaignByName(row.campaign);
      if (!campaign) {
        const newCampaign: Campaign = {
          id: `camp_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`,
          name: row.campaign,
          status: "active",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        campaign = db.createCampaign(newCampaign);
      }

      const priceParts = row.pricePerSlot.replace(/[^\d.]/g, "");
      const priceMinor = Math.round(parseFloat(priceParts) * 100);

      const existingWindow = db.findCampaignWindow(
        campaign.id,
        dateStr,
        startTime,
        endTime
      );

      if (existingWindow) {
        db.updateCampaignWindow(existingWindow.id, {
          slotsAvailable: parseInt(row.slotsAvailable),
          advertsPerSlot: parseInt(row.advertsPerSlot),
          priceMinor,
          currency: "GBP",
        });
        updated++;
        processedIds.push(existingWindow.id);
      } else {
        const newWindow: CampaignWindow = {
          id: `win_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`,
          campaignId: campaign.id,
          campaignName: campaign.name,
          date: dateStr,
          startTime,
          endTime,
          slotsAvailable: parseInt(row.slotsAvailable),
          advertsPerSlot: parseInt(row.advertsPerSlot),
          priceMinor,
          currency: "GBP",
          status: "active",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          bookedSlots: 0,
        };
        db.createCampaignWindow(newWindow);
        created++;
        processedIds.push(newWindow.id);
      }
    }

    if (mode === "replace") {
      archived = db.archiveCampaignWindows(processedIds);
    }

    const durationMs = Date.now() - startTime;

    const result = {
      rows_total: SEED_DATA.length,
      created,
      updated,
      archived,
      duration_ms: durationMs,
      seed_version: SEED_VERSION,
    };

    auditLogger.log(
      reset ? 'seed_reset' : (mode === 'replace' ? 'seed_replace' : 'seed_upsert'),
      { ...result, success: true },
      true,
      ip
    );

    return result;
  });
