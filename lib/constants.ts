export const VAT_PERCENTAGE = 20;

type DiscountTier = {
  minSlots: number;
  maxSlots?: number;
  percentage: number;
  label: "10%" | "15%" | "20%";
};

export const DISCOUNT_TIERS: DiscountTier[] = [
  { minSlots: 6, percentage: 20, label: "20%" },
  { minSlots: 4, maxSlots: 5, percentage: 15, label: "15%" },
  { minSlots: 2, maxSlots: 3, percentage: 10, label: "10%" },
];

export const COLORS = {
  background: "#000000",
  surfacePrimary: "#1A1A1A",
  surfaceSecondary: "#131313",
  surfaceTertiary: "#0A0A0A",
  surfaceElevated: "#2A2A2A",
  textPrimary: "#FFFFFF",
  textSecondary: "#AAAAAA",
  textMuted: "#666666",
  accent: "#FFFFFF",
  accentDark: "#000000",
  border: "#333333",
  borderSubtle: "#1F1F1F",
  danger: "#EF4444",
  dangerMuted: "#991B1B",
  success: "#065F46",
  successBackground: "#D1FAE5",
  warningBackground: "#FEE2E2",
} as const;

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;
