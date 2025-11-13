import { StyleSheet, Text, View, TouchableOpacity, ActivityIndicator, ScrollView, Alert, AccessibilityInfo } from "react-native";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { trpc } from "../../../lib/trpc";
import { useState, useMemo, useCallback } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Minus, Plus, ShoppingCart, HelpCircle } from "lucide-react-native";
import { useCart } from "../../../contexts/CartContext";
import { haptics } from "../../../lib/haptics";
import { formatPrice } from "../../../lib/utils";

export default function BookingScreen() {
  const { campaignId, windowId } = useLocalSearchParams<{ campaignId: string; windowId: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { addItem } = useCart();

  const [slotsToBook, setSlotsToBook] = useState(1);

  const { data, isLoading } = trpc.campaigns.getWindow.useQuery(
    { campaignId: campaignId!, windowId: windowId! },
    { enabled: !!campaignId && !!windowId }
  );

  const window = data?.window;
  const availableSlots = data?.availableSlots ?? 0;

  const pricing = useMemo(() => {
    if (!window) return null;

    const subtotal = slotsToBook * window.priceMinor;
    let discountPercentage = 0;
    let tier = 'none';

    if (slotsToBook >= 6) {
      discountPercentage = 20;
      tier = '20%';
    } else if (slotsToBook >= 4) {
      discountPercentage = 15;
      tier = '15%';
    } else if (slotsToBook >= 2) {
      discountPercentage = 10;
      tier = '10%';
    }

    const discountApplied = Math.round(subtotal * (discountPercentage / 100));
    const subtotalAfterDiscount = subtotal - discountApplied;
    
    const vatPercentage = 20;
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
      tier,
    };
  }, [window, slotsToBook]);

  const handleDecrease = useCallback(() => {
    setSlotsToBook((current) => {
      const nextValue = Math.max(1, current - 1);
      if (nextValue !== current) {
        haptics.selection();
      }
      return nextValue;
    });
  }, []);

  const handleIncrease = useCallback(() => {
    setSlotsToBook((current) => {
      if (availableSlots <= 1 && current >= availableSlots) {
        return Math.max(1, current);
      }
      const nextValue = Math.max(1, Math.min(availableSlots, current + 1));
      if (nextValue !== current) {
        haptics.selection();
      }
      return nextValue;
    });
  }, [availableSlots]);

  const handleAddToCart = useCallback(() => {
    if (!window) {
      haptics.error();
      AccessibilityInfo.announceForAccessibility("Error: Campaign window details missing");
      Alert.alert("Unavailable", "Campaign window details missing");
      return;
    }

    addItem({
      windowId: windowId!,
      campaignId: campaignId!,
      campaignName: window.campaignName,
      date: window.date,
      startTime: window.startTime,
      endTime: window.endTime,
      slotsToBook,
      pricePerSlot: window.priceMinor,
      currency: window.currency,
      maxAvailable: availableSlots,
      advertsPerSlot: window.advertsPerSlot,
    });

    haptics.success();
    AccessibilityInfo.announceForAccessibility(`Success! ${slotsToBook} slot${slotsToBook === 1 ? "" : "s"} added to cart`);

    Alert.alert(
      "Added to Cart",
      `${slotsToBook} slot${slotsToBook === 1 ? "" : "s"} added to your cart.\n\nWould you like to add more dates or slots?`,
      [
        {
          text: "View Cart",
          onPress: () => router.push("/cart" as any),
        },
        {
          text: "Add More",
          onPress: () => router.back(),
          style: "cancel",
        },
      ]
    );
  }, [addItem, availableSlots, campaignId, router, slotsToBook, window, windowId]);

  const openInfo = useCallback((fieldName: string) => {
    router.push(`/info/${fieldName}` as any);
  }, [router]);

  if (isLoading || !window) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ title: "Loading..." }} />
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#FFFFFF" />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: "Book Campaign",
          headerStyle: {
            backgroundColor: "#000000",
          },
          headerTintColor: "#FFFFFF",
        }}
      />

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: 20 + insets.bottom }]}>
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Select Slots</Text>
            <TouchableOpacity
              style={styles.infoButton}
              onPress={() => openInfo("selectSlots")}
              accessibilityRole="button"
              accessibilityLabel="Learn about selecting slots"
              accessibilityHint="Opens detailed information"
              testID="booking-info-select-slots"
            >
              <HelpCircle size={22} color="#888888" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.slotsCard}>
            <TouchableOpacity
              style={[styles.slotButton, slotsToBook <= 1 && styles.slotButtonDisabled]}
              onPress={handleDecrease}
              disabled={slotsToBook <= 1}
              accessibilityRole="button"
              accessibilityLabel="Decrease slots"
              accessibilityHint="Reduces the number of slots by one"
              accessibilityState={{ disabled: slotsToBook <= 1 }}
              testID="booking-decrement-button"
            >
              <Minus size={24} color={slotsToBook <= 1 ? "#9CA3AF" : "#FFFFFF"} />
            </TouchableOpacity>

            <View style={styles.slotsDisplay}>
              <Text style={styles.slotsNumber}>{slotsToBook}</Text>
              <Text style={styles.slotsLabel}>slots</Text>
            </View>

            <TouchableOpacity
              style={[styles.slotButton, slotsToBook >= availableSlots && styles.slotButtonDisabled]}
              onPress={handleIncrease}
              disabled={slotsToBook >= availableSlots}
              accessibilityRole="button"
              accessibilityLabel="Increase slots"
              accessibilityHint="Increases the number of slots by one"
              accessibilityState={{ disabled: slotsToBook >= availableSlots }}
              testID="booking-increment-button"
            >
              <Plus size={24} color={slotsToBook >= availableSlots ? "#9CA3AF" : "#FFFFFF"} />
            </TouchableOpacity>
          </View>

          <Text style={styles.availabilityNote}>
            {availableSlots} slots available
          </Text>
        </View>

        {pricing && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Pricing Summary</Text>
            
            <View style={styles.pricingCard}>
              {pricing.discountPercentage > 0 && (
                <View style={styles.discountBanner}>
                  <Text style={styles.discountText}>
                    {pricing.tier} Bulk Discount Applied!
                  </Text>
                </View>
              )}

              <View style={styles.pricingRow}>
                <Text style={styles.pricingLabel}>
                  {slotsToBook} slot(s) × {formatPrice(window.priceMinor, window.currency)}
                </Text>
                <Text style={styles.pricingValue}>
                  {formatPrice(pricing.subtotal, window.currency)}
                </Text>
              </View>

              {pricing.discountPercentage > 0 && (
                <>
                  <View style={styles.pricingRow}>
                    <Text style={styles.discountLabel}>
                      Discount ({pricing.discountPercentage}%)
                    </Text>
                    <Text style={styles.discountValue}>
                      -{formatPrice(pricing.discountApplied, window.currency)}
                    </Text>
                  </View>

                  <View style={styles.pricingRow}>
                    <Text style={styles.pricingLabel}>
                      Subtotal after discount
                    </Text>
                    <Text style={styles.pricingValue}>
                      {formatPrice(pricing.subtotalAfterDiscount, window.currency)}
                    </Text>
                  </View>
                </>
              )}

              <View style={styles.pricingRow}>
                <View style={styles.vatLabelContainer}>
                  <Text style={styles.pricingLabel}>
                    VAT ({pricing.vatPercentage}%)
                  </Text>
                  <TouchableOpacity
                    style={styles.infoButtonSmall}
                    onPress={() => openInfo("vat")}
                    accessibilityRole="button"
                    accessibilityLabel="VAT information"
                    accessibilityHint="Opens a screen that explains VAT"
                    testID="booking-info-vat"
                  >
                    <HelpCircle size={16} color="#888888" />
                  </TouchableOpacity>
                </View>
                <Text style={styles.pricingValue}>
                  {formatPrice(pricing.vatAmount, window.currency)}
                </Text>
              </View>

              <View style={styles.divider} />

              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Total (inc. VAT)</Text>
                <Text style={styles.totalValue}>
                  {formatPrice(pricing.total, window.currency)}
                </Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: 20 + insets.bottom }]}> 
        <TouchableOpacity
          style={styles.addToCartButton}
          onPress={handleAddToCart}
          accessibilityRole="button"
          accessibilityLabel="Add selected slots to cart"
          accessibilityHint="Adds the campaign slots to your cart"
          testID="booking-add-to-cart-button"
        >
          <ShoppingCart size={20} color="#000000" />
          <Text style={styles.addToCartButtonText}>Add to Cart</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: "#FFFFFF",
    marginBottom: 12,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  infoButton: {
    padding: 4,
  },
  infoButtonSmall: {
    padding: 2,
    marginLeft: 6,
  },

  slotsCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#1A1A1A",
    borderRadius: 12,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  slotButton: {
    width: 50,
    height: 50,
    minWidth: 48,
    minHeight: 48,
    borderRadius: 25,
    backgroundColor: "#2A2A2A",
    justifyContent: "center",
    alignItems: "center",
  },
  slotButtonDisabled: {
    opacity: 0.5,
  },
  slotsDisplay: {
    alignItems: "center",
    flex: 1,
  },
  slotsNumber: {
    fontSize: 48,
    fontWeight: "700" as const,
    color: "#FFFFFF",
  },
  slotsLabel: {
    fontSize: 14,
    color: "#AAAAAA",
    marginTop: 4,
  },
  availabilityNote: {
    fontSize: 13,
    color: "#AAAAAA",
    textAlign: "center",
    marginTop: 8,
  },
  formCard: {
    backgroundColor: "#1A1A1A",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: "#FFFFFF",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#333333",
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    color: "#FFFFFF",
    backgroundColor: "#1A1A1A",
  },
  pricingCard: {
    backgroundColor: "#1A1A1A",
    borderRadius: 12,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  pricingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    minHeight: 24,
  },
  pricingLabel: {
    fontSize: 15,
    color: "#AAAAAA",
    flexShrink: 1,
    marginRight: 16,
  },
  pricingValue: {
    fontSize: 17,
    fontWeight: "600" as const,
    color: "#FFFFFF",
    minWidth: 100,
    textAlign: "right",
  },
  vatLabelContainer: {
    flexDirection: "row",
    alignItems: "center",
    flexShrink: 1,
    marginRight: 16,
  },
  discountBanner: {
    backgroundColor: "#2A2A2A",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  discountText: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: "#FFFFFF",
    textAlign: "center",
  },
  discountLabel: {
    fontSize: 15,
    color: "#888888",
    flexShrink: 1,
    marginRight: 16,
  },
  discountValue: {
    fontSize: 17,
    fontWeight: "600" as const,
    color: "#888888",
    minWidth: 100,
    textAlign: "right",
  },
  divider: {
    height: 1,
    backgroundColor: "#2A2A2A",
    marginTop: 8,
    marginBottom: 16,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    minHeight: 32,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: "#FFFFFF",
    flexShrink: 1,
    marginRight: 16,
  },
  totalValue: {
    fontSize: 24,
    fontWeight: "700" as const,
    color: "#FFFFFF",
    minWidth: 120,
    textAlign: "right",
  },
  footer: {
    padding: 20,
    backgroundColor: "#000000",
    borderTopWidth: 1,
    borderTopColor: "#1F1F1F",
  },
  addToCartButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 8,
    minHeight: 48,
  },
  addToCartButtonText: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: "#000000",
  },
});
