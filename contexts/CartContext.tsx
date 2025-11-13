import { useState, useEffect, useMemo, useCallback } from "react";
import createContextHook from "@nkzw/create-context-hook";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { calculatePricing } from "@/lib/utils";
import { z } from "zod";

export interface CartItem {
  windowId: string;
  campaignId: string;
  campaignName: string;
  date: string;
  startTime: string;
  endTime: string;
  slotsToBook: number;
  pricePerSlot: number;
  currency: string;
  maxAvailable: number;
  advertsPerSlot: number;
}

const CART_STORAGE_KEY = "@cart_items";

export const [CartProvider, useCart] = createContextHook(() => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadCart();
  }, []);

  const cartItemSchema = z.object({
    windowId: z.string(),
    campaignId: z.string(),
    campaignName: z.string(),
    date: z.string(),
    startTime: z.string(),
    endTime: z.string(),
    slotsToBook: z.number().min(1),
    pricePerSlot: z.number().min(0),
    currency: z.string(),
    maxAvailable: z.number().min(1),
    advertsPerSlot: z.number().min(0),
  });

  const loadCart = async () => {
    try {
      const stored = await AsyncStorage.getItem(CART_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        const validated = z.array(cartItemSchema).safeParse(parsed);
        if (validated.success) {
          setItems(validated.data);
        } else {
          console.warn("Invalid cart data, clearing cart", validated.error);
          await AsyncStorage.removeItem(CART_STORAGE_KEY);
        }
      }
    } catch (error) {
      console.error("Failed to load cart:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveCart = useCallback(async (cartItems: CartItem[]) => {
    try {
      await AsyncStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
    } catch (error) {
      console.error("Failed to save cart:", error);
    }
  }, []);

  const addItem = useCallback((item: CartItem) => {
    setItems((current) => {
      const existingIndex = current.findIndex(
        (i) => i.windowId === item.windowId
      );

      let newItems: CartItem[];
      if (existingIndex >= 0) {
        newItems = [...current];
        newItems[existingIndex] = {
          ...newItems[existingIndex],
          slotsToBook: Math.min(
            item.maxAvailable,
            newItems[existingIndex].slotsToBook + item.slotsToBook
          ),
        };
      } else {
        newItems = [...current, item];
      }

      saveCart(newItems);
      return newItems;
    });
  }, [saveCart]);

  const removeItem = useCallback((windowId: string) => {
    setItems((current) => {
      const newItems = current.filter((i) => i.windowId !== windowId);
      saveCart(newItems);
      return newItems;
    });
  }, [saveCart]);

  const updateItemSlots = useCallback((windowId: string, slots: number) => {
    setItems((current) => {
      const newItems = current.map((i) =>
        i.windowId === windowId
          ? { ...i, slotsToBook: Math.min(i.maxAvailable, Math.max(1, slots)) }
          : i
      );
      saveCart(newItems);
      return newItems;
    });
  }, [saveCart]);

  const clearCart = useCallback(async () => {
    setItems([]);
    await AsyncStorage.removeItem(CART_STORAGE_KEY);
  }, []);

  const getTotalSlots = useCallback(() => {
    return items.reduce((sum, item) => sum + item.slotsToBook, 0);
  }, [items]);

  const getSubtotal = useCallback(() => {
    return items.reduce(
      (sum, item) => sum + item.pricePerSlot * item.slotsToBook,
      0
    );
  }, [items]);

  const getPricing = useCallback(() => {
    if (items.length === 0) {
      return {
        subtotal: 0,
        discountPercentage: 0,
        discountApplied: 0,
        subtotalAfterDiscount: 0,
        vatPercentage: 20,
        vatAmount: 0,
        total: 0,
        currency: "GBP",
        tier: "none" as const,
      };
    }
    const subtotal = getSubtotal();
    const totalSlots = getTotalSlots();
    const currency = items[0].currency;
    const avgPricePerSlot = subtotal / totalSlots;
    return calculatePricing(totalSlots, avgPricePerSlot, currency);
  }, [items, getTotalSlots, getSubtotal]);

  return useMemo(() => ({
    items,
    isLoading,
    addItem,
    removeItem,
    updateItemSlots,
    clearCart,
    getTotalSlots,
    getSubtotal,
    getPricing,
    itemCount: items.length,
  }), [items, isLoading, addItem, removeItem, updateItemSlots, clearCart, getTotalSlots, getSubtotal, getPricing]);
});
