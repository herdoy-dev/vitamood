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
  getRecentDays,
  MOOD_OPTIONS,
  type CheckInDay,
} from "@/lib/checkin";
import { getProfile, type Profile } from "@/lib/profile/profile";

/**
 * Home tab — today's check-in card plus a quiet weekly summary.
 *
 * Refetches on focus so a fresh check-in from the modal updates the
 * card immediately. We still don't subscribe with onSnapshot — the
 * only writer is the user themselves on this device, and a one-shot
 * read on focus is enough.
 *
 * Three asynchronous reads in parallel: profile (for the greeting),
 * the 7-day window (for today's card AND yesterday's line AND the
 * weekly tally), and the profile fetch is cheap enough to do every
 * focus.
 */

function timeOfDayGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 5) return "It's late";
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  if (hour < 22) return "Good evening";
  return "It's late";
}

export default function HomeTab() {
  const router = useRouter();
  const { user } = useAuth();

  const [profile, setProfile] = useState<Profile | null>(null);
  // undefined = loading, [] = loaded (might be empty), CheckInDay[] = window
  const [days, setDays] = useState<CheckInDay[] | undefined>(undefined);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      if (!user) {
        setDays([]);
        setProfile(null);
        return;
      }

      // Fan out — independent reads, no point serializing.
      Promise.all([
        getRecentDays(user.uid, 7).catch((err) => {
          console.warn("Failed to load recent days:", err);
          return [] as CheckInDay[];
        }),
        getProfile(user.uid).catch((err) => {
          console.warn("Failed to load profile:", err);
          return null;
        }),
      ]).then(([dayWindow, prof]) => {
        if (cancelled) return;
        setDays(dayWindow);
        setProfile(prof);
      });

      return () => {
        cancelled = true;
      };
    }, [user]),
  );

  // Derived values pulled out so the JSX stays readable.
  const today = days?.[days.length - 1]?.checkIn ?? null;
  const yesterday = days && days.length >= 2 ? days[days.length - 2].checkIn : null;
  const weeklyCount = days?.filter((d) => d.checkIn !== null).length ?? 0;

  const firstName = profile?.name?.trim().split(/\s+/)[0];
  const greeting = firstName
    ? `${timeOfDayGreeting()}, ${firstName}.`
    : "How are you doing?";

  return (
    <Screen scroll>
      <View className="flex-row items-start justify-between">
        <View className="gap-1">
          <Text variant="caption">Today</Text>
          <Text variant="title">{greeting}</Text>
          {yesterday && (
            <Text variant="caption" className="mt-1 text-text-muted">
              Yesterday you logged {MOOD_OPTIONS[yesterday.mood - 1]}
            </Text>
          )}
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
        {days === undefined ? (
          // Loading — quiet placeholder so the layout doesn't jump.
          <Card>
            <Text variant="caption">Loading…</Text>
          </Card>
        ) : today === null ? (
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
                <Text className="text-4xl">{MOOD_OPTIONS[today.mood - 1]}</Text>
                <Text variant="caption">Mood</Text>
              </View>
              <View className="items-center gap-1">
                <Text className="text-4xl">
                  {ENERGY_OPTIONS[today.energy - 1]}
                </Text>
                <Text variant="caption">Energy</Text>
              </View>
            </View>
            {today.note && (
              <Text variant="body" className="mt-4 text-text-muted">
                "{today.note}"
              </Text>
            )}
            {today.tags && today.tags.length > 0 && (
              <View className="mt-3 flex-row flex-wrap gap-2">
                {today.tags.map((tag) => (
                  <View
                    key={tag}
                    className="rounded-full bg-bg px-3 py-1"
                  >
                    <Text variant="caption">{tag}</Text>
                  </View>
                ))}
              </View>
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

        {/* Weekly tally — non-judgmental, no streak guilt. Only
            shows up once they have at least one check-in so the
            very first day doesn't read as "0 of 7". */}
        {weeklyCount > 0 && (
          <View className="mt-3">
            <WeeklyDots days={days ?? []} />
          </View>
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

/**
 * A row of 7 small dots showing which days of the past week have a
 * check-in. Filled in primary, empty in border. No labels — just a
 * quiet visual tally. The weekly count caption sits above it.
 *
 * Intentionally not a "streak" — there's no guilt, no broken streak
 * messaging. PLAN.md §1 calls out "calm over engagement" and this
 * is what that looks like in pixels.
 */
function WeeklyDots({ days }: { days: CheckInDay[] }) {
  const count = days.filter((d) => d.checkIn !== null).length;
  return (
    <Card>
      <Text variant="caption">
        You checked in {count} of {days.length} days this week
      </Text>
      <View className="mt-3 flex-row gap-2">
        {days.map((day) => (
          <View
            key={day.dateKey}
            className={`h-2 flex-1 rounded-full ${
              day.checkIn ? "bg-primary" : "bg-border"
            }`}
          />
        ))}
      </View>
    </Card>
  );
}
