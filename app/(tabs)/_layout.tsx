import { Tabs } from "expo-router";
import { Sun, TrendingUp, User, Wind } from "lucide-react-native";

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
 * navigation's tabBarStyle doesn't go through NativeWind. Values
 * mirror the semantic tokens from app/global.css so light/dark
 * still works. If you change a token there, mirror it here.
 */
export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "rgb(123 166 138)", // primary (sage)
        tabBarInactiveTintColor: "rgb(108 112 122)", // text-muted
        tabBarStyle: {
          backgroundColor: "rgb(255 255 255)", // surface
          borderTopColor: "rgb(230 226 220)", // border
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
            <Sun color={color} size={size} strokeWidth={1.75} />
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
