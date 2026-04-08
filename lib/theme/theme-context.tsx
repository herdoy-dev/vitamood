import AsyncStorage from "@react-native-async-storage/async-storage";
import { colorScheme, useColorScheme } from "nativewind";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { View } from "react-native";
import { themes } from "@/lib/theme/themes";

/**
 * Theme preference (PLAN.md §4.7).
 *
 * Three states:
 *   - "system" — follow the device's color scheme (default)
 *   - "light"  — force light mode
 *   - "dark"   — force dark mode
 *
 * Persisted in AsyncStorage so the choice survives app restarts.
 * Per-device, never synced to Firestore — your phone preference
 * shouldn't propagate to a future second device.
 *
 * Implementation: NativeWind v4's `colorScheme.set()` is the
 * canonical way to override the device color scheme. We call it
 * once on mount with the stored preference, and again whenever the
 * user toggles. NativeWind handles applying the .dark class
 * internally; the CSS variables in app/global.css do the rest.
 */

export type ThemePreference = "system" | "light" | "dark";

const STORAGE_KEY = "vitamood:theme-preference";

interface ThemeContextValue {
  preference: ThemePreference;
  setPreference: (next: ThemePreference) => Promise<void>;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [preference, setPreferenceState] = useState<ThemePreference>("system");

  // On mount, read the stored preference and apply it. While the
  // read is in flight we leave the scheme on its default ("system")
  // so we don't flash the wrong theme.
  useEffect(() => {
    let cancelled = false;
    AsyncStorage.getItem(STORAGE_KEY)
      .then((value) => {
        if (cancelled) return;
        const stored: ThemePreference =
          value === "light" || value === "dark" || value === "system"
            ? value
            : "system";
        setPreferenceState(stored);
        colorScheme.set(stored);
      })
      .catch((err) => {
        console.warn("Failed to read theme preference:", err);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const setPreference = useCallback(async (next: ThemePreference) => {
    setPreferenceState(next);
    colorScheme.set(next);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, next);
    } catch (err) {
      // The visual update already happened via colorScheme.set, so
      // a persistence failure just means the choice doesn't survive
      // the next cold start. Worth logging but not blocking.
      console.warn("Failed to persist theme preference:", err);
    }
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({ preference, setPreference }),
    [preference, setPreference],
  );

  return (
    <ThemeContext.Provider value={value}>
      <ThemedRoot>{children}</ThemedRoot>
    </ThemeContext.Provider>
  );
}

/**
 * Wrapping View whose style applies one of the runtime CSS variable
 * themes from `lib/theme/themes`. Reads the active scheme via
 * NativeWind's useColorScheme so it stays in sync whenever the user
 * (or the OS, in "system" mode) flips it.
 *
 * This is the piece that makes dark mode actually work on RN —
 * see the doc-block in lib/theme/themes for the full rationale.
 */
function ThemedRoot({ children }: { children: ReactNode }) {
  const { colorScheme: scheme } = useColorScheme();
  const active = scheme === "dark" ? themes.dark : themes.light;
  return <View style={[{ flex: 1 }, active]}>{children}</View>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used inside <ThemeProvider>");
  }
  return ctx;
}
