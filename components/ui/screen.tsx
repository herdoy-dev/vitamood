import {
  ScrollView,
  View,
  type ScrollViewProps,
  type ViewProps,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface BaseProps {
  className?: string;
  children?: React.ReactNode;
}

interface ScreenProps extends BaseProps {
  /**
   * When true, content scrolls vertically. Use for longer screens like
   * onboarding or insights. Defaults to false (fills the safe area).
   */
  scroll?: boolean;
  /**
   * Pass-through to the underlying ScrollView when scroll=true.
   */
  scrollProps?: ScrollViewProps;
  /**
   * Pass-through to the underlying View when scroll=false.
   */
  viewProps?: ViewProps;
}

/**
 * Top-level screen wrapper. Applies the calm bg token, safe-area
 * insets, and consistent horizontal padding so individual screens
 * don't have to remember.
 */
export function Screen({
  scroll = false,
  scrollProps,
  viewProps,
  className,
  children,
}: ScreenProps) {
  const inner = `flex-1 px-6 ${className ?? ""}`;

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["top", "left", "right"]}>
      {scroll ? (
        <ScrollView
          className={inner}
          contentContainerClassName="py-6"
          showsVerticalScrollIndicator={false}
          {...scrollProps}
        >
          {children}
        </ScrollView>
      ) : (
        <View className={`${inner} py-6`} {...viewProps}>
          {children}
        </View>
      )}
    </SafeAreaView>
  );
}
