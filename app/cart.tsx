import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Alert, TextInput, KeyboardAvoidingView, Platform, AccessibilityInfo } from "react-native";
import { useRouter, Stack } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useCart } from "../contexts/CartContext";
import { Trash2, ShoppingCart, CheckCircle, Calendar, Clock, MapPin, Minus, Plus } from "lucide-react-native";
import { useCallback, useState } from "react";
import { trpc } from "../lib/trpc";
import { haptics } from "../lib/haptics";
import { formatDateDisplay, formatPrice } from "../lib/utils";
import { LoadingOverlay } from "../components/LoadingOverlay";

export default function CartScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { items, removeItem, clearCart, getPricing, itemCount, getTotalSlots, updateItemSlots } = useCart();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  const pricing = itemCount > 0 ? getPricing() : null;

  const handleAdjustQuantity = useCallback((windowId: string, delta: number, maxAvailable: number) => {
    const cartItem = items.find((item) => item.windowId === windowId);
    if (!cartItem) {
      console.log(`[cart] item ${windowId} not found`);
      return;
    }

    const nextSlots = Math.max(1, Math.min(maxAvailable, cartItem.slotsToBook + delta));
    if (nextSlots === cartItem.slotsToBook) {
      return;
    }

    updateItemSlots(windowId, nextSlots);
    haptics.selection();
  }, [items, updateItemSlots]);

  const handleRemoveItem = useCallback((windowId: string, campaignName: string) => {
    haptics.warning();
    removeItem(windowId);
    AccessibilityInfo.announceForAccessibility(`Removed ${campaignName} from cart`);
  }, [removeItem]);

  const handleClearCart = useCallback(() => {
    if (items.length === 0) {
      return;
    }
    haptics.warning();
    clearCart();
    AccessibilityInfo.announceForAccessibility('Cart cleared');
  }, [clearCart, items.length]);

  const handleBrowseCampaigns = useCallback(() => {
    haptics.selection();
    router.push("/(tabs)/campaigns" as any);
  }, [router]);

  const bookingMutation = trpc.bookings.create.useMutation({
    onSuccess: () => {
      haptics.success();
      AccessibilityInfo.announceForAccessibility(`Booking successful! All ${itemCount} booking(s) have been confirmed.`);
      Alert.alert(
        "Bookings Confirmed!",
        `All ${itemCount} booking(s) have been confirmed!`,
        [
          {
            text: "OK",
            onPress: () => {
              clearCart();
              router.push("/(tabs)/campaigns" as any);
            },
          },
        ]
      );
    },
    onError: (error: any) => {
      haptics.error();
      AccessibilityInfo.announceForAccessibility(`Booking error: ${error.message || "Failed to create bookings"}`);
      Alert.alert(
        "Booking Error",
        error.message || "Failed to create bookings",
        [{ text: "OK" }]
      );
    },
  });

  const handleCheckout = () => {
    if (!name.trim() || !email.trim() || !phone.trim()) {
      haptics.error();
      AccessibilityInfo.announceForAccessibility("Error: Please fill in all contact details");
      Alert.alert("Error", "Please fill in all contact details");
      return;
    }

    if (items.length === 0) {
      haptics.error();
      AccessibilityInfo.announceForAccessibility("Error: Your cart is empty");
      Alert.alert("Error", "Your cart is empty");
      return;
    }

    haptics.impactMedium();

    Alert.alert(
      "Confirm Checkout",
      `You are about to book ${getTotalSlots()} slot(s) across ${itemCount} campaign window(s).\n\nTotal: ${formatPrice(pricing?.total ?? 0, pricing?.currency ?? "GBP")}`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Confirm",
          onPress: () => {
            haptics.warning();
            Alert.alert("Demo Mode", "Bulk booking API not yet implemented. Each booking would be created separately.");
          },
        },
      ]
    );
  };

  if (items.length === 0) {
    return (
      <View style={styles.container}>
        <Stack.Screen
          options={{
            title: "Cart",
            headerStyle: { backgroundColor: "#000000" },
            headerTintColor: "#FFFFFF",
          }}
        />
        <View style={styles.emptyContainer}>
          <ShoppingCart size={80} color="#D1D5DB" />
          <Text style={styles.emptyTitle}>Your cart is empty</Text>
          <Text style={styles.emptyText}>
            Add some campaign slots to get started
          </Text>
          <TouchableOpacity
            style={styles.browseCampaignsButton}
            onPress={handleBrowseCampaigns}
            accessibilityRole="button"
            accessibilityLabel="Browse campaigns"
            accessibilityHint="Navigates to the campaigns list"
            testID="cart-empty-browse-button"
          >
            <Text style={styles.browseCampaignsButtonText}>
              Browse Campaigns
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <>
      <LoadingOverlay visible={bookingMutation.isPending} message="Processing booking..." />
      <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={100}
    >
      <Stack.Screen
        options={{
          title: `Cart (${itemCount})`,
          headerStyle: { backgroundColor: "#000000" },
          headerTintColor: "#FFFFFF",
        }}
      />

      <ScrollView 
        contentContainerStyle={[styles.content, { paddingBottom: 24 + insets.bottom }]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              {getTotalSlots()} Slot{getTotalSlots() !== 1 ? 's' : ''} in Cart
            </Text>
            <TouchableOpacity
              onPress={handleClearCart}
              accessibilityRole="button"
              accessibilityLabel="Clear all items from cart"
              accessibilityHint="Removes every campaign slot from your cart"
              disabled={items.length === 0}
              accessibilityState={{ disabled: items.length === 0 }}
              testID="cart-clear-all-button"
            >
              <Text style={[styles.clearAllText, items.length === 0 && styles.disabledText]}>Clear All</Text>
            </TouchableOpacity>
          </View>

          {items.map((item) => (
            <View key={item.windowId} style={styles.cartItem}>
              <View style={styles.itemHeader}>
                <View style={styles.itemHeaderLeft}>
                  <MapPin size={18} color="#888888" />
                  <Text style={styles.campaignName}>{item.campaignName}</Text>
                </View>
                <TouchableOpacity
                  onPress={() => handleRemoveItem(item.windowId, item.campaignName)}
                  style={styles.removeButton}
                  accessibilityRole="button"
                  accessibilityLabel={`Remove ${item.campaignName} from cart`}
                  accessibilityHint="Removes this campaign slot from your cart"
                  testID={`cart-item-${item.windowId}-remove`}
                >
                  <Trash2 size={20} color="#EF4444" />
                </TouchableOpacity>
              </View>

              <View style={styles.itemDetails}>
                <View style={styles.itemDetailRow}>
                  <Calendar size={16} color="#6B7280" />
                  <Text style={styles.itemDetailText}>
                    {formatDateDisplay(item.date)}
                  </Text>
                </View>

                <View style={styles.itemDetailRow}>
                  <Clock size={16} color="#6B7280" />
                  <Text style={styles.itemDetailText}>
                    {item.startTime} - {item.endTime}
                  </Text>
                </View>
              </View>

              <View style={styles.quantityContainer}>
                <Text style={styles.quantityLabel}>Slots</Text>
                <View style={styles.quantityControls}>
                  <TouchableOpacity
                    style={[styles.quantityButton, item.slotsToBook <= 1 && styles.quantityButtonDisabled]}
                    onPress={() => handleAdjustQuantity(item.windowId, -1, item.maxAvailable)}
                    disabled={item.slotsToBook <= 1}
                    accessibilityRole="button"
                    accessibilityLabel={`Decrease quantity for ${item.campaignName}`}
                    accessibilityHint="Reduces slots by one"
                    accessibilityState={{ disabled: item.slotsToBook <= 1 }}
                    testID={`cart-item-${item.windowId}-decrement`}
                  >
                    <Minus size={18} color={item.slotsToBook <= 1 ? "#6B7280" : "#FFFFFF"} />
                  </TouchableOpacity>
                  <Text style={styles.quantityValue}>{item.slotsToBook}</Text>
                  <TouchableOpacity
                    style={[styles.quantityButton, item.slotsToBook >= item.maxAvailable && styles.quantityButtonDisabled]}
                    onPress={() => handleAdjustQuantity(item.windowId, 1, item.maxAvailable)}
                    disabled={item.slotsToBook >= item.maxAvailable}
                    accessibilityRole="button"
                    accessibilityLabel={`Increase quantity for ${item.campaignName}`}
                    accessibilityHint="Increases slots by one"
                    accessibilityState={{ disabled: item.slotsToBook >= item.maxAvailable }}
                    testID={`cart-item-${item.windowId}-increment`}
                  >
                    <Plus size={18} color={item.slotsToBook >= item.maxAvailable ? "#6B7280" : "#FFFFFF"} />
                  </TouchableOpacity>
                </View>
                <Text style={styles.quantityHint}>
                  {Math.max(0, item.maxAvailable - item.slotsToBook)} of {item.maxAvailable} slots available
                </Text>
              </View>

              <View style={styles.itemPricing}>
                <Text style={styles.itemSlotsText}>
                  {item.slotsToBook} × {formatPrice(item.pricePerSlot, item.currency)}
                </Text>
                <Text style={styles.itemTotalText}>
                  {formatPrice(item.slotsToBook * item.pricePerSlot, item.currency)}
                </Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Details</Text>

          <View style={styles.formCard}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Full Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="John Doe"
                value={name}
                onChangeText={setName}
                placeholderTextColor="#666666"
                returnKeyType="next"
                accessibilityLabel="Full name"
                testID="cart-input-name"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Email *</Text>
              <TextInput
                style={styles.input}
                placeholder="john@example.com"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholderTextColor="#666666"
                returnKeyType="next"
                accessibilityLabel="Email address"
                testID="cart-input-email"
              />
            </View>

            <View style={[styles.inputGroup, styles.lastInput]}>
              <Text style={styles.inputLabel}>Phone *</Text>
              <TextInput
                style={styles.input}
                placeholder="+44 123 456 7890"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                placeholderTextColor="#666666"
                returnKeyType="done"
                accessibilityLabel="Phone number"
                testID="cart-input-phone"
              />
            </View>
          </View>
        </View>

        {pricing && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Order Summary</Text>

            <View style={styles.summaryCard}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Subtotal ({getTotalSlots()} slots)</Text>
                <Text style={styles.summaryValue}>{formatPrice(pricing.subtotal, pricing.currency)}</Text>
              </View>

              {pricing.discountPercentage > 0 && (
                <>
                  <View style={styles.discountBadge}>
                    <Text style={styles.discountBadgeText}>
                      {pricing.tier} Bulk Discount Applied!
                    </Text>
                  </View>

                  <View style={styles.summaryRow}>
                    <Text style={styles.discountLabel}>Discount ({pricing.discountPercentage}%)</Text>
                    <Text style={styles.discountValue}>-{formatPrice(pricing.discountApplied, pricing.currency)}</Text>
                  </View>

                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>After Discount</Text>
                    <Text style={styles.summaryValue}>{formatPrice(pricing.subtotalAfterDiscount, pricing.currency)}</Text>
                  </View>
                </>
              )}

              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>VAT ({pricing.vatPercentage}%)</Text>
                <Text style={styles.summaryValue}>{formatPrice(pricing.vatAmount, pricing.currency)}</Text>
              </View>

              <View style={styles.summaryDivider} />

              <View style={styles.summaryRow}>
                <Text style={styles.totalLabel}>Total (inc. VAT)</Text>
                <Text style={styles.totalValue}>{formatPrice(pricing.total, pricing.currency)}</Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      <View style={[styles.checkoutBar, { paddingBottom: Math.max(24, 16 + insets.bottom) }]}>
        <TouchableOpacity
          style={[styles.checkoutButton, bookingMutation.isPending && styles.disabledButton]}
          onPress={handleCheckout}
          disabled={bookingMutation.isPending}
          accessibilityRole="button"
          accessibilityLabel="Proceed to checkout"
          accessibilityHint="Starts the booking confirmation process"
          accessibilityState={{ disabled: bookingMutation.isPending }}
          testID="cart-checkout-button"
        >
          <CheckCircle size={22} color="#000000" />
          <Text style={styles.checkoutButtonText}>
            Checkout - {pricing && formatPrice(pricing.total, pricing.currency)}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: "700" as const,
    color: "#FFFFFF",
    marginTop: 24,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: "#AAAAAA",
    textAlign: "center",
    marginBottom: 32,
  },
  browseCampaignsButton: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 8,
    minHeight: 48,
  },
  browseCampaignsButtonText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: "#000000",
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: "700" as const,
    color: "#FFFFFF",
  },
  clearAllText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: "#EF4444",
  },
  disabledText: {
    opacity: 0.4,
  },
  cartItem: {
    backgroundColor: "#1A1A1A",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  itemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  itemHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  campaignName: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: "#FFFFFF",
    flex: 1,
  },
  removeButton: {
    padding: 12,
    minWidth: 48,
    minHeight: 48,
    justifyContent: "center",
    alignItems: "center",
  },
  itemDetails: {
    gap: 8,
    marginBottom: 12,
  },
  quantityContainer: {
    marginTop: 12,
    marginBottom: 12,
    backgroundColor: "#131313",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#2A2A2A",
  },
  quantityLabel: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: "#AAAAAA",
    marginBottom: 8,
  },
  quantityControls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  quantityButton: {
    width: 48,
    height: 48,
    minWidth: 48,
    minHeight: 48,
    borderRadius: 22,
    backgroundColor: "#1F1F1F",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#333333",
  },
  quantityButtonDisabled: {
    opacity: 0.4,
  },
  quantityValue: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: "#FFFFFF",
  },
  quantityHint: {
    marginTop: 8,
    fontSize: 12,
    color: "#666666",
  },
  itemDetailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  itemDetailText: {
    fontSize: 15,
    color: "#AAAAAA",
  },
  itemPricing: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#2A2A2A",
  },
  itemSlotsText: {
    fontSize: 15,
    color: "#AAAAAA",
  },
  itemTotalText: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: "#FFFFFF",
  },
  formCard: {
    backgroundColor: "#1A1A1A",
    borderRadius: 12,
    padding: 16,
  },
  inputGroup: {
    marginBottom: 20,
  },
  lastInput: {
    marginBottom: 0,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: "#FFFFFF",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#333333",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: "#FFFFFF",
    backgroundColor: "#0A0A0A",
  },
  summaryCard: {
    backgroundColor: "#1A1A1A",
    borderRadius: 12,
    padding: 20,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  summaryLabel: {
    fontSize: 16,
    color: "#AAAAAA",
    fontWeight: "500" as const,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: "#FFFFFF",
  },
  discountBadge: {
    backgroundColor: "#2A2A2A",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  discountBadgeText: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: "#FFFFFF",
    textAlign: "center",
  },
  discountLabel: {
    fontSize: 16,
    color: "#888888",
    fontWeight: "600" as const,
  },
  discountValue: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: "#888888",
  },
  summaryDivider: {
    height: 1,
    backgroundColor: "#333333",
    marginVertical: 8,
    marginBottom: 16,
  },
  totalLabel: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: "#FFFFFF",
  },
  totalValue: {
    fontSize: 24,
    fontWeight: "700" as const,
    color: "#FFFFFF",
  },
  checkoutBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingBottom: 16,
    backgroundColor: "#000000",
    borderTopWidth: 1,
    borderTopColor: "#333333",
  },
  checkoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: "#FFFFFF",
    paddingVertical: 18,
    borderRadius: 12,
  },
  disabledButton: {
    opacity: 0.6,
  },
  checkoutButtonText: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: "#000000",
  },
});
