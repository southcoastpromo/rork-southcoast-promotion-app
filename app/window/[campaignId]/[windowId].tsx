import { StyleSheet, Text, View, TouchableOpacity, ActivityIndicator, ScrollView, Alert } from "react-native";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { trpc } from "../../../lib/trpc";
import { Calendar, Clock, MapPin, DollarSign, Users, Info, HelpCircle } from "lucide-react-native";
import { formatDateDisplay, formatPrice } from "../../../lib/utils";

export default function WindowDetailsScreen() {
  const { campaignId, windowId } = useLocalSearchParams<{ campaignId: string; windowId: string }>();
  const router = useRouter();

  const { data, isLoading, error } = trpc.campaigns.getWindow.useQuery(
    { campaignId: campaignId!, windowId: windowId! },
    { enabled: !!campaignId && !!windowId }
  );

  const window = data?.window;

  const handleBookNow = () => {
    if (!data || !window) return;

    const availableSlots = data.availableSlots;
    if (availableSlots === 0) {
      Alert.alert("Unavailable", "No slots available for this campaign window");
      return;
    }

    router.push(`/booking/${campaignId}/${windowId}` as any);
  };

  const openInfo = (fieldName: string) => {
    router.push(`/info/${fieldName}` as any);
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ title: "Loading..." }} />
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#FFFFFF" />
        </View>
      </View>
    );
  }

  if (error || !window || !data) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ title: "Error" }} />
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>Failed to load campaign window</Text>
        </View>
      </View>
    );
  }

  const availableSlots = data.availableSlots;
  const isFullyBooked = availableSlots === 0;

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: "Campaign Details",
          headerStyle: {
            backgroundColor: "#000000",
          },
          headerTintColor: "#FFFFFF",
        }}
      />

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.headerCard}>
          <View style={styles.campaignNameContainer}>
            <MapPin size={24} color="#888888" />
            <Text style={styles.campaignName}>{window.campaignName}</Text>
          </View>

          <View style={[
            styles.availabilityBanner,
            isFullyBooked ? styles.unavailableBanner : styles.availableBanner
          ]}>
            <Text style={[
              styles.availabilityText,
              isFullyBooked ? styles.unavailableText : styles.availableText
            ]}>
              {isFullyBooked ? "Fully Booked" : `${availableSlots} Slots Available`}
            </Text>
          </View>
        </View>

        <View style={styles.detailsSection}>
          <Text style={styles.sectionTitle}>Details</Text>

          <View style={styles.detailCard}>
            <View style={styles.detailRow}>
              <View style={styles.detailIcon}>
                <Calendar size={20} color="#888888" />
              </View>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Date</Text>
                <Text style={styles.detailValue}>{formatDateDisplay(window.date)}</Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.detailRow}>
              <View style={styles.detailIcon}>
                <Clock size={20} color="#888888" />
              </View>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Time</Text>
                <Text style={styles.detailValue}>
                  {window.startTime} - {window.endTime}
                </Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.detailRow}>
              <View style={styles.detailIcon}>
                <DollarSign size={20} color="#888888" />
              </View>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Price per Slot</Text>
                <Text style={styles.priceValue}>
                  {formatPrice(window.priceMinor, window.currency)}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.infoButton}
                onPress={() => openInfo('pricePerSlot')}
              >
                <HelpCircle size={20} color="#888888" />
              </TouchableOpacity>
            </View>

            <View style={styles.divider} />

            <View style={styles.detailRow}>
              <View style={styles.detailIcon}>
                <Users size={20} color="#888888" />
              </View>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Adverts per Slot</Text>
                <Text style={styles.detailValue}>{window.advertsPerSlot}</Text>
              </View>
              <TouchableOpacity
                style={styles.infoButton}
                onPress={() => openInfo('advertsPerSlot')}
              >
                <HelpCircle size={20} color="#888888" />
              </TouchableOpacity>
            </View>

            <View style={styles.divider} />

            <View style={styles.detailRow}>
              <View style={styles.detailIcon}>
                <Info size={20} color="#888888" />
              </View>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Availability</Text>
                <Text style={styles.detailValue}>
                  {availableSlots} / {window.slotsAvailable} slots
                </Text>
              </View>
              <TouchableOpacity
                style={styles.infoButton}
                onPress={() => openInfo('availability')}
              >
                <HelpCircle size={20} color="#888888" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={styles.pricingSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Bulk Discounts</Text>
            <TouchableOpacity
              style={styles.infoButton}
              onPress={() => openInfo('bulkDiscounts')}
            >
              <HelpCircle size={22} color="#888888" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.pricingCard}>
            <View style={styles.pricingRow}>
              <Text style={styles.pricingLabel}>2+ slots</Text>
              <Text style={styles.pricingDiscount}>10% off</Text>
            </View>
            <View style={styles.pricingRow}>
              <Text style={styles.pricingLabel}>4+ slots</Text>
              <Text style={styles.pricingDiscount}>15% off</Text>
            </View>
            <View style={styles.pricingRow}>
              <Text style={styles.pricingLabel}>6+ slots</Text>
              <Text style={styles.pricingDiscount}>20% off</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.bookButton, isFullyBooked && styles.disabledButton]}
          onPress={handleBookNow}
          disabled={isFullyBooked}
        >
          <Text style={styles.bookButtonText}>
            {isFullyBooked ? "Fully Booked" : "Book Now"}
          </Text>
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
  errorText: {
    fontSize: 16,
    color: "#EF4444",
  },
  content: {
    padding: 20,
  },
  headerCard: {
    backgroundColor: "#1A1A1A",
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  campaignNameContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
  },
  campaignTextContainer: {
    flex: 1,
  },
  campaignName: {
    fontSize: 24,
    fontWeight: "700" as const,
    color: "#FFFFFF",
  },
  campaignLocation: {
    fontSize: 16,
    color: "#FFFFFF",
    marginTop: 4,
  },
  availabilityBanner: {
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  availableBanner: {
    backgroundColor: "#D1FAE5",
  },
  unavailableBanner: {
    backgroundColor: "#FEE2E2",
  },
  availabilityText: {
    fontSize: 15,
    fontWeight: "600" as const,
  },
  availableText: {
    color: "#065F46",
  },
  unavailableText: {
    color: "#991B1B",
  },
  detailsSection: {
    marginBottom: 20,
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
  detailCard: {
    backgroundColor: "#1A1A1A",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
  },
  infoButton: {
    padding: 4,
    marginLeft: 8,
  },
  detailIcon: {
    width: 40,
    alignItems: "center",
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 13,
    color: "#AAAAAA",
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: "#FFFFFF",
  },
  priceValue: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: "#FFFFFF",
  },
  divider: {
    height: 1,
    backgroundColor: "#2A2A2A",
  },
  pricingSection: {
    marginBottom: 20,
  },
  pricingCard: {
    backgroundColor: "#1A1A1A",
    borderRadius: 12,
    padding: 16,
    gap: 12,
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
  },
  pricingLabel: {
    fontSize: 15,
    color: "#FFFFFF",
  },
  pricingDiscount: {
    fontSize: 15,
    fontWeight: "600" as const,
    color: "#888888",
  },
  footer: {
    padding: 20,
    backgroundColor: "#000000",
    borderTopWidth: 1,
    borderTopColor: "#1F1F1F",
  },
  bookButton: {
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  disabledButton: {
    backgroundColor: "#9CA3AF",
  },
  bookButtonText: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: "#000000",
  },
});
