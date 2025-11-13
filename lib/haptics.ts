import { Platform } from "react-native";
import * as Haptics from "expo-haptics";

const TAG = "[haptics]";

const noopAsync = async (label: string) => {
  console.log(`${TAG} ${label} (web noop)`);
};

const runHaptic = async (label: string, trigger: () => Promise<void>) => {
  if (Platform.OS === "web") {
    await noopAsync(label);
    return;
  }

  try {
    await trigger();
    console.log(`${TAG} ${label} triggered`);
  } catch (error) {
    console.error(`${TAG} ${label} failed`, error);
  }
};

export const haptics = {
  selection: () => runHaptic("selection", () => Haptics.selectionAsync()),
  success: () => runHaptic("success", () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)),
  warning: () => runHaptic("warning", () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)),
  error: () => runHaptic("error", () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)),
  impactMedium: () => runHaptic("impact-medium", () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)),
};
