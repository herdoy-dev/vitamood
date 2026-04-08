import { Feather } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { Pressable, View } from "react-native";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Screen } from "@/components/ui/screen";
import { Text } from "@/components/ui/text";
import { useAuth } from "@/lib/auth/auth-context";
import {
  ENERGY_OPTIONS,
  getTodayCheckIn,
  MOOD_OPTIONS,
  type CheckIn,
} from "@/lib/checkin";

/**
 * Home tab — today's check-in card.
 *
 * Three states:
 *   - loading      → empty card while we fetch
 *   - no check-in  → friendly nudge + Check in button
 *   - has check-in → mood + energy emojis, optional note, and a
 *                    quieter "Check in again" link
 *
 * Refetch is triggered by useFocusEffect so dismissing the check-in
 * modal updates the card immediately. We don't subscribe with
 * onSnapshot because the only writer (the user themselves on this
 * device) is already returning to this screen — a one-shot read on
 * focus is enough and avoids carrying a live listener.
 */
export default function HomeTab() {
  const router = useRouter();
  const { user } = useAuth();

  // undefined = loading, null = no check-in today, CheckIn = today's
  const [checkIn, setCheckIn] = useState<CheckIn | null | undefined>(
    undefined,
  );

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      if (!user) {
        setCheckIn(null);
        return;
      }
      getTodayCheckIn(user.uid)
        .then((c) => {
          if (!cancelled) setCheckIn(c);
        })
        .catch((err) => {
          console.warn("Failed to load today's check-in:", err);
          if (!cancelled) setCheckIn(null);
        });
      return () => {
        cancelled = true;
      };
    }, [user]),
  );

  return (
    <Screen scroll>
      <View className="flex-row items-start justify-between">
        <View className="gap-1">
          <Text variant="caption">Today</Text>
          <Text variant="title">How are you doing?</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Account"
          onPress={() => router.push("/account")}
          hitSlop={12}
          className="p-2"
        >
          <Feather name="user" size={22} color="rgb(108 112 122)" />
        </Pressable>
      </View>

      <View className="mt-6">
        {checkIn === undefined ? (
          // Loading — render a quiet placeholder card so the layout
          // doesn't jump when the data lands.
          <Card>
            <Text variant="caption">Loading…</Text>
          </Card>
        ) : checkIn === null ? (
          <Card>
            <Text variant="subtitle">Daily check-in</Text>
            <Text variant="caption" className="mt-1">
              You haven't checked in yet today. It takes about 30 seconds.
            </Text>
            <View className="mt-4">
              <Button
                label="Check in"
                onPress={() => router.push("/checkin")}
              />
            </View>
          </Card>
        ) : (
          <Card>
            <Text variant="subtitle">Today's check-in</Text>
            <View className="mt-4 flex-row gap-6">
              <View className="items-center gap-1">
                <Text className="text-4xl">{MOOD_OPTIONS[checkIn.mood - 1]}</Text>
                <Text variant="caption">Mood</Text>
              </View>
              <View className="items-center gap-1">
                <Text className="text-4xl">
                  {ENERGY_OPTIONS[checkIn.energy - 1]}
                </Text>
                <Text variant="caption">Energy</Text>
              </View>
            </View>
            {checkIn.note && (
              <Text variant="body" className="mt-4 text-text-muted">
                "{checkIn.note}"
              </Text>
            )}
            <View className="mt-4">
              <Button
                label="Update today"
                variant="ghost"
                onPress={() => router.push("/checkin")}
              />
            </View>
          </Card>
        )}

        {/* Discoverability for the immersive chat surface — the
            chat tab icon is hidden from the bar so this card is
            the only entry point. */}
        <Card className="mt-3">
          <Text variant="subtitle">Companion</Text>
          <Text variant="caption" className="mt-1">
            A safe place to think out loud with your AI companion.
          </Text>
          <View className="mt-4">
            <Button
              label="Open chat"
              onPress={() => router.push("/(tabs)/chat")}
            />
          </View>
        </Card>
      </View>
    </Screen>
  );
}
