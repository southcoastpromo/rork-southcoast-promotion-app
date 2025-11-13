import { format as formatDate, parse as parseDate } from "date-fns";
import { DISCOUNT_TIERS, VAT_PERCENTAGE } from "./constants";
import { PricingBreakdown } from "../types/models";

export function calculatePricing(slotsBooked: number, priceMinorPerSlot: number, currency: string): PricingBreakdown {
  const subtotal = slotsBooked * priceMinorPerSlot;
  const tier = DISCOUNT_TIERS.find((discountTier) => {
    if (slotsBooked < discountTier.minSlots) {
      return false;
    }
    if (typeof discountTier.maxSlots === "number" && slotsBooked > discountTier.maxSlots) {
      return false;
    }
    return true;
  });

  const discountPercentage = tier?.percentage ?? 0;
  const discountApplied = Math.round(subtotal * (discountPercentage / 100));
  const subtotalAfterDiscount = subtotal - discountApplied;

  const vatPercentage = VAT_PERCENTAGE;
  const vatAmount = Math.round((subtotalAfterDiscount * vatPercentage) / 100);
  const total = subtotalAfterDiscount + vatAmount;

  return {
    subtotal,
    discountPercentage,
    discountApplied,
    subtotalAfterDiscount,
    vatPercentage,
    vatAmount,
    total,
    currency,
    tier: tier?.label ?? "none",
  };
}

export function formatPrice(priceMinor: number, currency: string): string {
  const amountMajor = Math.round(priceMinor) / 100;
  const resolvedCurrency = currency || "GBP";
  try {
    const formatter = new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: resolvedCurrency,
      currencyDisplay: "symbol",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    return formatter.format(amountMajor);
  } catch {
    return `£${amountMajor.toFixed(2)}`;
  }
}

export function formatDateDisplay(dateString: string, inputPattern: string = "yyyy-MM-dd", outputPattern: string = "dd/MM/yyyy"): string {
  try {
    const parsed = parseDate(dateString, inputPattern, new Date());
    if (Number.isNaN(parsed.getTime())) {
      return dateString;
    }
    return formatDate(parsed, outputPattern);
  } catch {
    return dateString;
  }
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

export function generateReference(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "SC-";
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}
