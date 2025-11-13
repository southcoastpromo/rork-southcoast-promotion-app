import { Campaign, CampaignWindow, Booking } from '@/types/models';

class Database {
  private campaigns: Map<string, Campaign> = new Map();
  private campaignWindows: Map<string, CampaignWindow> = new Map();
  private bookings: Map<string, Booking> = new Map();
  private campaignsByName: Map<string, string> = new Map();

  getCampaign(id: string): Campaign | undefined {
    return this.campaigns.get(id);
  }

  getCampaignByName(name: string): Campaign | undefined {
    const id = this.campaignsByName.get(name);
    return id ? this.campaigns.get(id) : undefined;
  }

  getAllCampaigns(): Campaign[] {
    return Array.from(this.campaigns.values());
  }

  createCampaign(campaign: Campaign): Campaign {
    this.campaigns.set(campaign.id, campaign);
    this.campaignsByName.set(campaign.name, campaign.id);
    return campaign;
  }

  updateCampaign(id: string, updates: Partial<Campaign>): Campaign | undefined {
    const campaign = this.campaigns.get(id);
    if (!campaign) return undefined;

    const updated = { ...campaign, ...updates, updatedAt: new Date().toISOString() };
    this.campaigns.set(id, updated);
    return updated;
  }

  getCampaignWindow(id: string): CampaignWindow | undefined {
    return this.campaignWindows.get(id);
  }

  getCampaignWindows(filters?: {
    date?: string;
    campaignId?: string;
    startTime?: string;
    endTime?: string;
  }): CampaignWindow[] {
    let windows = Array.from(this.campaignWindows.values());

    if (filters) {
      if (filters.date) {
        windows = windows.filter(w => w.date === filters.date);
      }
      if (filters.campaignId) {
        windows = windows.filter(w => w.campaignId === filters.campaignId);
      }
      if (filters.startTime) {
        windows = windows.filter(w => w.startTime >= filters.startTime!);
      }
      if (filters.endTime) {
        windows = windows.filter(w => w.endTime <= filters.endTime!);
      }
    }

    return windows.sort((a, b) => {
      const dateCompare = a.date.localeCompare(b.date);
      if (dateCompare !== 0) return dateCompare;
      return a.startTime.localeCompare(b.startTime);
    });
  }

  findCampaignWindow(campaignId: string, date: string, startTime: string, endTime: string): CampaignWindow | undefined {
    return Array.from(this.campaignWindows.values()).find(
      w => w.campaignId === campaignId && w.date === date && w.startTime === startTime && w.endTime === endTime
    );
  }

  createCampaignWindow(window: CampaignWindow): CampaignWindow {
    this.campaignWindows.set(window.id, window);
    return window;
  }

  updateCampaignWindow(id: string, updates: Partial<CampaignWindow>): CampaignWindow | undefined {
    const window = this.campaignWindows.get(id);
    if (!window) return undefined;

    const updated = { ...window, ...updates, updatedAt: new Date().toISOString() };
    this.campaignWindows.set(id, updated);
    return updated;
  }

  archiveCampaignWindows(exceptIds: string[]): number {
    let archived = 0;
    const exceptSet = new Set(exceptIds);
    
    for (const [id, window] of this.campaignWindows.entries()) {
      if (!exceptSet.has(id) && window.status === 'active') {
        this.updateCampaignWindow(id, { status: 'paused' });
        archived++;
      }
    }
    
    return archived;
  }

  createBooking(booking: Booking): Booking {
    this.bookings.set(booking.id, booking);
    
    const window = this.campaignWindows.get(booking.campaignWindowId);
    if (window) {
      window.bookedSlots += booking.slotsBooked;
      this.campaignWindows.set(window.id, window);
    }
    
    return booking;
  }

  getBooking(id: string): Booking | undefined {
    return this.bookings.get(id);
  }

  getAllBookings(): Booking[] {
    return Array.from(this.bookings.values());
  }

  getBookingsByWindow(windowId: string): Booking[] {
    return Array.from(this.bookings.values()).filter(b => b.campaignWindowId === windowId);
  }

  clearAll(): void {
    this.campaigns.clear();
    this.campaignWindows.clear();
    this.bookings.clear();
    this.campaignsByName.clear();
  }
}

export const db = new Database();
