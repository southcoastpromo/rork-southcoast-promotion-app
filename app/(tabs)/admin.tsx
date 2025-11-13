import { StyleSheet, Text, View, TouchableOpacity, Alert, ActivityIndicator, ScrollView, TextInput, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard } from "react-native";
import { useAuth } from "../../contexts/AuthContext";
import { useCart } from "../../contexts/CartContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AlertCircle, Database, RefreshCw, Trash2, Info } from "lucide-react-native";
import { trpc } from "../../lib/trpc";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useState } from "react";
import { LoadingOverlay } from "../../components/LoadingOverlay";

interface SeedResult {
  rows_total: number;
  created: number;
  updated: number;
  archived: number;
  duration_ms: number;
  seed_version: string;
  mode: string;
  reset: boolean;
}

export default function AdminScreen() {
  const { isAdmin, adminToken, login, logout } = useAuth();
  const insets = useSafeAreaInsets();
  const { clearCart } = useCart();
  const [lastSeed, setLastSeed] = useState<SeedResult | null>(null);
  const [tokenInput, setTokenInput] = useState<string>("");

  const [isLoading, setIsLoading] = useState<boolean>(false);

  const seedMutation = trpc.admin.seed.useMutation({
    onSuccess: (data) => {
      setLastSeed(data);
      setIsLoading(false);
      Alert.alert('Success', `Seed completed: ${data.created} created, ${data.updated} updated${data.archived > 0 ? `, ${data.archived} archived` : ''}`);
    },
    onError: (error: Error) => {
      setIsLoading(false);
      Alert.alert('Error', error.message || 'Failed to run seed');
    },
  });

  const handleRunSeed = (mode: 'upsert' | 'replace' = 'upsert') => {
    Alert.alert(
      'Run Seed',
      `This will ${mode === 'replace' ? 'replace all data with' : 'upsert'} seed data. Continue?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Run',
          onPress: () => {
            if (!adminToken) {
              Alert.alert('Unauthorized', 'Admin token is missing. Please log in again.');
              return;
            }
            setIsLoading(true);
            seedMutation.mutate({ mode });
          },
        },
      ]
    );
  };

  const handleResetSeed = () => {
    Alert.alert(
      'Reset & Seed',
      'This will DELETE all data and load fresh seed data. This cannot be undone!',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => {
            if (!adminToken) {
              Alert.alert('Unauthorized', 'Admin token is missing. Please log in again.');
              return;
            }
            setIsLoading(true);
            seedMutation.mutate({ mode: 'upsert', reset: true });
          },
        },
      ]
    );
  };

  const handleLogin = async () => {
    if (!tokenInput) {
      Alert.alert("Error", "Please enter admin token");
      return;
    }

    setIsLoading(true);
    const success = await login(tokenInput);
    setIsLoading(false);

    if (success) {
      Alert.alert("Success", "Logged in as admin");
      setTokenInput("");
    } else {
      Alert.alert("Error", "Invalid token");
    }
  };

  const handleClearCache = async () => {
    Alert.alert(
      "Clear All Data",
      "This will remove all local data including your cart and admin session. Are you sure?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear All Data",
          style: "destructive",
          onPress: async () => {
            try {
              await AsyncStorage.clear();
              await clearCart();
              await logout();
              Alert.alert("Success", "All local data has been cleared");
            } catch (error) {
              console.error("Failed to clear cache:", error);
              Alert.alert("Error", "Failed to clear cache. Please try again.");
            }
          },
        },
      ]
    );
  };

  if (!isAdmin) {
    return (
      <KeyboardAvoidingView
        style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            bounces={false}
          >
            <View style={styles.header}>
              <Text style={styles.headerTitle}>Admin Login</Text>
            </View>

            <View style={styles.centerContainer}>
              <View style={styles.lockIcon}>
                <AlertCircle size={64} color="#FFFFFF" />
              </View>
              <Text style={styles.loginTitle}>Admin Access Required</Text>
              <Text style={styles.loginSubtext}>Enter your token to continue</Text>

              <View style={styles.loginCard}>
                <Text style={styles.label}>Admin Token</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter secure token"
                  value={tokenInput}
                  onChangeText={setTokenInput}
                  secureTextEntry
                  autoCapitalize="none"
                  autoCorrect={false}
                  placeholderTextColor="#666666"
                  returnKeyType="done"
                  onSubmitEditing={handleLogin}
                />

                <TouchableOpacity
                  style={[styles.button, styles.loginButton]}
                  onPress={handleLogin}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.buttonText}>Login</Text>
                  )}
                </TouchableOpacity>

                <Text style={styles.hint}>
                  Token is provided by system administrators
                </Text>
              </View>
            </View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    );
  }

  return (
    <>
      <LoadingOverlay visible={isLoading && seedMutation.isPending} message="Running seed operation..." />
      <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Admin Dashboard</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Database size={24} color="#FFFFFF" />
            <Text style={styles.sectionTitle}>Health Status</Text>
          </View>
          <View style={styles.card}>
            <View>
              <View style={styles.healthRow}>
                <Text style={styles.healthLabel}>Status:</Text>
                <Text style={styles.healthValue}>OK</Text>
              </View>
              <View style={styles.healthRow}>
                <Text style={styles.healthLabel}>Service:</Text>
                <Text style={styles.healthValue}>SouthCoast ProMotion API</Text>
              </View>
              <View style={styles.healthRow}>
                <Text style={styles.healthLabel}>Version:</Text>
                <Text style={styles.healthValue}>1.0.0</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <RefreshCw size={24} color="#FFFFFF" />
            <Text style={styles.sectionTitle}>Seed Data</Text>
          </View>
          
          {lastSeed && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Last Seed Result</Text>
              <View style={styles.seedStats}>
                <View style={styles.statRow}>
                  <Text style={styles.statLabel}>Version:</Text>
                  <Text style={styles.statValue}>{lastSeed.seed_version}</Text>
                </View>
                <View style={styles.statRow}>
                  <Text style={styles.statLabel}>Total Rows:</Text>
                  <Text style={styles.statValue}>{lastSeed.rows_total}</Text>
                </View>
                <View style={styles.statRow}>
                  <Text style={styles.statLabel}>Created:</Text>
                  <Text style={styles.statValue}>{lastSeed.created}</Text>
                </View>
                <View style={styles.statRow}>
                  <Text style={styles.statLabel}>Updated:</Text>
                  <Text style={styles.statValue}>{lastSeed.updated}</Text>
                </View>
                {lastSeed.archived > 0 && (
                  <View style={styles.statRow}>
                    <Text style={styles.statLabel}>Archived:</Text>
                    <Text style={styles.statValue}>{lastSeed.archived}</Text>
                  </View>
                )}
                <View style={styles.statRow}>
                  <Text style={styles.statLabel}>Duration:</Text>
                  <Text style={styles.statValue}>{lastSeed.duration_ms}ms</Text>
                </View>
              </View>
            </View>
          )}

          <View style={styles.buttonGroup}>
            <TouchableOpacity
              style={[styles.actionButton, styles.primaryButton]}
              onPress={() => handleRunSeed('upsert')}
              disabled={seedMutation.isPending}
            >
              {seedMutation.isPending ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <RefreshCw size={20} color="#FFFFFF" />
                  <Text style={styles.buttonText}>Run Seed (Upsert)</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.secondaryButton]}
              onPress={() => handleRunSeed('replace')}
              disabled={seedMutation.isPending}
            >
              {seedMutation.isPending ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Database size={20} color="#FFFFFF" />
                  <Text style={[styles.buttonText, { color: "#FFFFFF" }]}>Replace Mode</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.dangerButton]}
              onPress={handleResetSeed}
              disabled={seedMutation.isPending}
            >
              {seedMutation.isPending ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Trash2 size={20} color="#FFFFFF" />
                  <Text style={styles.buttonText}>Reset & Seed</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.infoBox}>
            <Text style={styles.infoTitle}>Seed Modes:</Text>
            <Text style={styles.infoText}>• <Text style={styles.infoBold}>Upsert:</Text> Updates existing records, creates new ones</Text>
            <Text style={styles.infoText}>• <Text style={styles.infoBold}>Replace:</Text> Archives old records not in seed data</Text>
            <Text style={styles.infoText}>• <Text style={styles.infoBold}>Reset:</Text> Deletes all data before seeding</Text>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Info size={24} color="#FFFFFF" />
            <Text style={styles.sectionTitle}>App Information</Text>
          </View>

          <View style={styles.card}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>App Name</Text>
              <Text style={styles.infoValue}>SouthCoast ProMotion</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Version</Text>
              <Text style={styles.infoValue}>1.0.0</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Platform</Text>
              <Text style={styles.infoValue}>Expo + React Native</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Trash2 size={24} color="#EF4444" />
            <Text style={[styles.sectionTitle, { color: "#EF4444" }]}>Danger Zone</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.dangerTitle}>Clear All Data</Text>
            <Text style={styles.dangerText}>
              This will clear your cart, logout your admin session, and reset all local app data. This action cannot be undone.
            </Text>

            <TouchableOpacity
              style={[styles.button, styles.clearDataButton]}
              onPress={handleClearCache}
            >
              <Trash2 size={20} color="#FFFFFF" />
              <Text style={styles.buttonText}>Clear Cache & Reset</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    padding: 20,
    paddingTop: 60,
    backgroundColor: "#000000",
    borderBottomWidth: 1,
    borderBottomColor: "#1F1F1F",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700" as const,
    color: "#FFFFFF",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    minHeight: 600,
  },
  lockIcon: {
    width: 96,
    height: 96,
    backgroundColor: "#1A1A1A",
    borderRadius: 48,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  loginTitle: {
    fontSize: 24,
    fontWeight: "700" as const,
    color: "#FFFFFF",
    marginBottom: 8,
  },
  loginSubtext: {
    fontSize: 16,
    color: "#AAAAAA",
    marginBottom: 32,
  },
  loginCard: {
    width: "100%",
    maxWidth: 400,
    backgroundColor: "#1A1A1A",
    borderRadius: 16,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  label: {
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
    backgroundColor: "#0A0A0A",
    marginBottom: 16,
  },
  content: {
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: "#FFFFFF",
  },
  card: {
    backgroundColor: "#1A1A1A",
    borderRadius: 12,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  healthRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
  },
  healthLabel: {
    fontSize: 14,
    color: "#AAAAAA",
  },
  healthValue: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: "#FFFFFF",
  },
  errorText: {
    fontSize: 14,
    color: "#EF4444",
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: "#FFFFFF",
    marginBottom: 12,
  },
  seedStats: {
    gap: 8,
  },
  statRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statLabel: {
    fontSize: 14,
    color: "#AAAAAA",
  },
  statValue: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: "#FFFFFF",
  },
  buttonGroup: {
    gap: 12,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 16,
    borderRadius: 8,
  },
  primaryButton: {
    backgroundColor: "#FFFFFF",
  },
  secondaryButton: {
    backgroundColor: "#1A1A1A",
    borderWidth: 1,
    borderColor: "#FFFFFF",
  },
  dangerButton: {
    backgroundColor: "#EF4444",
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 16,
    borderRadius: 8,
  },
  loginButton: {
    backgroundColor: "#FFFFFF",
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: "#000000",
  },
  secondaryButtonText: {
    color: "#FFFFFF",
  },
  hint: {
    fontSize: 13,
    color: "#666666",
    textAlign: "center",
    marginTop: 12,
    fontStyle: "italic" as const,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
  },
  infoLabel: {
    fontSize: 15,
    color: "#AAAAAA",
  },
  infoValue: {
    fontSize: 15,
    fontWeight: "600" as const,
    color: "#FFFFFF",
  },
  divider: {
    height: 1,
    backgroundColor: "#2A2A2A",
  },
  infoBox: {
    backgroundColor: "#1A1A1A",
    borderRadius: 8,
    padding: 16,
    marginTop: 12,
    borderWidth: 1,
    borderColor: "#333333",
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: "700" as const,
    color: "#FFFFFF",
    marginBottom: 8,
  },
  infoText: {
    fontSize: 13,
    color: "#AAAAAA",
    lineHeight: 20,
  },
  infoBold: {
    fontWeight: "700" as const,
  },
  dangerTitle: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: "#EF4444",
    marginBottom: 8,
  },
  dangerText: {
    fontSize: 14,
    color: "#AAAAAA",
    lineHeight: 20,
    marginBottom: 16,
  },
  clearDataButton: {
    backgroundColor: "#EF4444",
  },
});
