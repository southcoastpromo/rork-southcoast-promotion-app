export interface Campaign {
  id: string;
  name: string;
  status: 'active' | 'paused';
  createdAt: string;
  updatedAt: string;
  description?: string;
  targetAudience?: string;
  demographics?: string;
  coverage?: string;
  features?: string;
  benefits?: string;
}

export interface CampaignWindow {
  id: string;
  campaignId: string;
  campaignName: string;
  date: string;
  startTime: string;
  endTime: string;
  slotsAvailable: number;
  advertsPerSlot: number;
  priceMinor: number;
  currency: string;
  status: 'active' | 'paused';
  createdAt: string;
  updatedAt: string;
  bookedSlots: number;
  description?: string;
  targetAudience?: string;
  demographics?: string;
  coverage?: string;
  features?: string;
  benefits?: string;
  estimatedReach?: string;
  peakTimes?: string;
  venue?: string;
  additionalInfo?: string;
}

export interface Booking {
  id: string;
  campaignWindowId: string;
  slotsBooked: number;
  contact: {
    name: string;
    email: string;
    phone: string;
  };
  subtotal: number;
  discountApplied: number;
  subtotalAfterDiscount: number;
  vatAmount: number;
  vatPercentage: number;
  total: number;
  currency: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  createdAt: string;
  updatedAt: string;
  reference: string;
}

export interface PricingBreakdown {
  subtotal: number;
  discountPercentage: number;
  discountApplied: number;
  subtotalAfterDiscount: number;
  vatPercentage: number;
  vatAmount: number;
  total: number;
  currency: string;
  tier: '10%' | '15%' | '20%' | 'none';
}
