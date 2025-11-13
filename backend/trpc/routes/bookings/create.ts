import { z } from "zod";
import { publicProcedure } from "@/backend/trpc/create-context";
import { db } from "@/lib/database";
import { Booking } from "@/types/models";
import { calculatePricing } from "@/lib/utils";
import { auditLogger } from "@/lib/audit-logger";
import { sanitizeEmail, sanitizePhone, sanitizeName } from "@/lib/sanitize";
import { TRPCError } from "@trpc/server";

export const createBookingRoute = publicProcedure
  .input(
    z.object({
      windowId: z.string(),
      slotsBooked: z.number().min(1),
      contact: z.object({
        name: z.string().min(1),
        email: z.string().email(),
        phone: z.string().min(1),
      }),
    })
  )
  .mutation(({ input, ctx }) => {
    const { windowId, slotsBooked, contact } = input;

    const ip = ctx.req.headers.get('x-forwarded-for') || ctx.req.headers.get('x-real-ip') || 'unknown';

    try {
      const sanitizedContact = {
        name: sanitizeName(contact.name),
        email: sanitizeEmail(contact.email),
        phone: sanitizePhone(contact.phone),
      };

      const window = db.getCampaignWindow(windowId);

      if (!window) {
        auditLogger.log(
          'booking_failure',
          { windowId, slotsBooked, reason: 'window_not_found' },
          false,
          ip
        );
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Campaign window not found',
        });
      }

      const availableSlots = window.slotsAvailable - window.bookedSlots;

      if (slotsBooked > availableSlots) {
        auditLogger.log(
          'booking_failure',
          { 
            windowId, 
            slotsBooked, 
            availableSlots, 
            reason: 'insufficient_slots' 
          },
          false,
          ip
        );
        throw new TRPCError({
          code: 'CONFLICT',
          message: `Not enough slots available. Only ${availableSlots} slots remaining.`,
        });
      }

      auditLogger.log(
        'booking_attempt',
        { windowId, slotsBooked, campaignName: window.campaignName },
        true,
        ip
      );

      const pricing = calculatePricing(slotsBooked, window.priceMinor, window.currency);

      const booking: Booking = {
        id: `book_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`,
        campaignWindowId: windowId,
        slotsBooked,
        contact: sanitizedContact,
      subtotal: pricing.subtotal,
      discountApplied: pricing.discountApplied,
      subtotalAfterDiscount: pricing.subtotalAfterDiscount,
      vatAmount: pricing.vatAmount,
      vatPercentage: pricing.vatPercentage,
      total: pricing.total,
      currency: window.currency,
      status: "confirmed",
      reference: `SC${Date.now().toString().slice(-8)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

      db.createBooking(booking);

      auditLogger.log(
        'booking_success',
        { 
          bookingId: booking.id,
          windowId, 
          slotsBooked, 
          total: booking.total,
          reference: booking.reference
        },
        true,
        ip
      );

      return {
        booking,
        tier: pricing.tier,
        breakdown: pricing,
      };
    } catch (error) {
      if (error instanceof TRPCError) {
        throw error;
      }
      auditLogger.log(
        'booking_failure',
        { windowId, slotsBooked, error: error instanceof Error ? error.message : 'Unknown error' },
        false,
        ip
      );
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: error instanceof Error ? error.message : 'Invalid booking data',
      });
    }
  });
