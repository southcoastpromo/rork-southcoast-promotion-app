import { StyleSheet, Text, View, TouchableOpacity, Dimensions } from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width, height } = Dimensions.get("window");

export default function LandingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.safeWrapper}>
      <View style={[styles.mainContainer, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <View style={styles.content}>
          <View style={styles.topSection}>
            <Text style={styles.header}>SouthCoast ProMotion</Text>
          </View>

          <View style={styles.imageContainer}>
            <Image
              source={{ uri: "https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/64yavb0x37zo0g2jv2akz" }}
              style={styles.vanImage}
              contentFit="contain"
              transition={200}
              cachePolicy="memory-disk"
            />
          </View>

          <View style={styles.ctaSection}>
            <TouchableOpacity
              style={styles.bookButton}
              onPress={() => router.push("/(tabs)/campaigns")}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="Book a SouthCoast ProMotion campaign"
              accessibilityHint="Navigates to the campaigns list"
              testID="landing-book-button"
            >
              <Text style={styles.bookButtonText}>Book Now</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>© FYP Media Ltd</Text>
            <Text style={styles.footerText}>07534 375 290</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeWrapper: {
    flex: 1,
    backgroundColor: "#000000",
  },
  mainContainer: {
    flex: 1,
    backgroundColor: "#000000",
  },
  content: {
    flex: 1,
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  topSection: {
    paddingTop: 40,
    alignItems: "center",
  },
  header: {
    fontSize: 32,
    fontWeight: "800" as const,
    color: "#FFFFFF",
    textAlign: "center",
    letterSpacing: 0.5,
  },
  imageContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    paddingVertical: 20,
  },
  vanImage: {
    width: width * 0.9,
    height: height * 0.4,
    maxWidth: 600,
    maxHeight: 400,
  },
  ctaSection: {
    width: "100%",
    paddingBottom: 20,
  },
  bookButton: {
    backgroundColor: "#FFFFFF",
    paddingVertical: 18,
    paddingHorizontal: 48,
    borderRadius: 12,
    shadowColor: "#FFFFFF",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  bookButtonText: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: "#000000",
    textAlign: "center",
    letterSpacing: 0.5,
  },
  footer: {
    paddingBottom: 20,
    alignItems: "center",
    gap: 4,
  },
  footerText: {
    fontSize: 14,
    color: "#999999",
    textAlign: "center",
  },
});
