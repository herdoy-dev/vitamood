import { Tabs } from "expo-router";
import { House, TrendingUp, User, Wind } from "lucide-react-native";
import { useColorScheme } from "nativewind";

/**
 * Main authenticated experience: home, exercises, insights, account.
 * (Chat is href:null, hidden from the bar but reachable via the
 * "Open chat" card on home.)
 *
 * Tab bar uses Lucide icons via lucide-react-native — refined,
 * thin-stroke set that matches VitaMood's calm aesthetic better
 * than the bolder Feather glyphs we used initially. PLAN.md §3
 * lists lucide-react-native as the chosen icon set.
 *
 * The tab bar uses raw color values (not className) because react-
 * navigation's tabBarStyle doesn't go through NativeWind. We pick
 * the values from a small palette that mirrors the semantic tokens
 * in app/global.css and switch on the active color scheme — if you
 * change a token there, mirror it here.
 */

const PALETTE = {
  light: {
    active: "rgb(123 166 138)",     // primary (sage)
    inactive: "rgb(108 112 122)",   // text-muted
    bg: "rgb(255 255 255)",         // surface
    border: "rgb(230 226 220)",     // border
  },
  dark: {
    active: "rgb(138 178 152)",     // primary (sage, lightened)
    inactive: "rgb(156 160 168)",   // text-muted (dark)
    bg: "rgb(24 27 32)",            // surface (dark)
    border: "rgb(38 42 50)",        // border (dark)
  },
} as const;

export default function TabsLayout() {
  const { colorScheme } = useColorScheme();
  const tone = PALETTE[colorScheme === "dark" ? "dark" : "light"];

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: tone.active,
        tabBarInactiveTintColor: tone.inactive,
        tabBarStyle: {
          backgroundColor: tone.bg,
          borderTopColor: tone.border,
          borderTopWidth: 1,
          height: 64,
          paddingTop: 8,
          paddingBottom: 12,
        },
        tabBarLabelStyle: {
          fontFamily: "Inter-Medium",
          fontSize: 11,
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => (
            <House color={color} size={size} strokeWidth={1.75} />
          ),
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          // Hide from the visible tab bar — the chat surface is
          // immersive and reached via a CTA on home instead.
          href: null,
          // Hide the bar entirely when the chat route is focused.
          tabBarStyle: { display: "none" },
        }}
      />
      <Tabs.Screen
        name="exercises"
        options={{
          title: "Exercises",
          tabBarIcon: ({ color, size }) => (
            <Wind color={color} size={size} strokeWidth={1.75} />
          ),
        }}
      />
      <Tabs.Screen
        name="insights"
        options={{
          title: "Insights",
          tabBarIcon: ({ color, size }) => (
            <TrendingUp color={color} size={size} strokeWidth={1.75} />
          ),
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          title: "Account",
          tabBarIcon: ({ color, size }) => (
            <User color={color} size={size} strokeWidth={1.75} />
          ),
        }}
      />
    </Tabs>
  );
}
