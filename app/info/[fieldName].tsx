import { StyleSheet, Text, View, TouchableOpacity, ScrollView } from "react-native";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { ArrowLeft } from "lucide-react-native";

const FIELD_INFO: Record<string, { title: string; description: string }> = {
  date: {
    title: "Date",
    description: "This is the date when your advertisement will be displayed. The campaign will run on this specific day. Make sure this aligns with your marketing calendar and business objectives."
  },
  time: {
    title: "Time",
    description: "This is the time window during which your advertisement will be displayed. Your ad will be shown during this period throughout the day. Choose times that match when your target audience is most active."
  },
  pricePerSlot: {
    title: "Price per Slot",
    description: "This is the cost for one advertising slot. Each slot gives you a dedicated space for your advertisement during the campaign window. Volume discounts are available for booking multiple slots."
  },
  advertsPerSlot: {
    title: "Adverts per Slot",
    description: "This indicates how many individual advertisements can be shown in rotation during each slot. Your advertisement will be one of these in the rotation, ensuring regular visibility throughout the time period."
  },
  availability: {
    title: "Availability",
    description: "This shows the number of slots currently available for booking versus the total slots offered. Book early to secure your preferred slots as popular time windows fill up quickly."
  },
  bulkDiscounts: {
    title: "Bulk Discounts",
    description: "Save money by booking multiple slots! We offer tiered discounts: 10% off for 2+ slots, 15% off for 4+ slots, and 20% off for 6+ slots. The discount is automatically applied at checkout."
  },
  vat: {
    title: "VAT",
    description: "Value Added Tax (VAT) at 20% is applied to all bookings. This is the standard UK VAT rate and will be included in your final total. VAT invoices are provided for all confirmed bookings."
  },
  selectSlots: {
    title: "Select Slots",
    description: "Choose how many advertising slots you want to book for this campaign window. The more slots you book, the greater your visibility and the bigger discount you receive."
  },
};

export default function InfoScreen() {
  const { fieldName } = useLocalSearchParams<{ fieldName: string }>();
  const router = useRouter();

  const info = FIELD_INFO[fieldName || ""] || {
    title: "Information",
    description: "Detailed information about this field will be displayed here."
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: info.title,
          headerStyle: {
            backgroundColor: "#000000",
          },
          headerTintColor: "#FFFFFF",
        }}
      />

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>{info.title}</Text>
          <Text style={styles.infoDescription}>{info.description}</Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.returnButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={20} color="#FFFFFF" />
          <Text style={styles.returnButtonText}>Return to Booking</Text>
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
  content: {
    padding: 20,
  },
  infoCard: {
    backgroundColor: "#1A1A1A",
    borderRadius: 12,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoTitle: {
    fontSize: 24,
    fontWeight: "700" as const,
    color: "#0066CC",
    marginBottom: 16,
  },
  infoDescription: {
    fontSize: 16,
    lineHeight: 24,
    color: "#FFFFFF",
  },
  footer: {
    padding: 20,
    backgroundColor: "#000000",
    borderTopWidth: 1,
    borderTopColor: "#1F1F1F",
  },
  returnButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#0066CC",
    padding: 16,
    borderRadius: 8,
  },
  returnButtonText: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: "#FFFFFF",
  },
});
