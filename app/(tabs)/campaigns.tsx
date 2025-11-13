import { StyleSheet, Text, View, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl, Modal, ScrollView, TextInput, KeyboardAvoidingView, Platform, AccessibilityInfo } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "expo-router";
import { parse, isValid } from "date-fns";
import { Filter, X, Calendar, Clock, MapPin, ChevronRight, ShoppingCart, Check, AlertCircle } from "lucide-react-native";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { trpc } from "../../lib/trpc";
import { CampaignWindow } from "../../types/models";
import { useCart } from "../../contexts/CartContext";
import { formatPrice, formatDateDisplay } from "../../lib/utils";

const LOCATIONS = [
  "BRIGHTON",
  "TONBRIDGE/TUNBRIDGE WELLS",
  "MAIDSTONE",
  "EASTBOURNE",
  "HASTINGS",
  "HASTINGS/BEXHILL"
];

const FILTERS_STORAGE_KEY = '@campaigns_filters_v1';

export default function CampaignsScreen() {
  const router = useRouter();
  const { itemCount } = useCart();
  const [filters, setFilters] = useState<{
    dateFrom?: string;
    dateTo?: string;
    locations: string[];
  }>({
    locations: [],
  });
  const [showFilters, setShowFilters] = useState(false);
  const [tempFilters, setTempFilters] = useState(filters);
  const [page, setPage] = useState(1);
  const [dateErrors, setDateErrors] = useState<{ dateFrom?: string; dateTo?: string }>({});
  const [isLoadingFilters, setIsLoadingFilters] = useState(true);

  const { data, isLoading, refetch, isRefetching, error } = trpc.campaigns.getAll.useQuery({
    page,
  });

  useEffect(() => {
    loadFilters();
  }, []);

  const loadFilters = async () => {
    try {
      const stored = await AsyncStorage.getItem(FILTERS_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setFilters(parsed);
        setTempFilters(parsed);
      }
    } catch (err) {
      console.error('[campaigns] Failed to load filters:', err);
    } finally {
      setIsLoadingFilters(false);
    }
  };

  const saveFilters = async (newFilters: typeof filters) => {
    try {
      await AsyncStorage.setItem(FILTERS_STORAGE_KEY, JSON.stringify(newFilters));
    } catch (err) {
      console.error('[campaigns] Failed to save filters:', err);
    }
  };

  useEffect(() => {
    if (!showFilters) {
      setTempFilters(filters);
    }
  }, [showFilters, filters]);

  const filteredData = useMemo(() => {
    if (!data?.data) return [];
    
    let filtered = data.data;
    
    filtered = filtered.map(group => {
      let windows = group.windows;
      
      if (filters.dateFrom || filters.dateTo) {
        windows = windows.filter((window) => {
          const windowDate = parse(window.date, 'yyyy-MM-dd', new Date());
          let matches = true;
          
          if (filters.dateFrom) {
            try {
              const fromDate = parse(filters.dateFrom, 'dd/MM/yyyy', new Date());
              if (windowDate < fromDate) matches = false;
            } catch (e) {
              console.log('Invalid from date format');
            }
          }
          
          if (filters.dateTo && matches) {
            try {
              const toDate = parse(filters.dateTo, 'dd/MM/yyyy', new Date());
              if (windowDate > toDate) matches = false;
            } catch (e) {
              console.log('Invalid to date format');
            }
          }
          
          return matches;
        });
      }
      
      if (filters.locations.length > 0) {
        windows = windows.filter((window) =>
          filters.locations.includes(window.campaignName)
        );
      }
      
      return {
        ...group,
        windows,
      };
    }).filter(group => group.windows.length > 0);
    
    return filtered;
  }, [data, filters]);

  const validateDateInput = useCallback((dateStr: string): { isValid: boolean; error?: string } => {
    if (!dateStr || dateStr.trim() === '') {
      return { isValid: true };
    }

    const dateRegex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
    const match = dateStr.match(dateRegex);
    
    if (!match) {
      return { isValid: false, error: 'Use format DD/MM/YYYY' };
    }

    const [, day, month, year] = match;
    const dayNum = parseInt(day, 10);
    const monthNum = parseInt(month, 10);
    const yearNum = parseInt(year, 10);

    if (dayNum < 1 || dayNum > 31) {
      return { isValid: false, error: 'Day must be 1-31' };
    }
    if (monthNum < 1 || monthNum > 12) {
      return { isValid: false, error: 'Month must be 1-12' };
    }
    if (yearNum < 2000 || yearNum > 2100) {
      return { isValid: false, error: 'Year must be 2000-2100' };
    }

    try {
      const parsed = parse(dateStr, 'dd/MM/yyyy', new Date());
      if (!isValid(parsed)) {
        return { isValid: false, error: 'Invalid date' };
      }
    } catch (e) {
      return { isValid: false, error: 'Invalid date' };
    }

    return { isValid: true };
  }, []);

  const handleApplyFilters = useCallback(() => {
    const errors: { dateFrom?: string; dateTo?: string } = {};
    
    const fromValidation = validateDateInput(tempFilters.dateFrom || '');
    const toValidation = validateDateInput(tempFilters.dateTo || '');
    
    if (!fromValidation.isValid && tempFilters.dateFrom) {
      errors.dateFrom = fromValidation.error;
    }
    if (!toValidation.isValid && tempFilters.dateTo) {
      errors.dateTo = toValidation.error;
    }

    if (tempFilters.dateFrom && tempFilters.dateTo && fromValidation.isValid && toValidation.isValid) {
      const fromDate = parse(tempFilters.dateFrom, 'dd/MM/yyyy', new Date());
      const toDate = parse(tempFilters.dateTo, 'dd/MM/yyyy', new Date());
      
      if (fromDate > toDate) {
        errors.dateTo = 'End date must be after start date';
      }
    }

    if (Object.keys(errors).length > 0) {
      setDateErrors(errors);
      AccessibilityInfo.announceForAccessibility(`Filter error: ${Object.values(errors).join(', ')}`);
      return;
    }

    setDateErrors({});
    setFilters(tempFilters);
    saveFilters(tempFilters);
    setShowFilters(false);
    setPage(1);
    AccessibilityInfo.announceForAccessibility('Filters applied successfully');
  }, [tempFilters, validateDateInput]);

  const handleClearFilters = useCallback(() => {
    const clearedFilters = {
      dateFrom: undefined,
      dateTo: undefined,
      locations: [],
    };
    setTempFilters(clearedFilters);
    setFilters(clearedFilters);
    setDateErrors({});
    saveFilters(clearedFilters);
    setShowFilters(false);
    setPage(1);
    AccessibilityInfo.announceForAccessibility('Filters cleared');
  }, []);

  const toggleLocation = useCallback((location: string) => {
    setTempFilters(prev => ({
      ...prev,
      locations: prev.locations.includes(location)
        ? prev.locations.filter(l => l !== location)
        : [...prev.locations, location]
    }));
  }, []);

  const renderCampaignGroup = ({ item }: { item: any }) => {
    const { campaign, windows } = item;
    
    return (
      <View style={styles.groupContainer}>
        {campaign && (
          <View style={styles.campaignHeader}>
            <MapPin size={20} color="#888888" />
            <View style={styles.campaignHeaderText}>
              <Text style={styles.campaignName}>{campaign.name}</Text>
            </View>
          </View>
        )}
        {windows.map((window: CampaignWindow) => (
          <TouchableOpacity
            key={window.id}
            style={styles.windowCard}
            onPress={() => router.push(`/window/${window.campaignId}/${window.id}` as any)}
            accessibilityRole="button"
            accessibilityLabel={`Campaign for ${window.campaignName} on ${formatDateDisplay(window.date)}`}
            accessibilityHint="Opens campaign details"
          >
            <View style={styles.windowHeader}>
              <View style={styles.dateTimeContainer}>
                <View style={styles.dateRow}>
                  <Calendar size={16} color="#6B7280" />
                  <Text style={styles.dateText}>{formatDateDisplay(window.date)}</Text>
                </View>
                <View style={styles.timeRow}>
                  <Clock size={16} color="#6B7280" />
                  <Text style={styles.timeText}>{window.startTime} - {window.endTime}</Text>
                </View>
              </View>
              <ChevronRight size={20} color="#9CA3AF" />
            </View>
            
            <View style={styles.windowDetails}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Price per slot:</Text>
                <Text style={styles.priceText}>{formatPrice(window.priceMinor, window.currency)}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Adverts per slot:</Text>
                <Text style={styles.detailValue}>{window.advertsPerSlot}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Availability:</Text>
                <View style={[
                  styles.availabilityBadge,
                  window.slotsAvailable - window.bookedSlots > 0 ? styles.availableBadge : styles.fullBadge
                ]}>
                  <Text style={[
                    styles.availabilityText,
                    window.slotsAvailable - window.bookedSlots > 0 ? styles.availableText : styles.fullText
                  ]}>
                    {window.slotsAvailable - window.bookedSlots} / {window.slotsAvailable}
                  </Text>
                </View>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const activeFilterCount = (filters.dateFrom ? 1 : 0) + (filters.dateTo ? 1 : 0) + filters.locations.length;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>SouthCoast ProMotion</Text>
        </View>
        <View style={styles.headerButtons}>
          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => {
              setTempFilters(filters);
              setDateErrors({});
              setShowFilters(true);
            }}
            accessibilityRole="button"
            accessibilityLabel={`Filters${activeFilterCount > 0 ? `, ${activeFilterCount} active` : ''}`}
            accessibilityHint="Opens filter options for campaigns"
          >
            <Filter size={20} color="#FFFFFF" />
            {activeFilterCount > 0 && (
              <View style={styles.filterBadge}>
                <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.cartButton}
            onPress={() => router.push("/cart" as any)}
            accessibilityRole="button"
            accessibilityLabel={`Cart${itemCount > 0 ? `, ${itemCount} items` : ''}`}
            accessibilityHint="Opens your shopping cart"
          >
            <ShoppingCart size={20} color="#FFFFFF" />
            {itemCount > 0 && (
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>{itemCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {isLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#FFFFFF" />
        </View>
      ) : isLoadingFilters ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#FFFFFF" />
        </View>
      ) : filteredData.length === 0 ? (
        <View style={styles.centerContainer}>
          <Calendar size={60} color="#666666" />
          <Text style={styles.emptyText}>No campaigns found</Text>
          <Text style={styles.emptySubtext}>
            {activeFilterCount > 0
              ? 'Try adjusting your filters'
              : 'Check back later for new campaigns'}
          </Text>
          {activeFilterCount > 0 && (
            <TouchableOpacity
              style={styles.clearFiltersButton}
              onPress={handleClearFilters}
              accessibilityRole="button"
              accessibilityLabel="Clear all filters"
              accessibilityHint="Removes all active filters to show all campaigns"
            >
              <Text style={styles.clearFiltersButtonText}>Clear Filters</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList
          data={filteredData}
          renderItem={renderCampaignGroup}
          keyExtractor={(item, index) => `group-${index}`}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#FFFFFF" />
          }
        />
      )}

      <Modal
        visible={showFilters}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => {
          setTempFilters(filters);
          setShowFilters(false);
        }}
      >
        <KeyboardAvoidingView 
          style={styles.keyboardAvoidingView} 
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          keyboardVerticalOffset={0}
        >
          <SafeAreaView style={styles.modalContainer} edges={['top', 'bottom']}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filters</Text>
              <TouchableOpacity 
                onPress={() => {
                  setTempFilters(filters);
                  setDateErrors({});
                  setShowFilters(false);
                }}
                accessibilityRole="button"
                accessibilityLabel="Close filters"
                accessibilityHint="Closes the filter modal without applying changes"
              >
                <X size={24} color="#AAAAAA" />
              </TouchableOpacity>
            </View>

            <ScrollView 
              style={styles.modalScrollView}
              contentContainerStyle={styles.modalContent}
              showsVerticalScrollIndicator={true}
              bounces={true}
              keyboardShouldPersistTaps="handled"
            >
              <View style={styles.filterSection}>
                <Text style={styles.sectionTitle}>Date Range</Text>
                
                <View style={styles.filterGroup}>
                  <Text style={styles.filterLabel}>From Date</Text>
                  <View style={[styles.inputContainer, dateErrors.dateFrom && styles.inputContainerError]}>
                    <Calendar size={18} color={dateErrors.dateFrom ? "#EF4444" : "#666666"} style={styles.inputIcon} />
                    <TextInput
                      style={styles.textInput}
                      value={tempFilters.dateFrom || ''}
                      onChangeText={(text) => {
                        setTempFilters(prev => ({ ...prev, dateFrom: text }));
                        if (dateErrors.dateFrom) {
                          setDateErrors(prev => ({ ...prev, dateFrom: undefined }));
                        }
                      }}
                      placeholder="DD/MM/YYYY"
                      placeholderTextColor="#666666"
                      keyboardType="numbers-and-punctuation"
                      maxLength={10}
                      accessibilityLabel="Start date filter"
                      accessibilityHint="Enter start date in format DD/MM/YYYY"
                    />
                  </View>
                  {dateErrors.dateFrom ? (
                    <View style={styles.errorContainer}>
                      <AlertCircle size={14} color="#EF4444" />
                      <Text style={styles.errorText}>{dateErrors.dateFrom}</Text>
                    </View>
                  ) : (
                    <Text style={styles.helperText}>Enter date in DD/MM/YYYY format</Text>
                  )}
                </View>

                <View style={styles.filterGroup}>
                  <Text style={styles.filterLabel}>To Date</Text>
                  <View style={[styles.inputContainer, dateErrors.dateTo && styles.inputContainerError]}>
                    <Calendar size={18} color={dateErrors.dateTo ? "#EF4444" : "#666666"} style={styles.inputIcon} />
                    <TextInput
                      style={styles.textInput}
                      value={tempFilters.dateTo || ''}
                      onChangeText={(text) => {
                        setTempFilters(prev => ({ ...prev, dateTo: text }));
                        if (dateErrors.dateTo) {
                          setDateErrors(prev => ({ ...prev, dateTo: undefined }));
                        }
                      }}
                      placeholder="DD/MM/YYYY"
                      placeholderTextColor="#666666"
                      keyboardType="numbers-and-punctuation"
                      maxLength={10}
                      accessibilityLabel="End date filter"
                      accessibilityHint="Enter end date in format DD/MM/YYYY"
                    />
                  </View>
                  {dateErrors.dateTo ? (
                    <View style={styles.errorContainer}>
                      <AlertCircle size={14} color="#EF4444" />
                      <Text style={styles.errorText}>{dateErrors.dateTo}</Text>
                    </View>
                  ) : (
                    <Text style={styles.helperText}>Enter date in DD/MM/YYYY format</Text>
                  )}
                </View>
              </View>

              <View style={styles.filterSection}>
                <Text style={styles.sectionTitle}>Locations</Text>
                <View style={styles.locationsContainer}>
                  {LOCATIONS.map((location) => {
                    const isSelected = tempFilters.locations.includes(location);
                    return (
                      <TouchableOpacity
                        key={location}
                        style={[
                          styles.locationItem,
                          isSelected && styles.locationItemSelected
                        ]}
                        onPress={() => toggleLocation(location)}
                        accessibilityRole="checkbox"
                        accessibilityState={{ checked: isSelected }}
                        accessibilityLabel={location}
                        accessibilityHint={isSelected ? 'Remove this location filter' : 'Add this location filter'}
                      >
                        <View style={styles.locationItemContent}>
                          <MapPin 
                            size={18} 
                            color={isSelected ? "#000000" : "#AAAAAA"} 
                          />
                          <Text style={[
                            styles.locationText,
                            isSelected && styles.locationTextSelected
                          ]}>
                            {location}
                          </Text>
                        </View>
                        {isSelected && (
                          <Check size={20} color="#000000" />
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.clearButton}
                onPress={handleClearFilters}
                accessibilityRole="button"
                accessibilityLabel="Clear all filters"
                accessibilityHint="Removes all filter selections"
              >
                <Text style={styles.clearButtonText}>Clear All</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.applyButton}
                onPress={handleApplyFilters}
                accessibilityRole="button"
                accessibilityLabel="Apply filters"
                accessibilityHint="Applies selected filters to campaign list"
              >
                <Text style={styles.applyButtonText}>Apply Filters</Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#000000",
    borderBottomWidth: 1,
    borderBottomColor: "#1F1F1F",
  },
  headerTitleContainer: {
    flex: 1,
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: "#FFFFFF",
  },
  headerButtons: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  filterButton: {
    minWidth: 48,
    minHeight: 48,
    width: 48,
    height: 48,
    backgroundColor: "#1A1A1A",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#333333",
    justifyContent: "center",
    alignItems: "center",
    position: "relative" as const,
  },
  cartButton: {
    minWidth: 48,
    minHeight: 48,
    width: 48,
    height: 48,
    backgroundColor: "#1A1A1A",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#333333",
    justifyContent: "center",
    alignItems: "center",
    position: "relative" as const,
  },
  filterBadge: {
    position: "absolute" as const,
    top: -4,
    right: -4,
    backgroundColor: "#EF4444",
    borderRadius: 10,
    width: 18,
    height: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  filterBadgeText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "700" as const,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600" as const,
    color: "#FFFFFF",
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#AAAAAA",
    textAlign: "center",
    marginBottom: 16,
  },
  clearFiltersButton: {
    marginTop: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: "#1A1A1A",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#333333",
  },
  clearFiltersButtonText: {
    fontSize: 15,
    fontWeight: "600" as const,
    color: "#FFFFFF",
  },
  listContent: {
    padding: 16,
  },
  groupContainer: {
    marginBottom: 24,
  },
  campaignHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  campaignHeaderText: {
    flex: 1,
  },
  campaignName: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: "#FFFFFF",
  },
  windowCard: {
    backgroundColor: "#1A1A1A",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  windowHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#2A2A2A",
  },
  dateTimeContainer: {
    gap: 6,
  },
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  dateText: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: "#FFFFFF",
  },
  timeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  timeText: {
    fontSize: 13,
    color: "#AAAAAA",
  },
  windowDetails: {
    gap: 8,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  detailLabel: {
    fontSize: 13,
    color: "#AAAAAA",
  },
  detailValue: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: "#FFFFFF",
  },
  priceText: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: "#FFFFFF",
  },
  availabilityBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  availableBadge: {
    backgroundColor: "#D1FAE5",
  },
  fullBadge: {
    backgroundColor: "#FEE2E2",
  },
  availabilityText: {
    fontSize: 13,
    fontWeight: "600" as const,
  },
  availableText: {
    color: "#065F46",
  },
  fullText: {
    color: "#991B1B",
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "#000000",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#1F1F1F",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: "#FFFFFF",
  },
  modalScrollView: {
    flex: 1,
  },
  modalContent: {
    padding: 20,
    paddingBottom: 20,
  },
  filterSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: "#FFFFFF",
    marginBottom: 16,
  },
  filterGroup: {
    marginBottom: 20,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: "#AAAAAA",
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#333333",
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: "#1A1A1A",
  },
  inputIcon: {
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    color: "#FFFFFF",
    padding: 0,
    margin: 0,
  },
  helperText: {
    fontSize: 12,
    color: "#666666",
    marginTop: 6,
  },
  inputContainerError: {
    borderColor: "#EF4444",
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 6,
  },
  errorText: {
    fontSize: 12,
    color: "#EF4444",
  },
  locationsContainer: {
    gap: 10,
  },
  locationItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#333333",
    borderRadius: 8,
    padding: 14,
    backgroundColor: "#1A1A1A",
    minHeight: 48,
  },
  locationItemSelected: {
    backgroundColor: "#FFFFFF",
    borderColor: "#FFFFFF",
  },
  locationItemContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  locationText: {
    fontSize: 15,
    color: "#AAAAAA",
    fontWeight: "500" as const,
    flexShrink: 1,
  },
  locationTextSelected: {
    color: "#000000",
    fontWeight: "600" as const,
  },
  modalFooter: {
    flexDirection: "row",
    gap: 12,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "#1F1F1F",
    backgroundColor: "#000000",
  },
  clearButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#333333",
    alignItems: "center",
    minHeight: 48,
  },
  clearButtonText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: "#AAAAAA",
  },
  applyButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    minHeight: 48,
  },
  applyButtonText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: "#000000",
  },
  cartBadge: {
    position: "absolute" as const,
    top: -4,
    right: -4,
    backgroundColor: "#EF4444",
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  cartBadgeText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "700" as const,
  },
});
