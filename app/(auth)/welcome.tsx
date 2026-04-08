import { useRouter } from "expo-router";
import { Pressable, View } from "react-native";
import Animated, { FadeIn, FadeInUp } from "react-native-reanimated";
import { Button } from "@/components/ui/button";
import { Screen } from "@/components/ui/screen";
import { Text } from "@/components/ui/text";

/**
 * Welcome screen — the user's first impression.
 *
 * Aesthetic direction (per the frontend-design pass):
 *
 *   - Confident typography: a large display brand mark, a single
 *     short tagline, no marketing fluff.
 *   - Atmosphere from two large soft sage circles positioned
 *     absolutely in opposite corners with low opacity. They're
 *     blurred-in-feel via low alpha rather than an actual blur
 *     filter, which would need a heavier dependency.
 *   - Staggered fade-in entrance: brand mark first, then tagline,
 *     then the CTAs, then the crisis link. Total duration ~1.2s
 *     so the page assembles itself calmly without making the user
 *     wait to act.
 *   - The crisis link sits below the secondary CTA in a quiet
 *     terracotta caption. Reachable but never aggressive — the
 *     floating help button is hidden on (auth) screens, so this
 *     is the safety net for the unauthenticated flow.
 */
export default function Welcome() {
  const router = useRouter();

  return (
    <Screen>
      {/* Decorative atmosphere — two large soft sage circles. They
          sit behind the content via absolute positioning and zero
          pointer events. */}
      <View
        pointerEvents="none"
        className="absolute -right-32 -top-24 h-72 w-72 rounded-full bg-primary opacity-10"
      />
      <View
        pointerEvents="none"
        className="absolute -left-24 -bottom-32 h-64 w-64 rounded-full bg-accent opacity-15"
      />

      <View className="flex-1 justify-between py-8">
        {/* Brand mark + tagline. The brand mark is intentionally a
            beat earlier than the tagline so the eye locks onto it
            first. */}
        <View className="flex-1 justify-center gap-6">
          <Animated.View entering={FadeInUp.duration(700)}>
            <Text variant="display" className="text-primary text-5xl">
              VitaMood
            </Text>
          </Animated.View>

          <Animated.View entering={FadeInUp.duration(700).delay(180)}>
            <View
              className="h-px w-12 bg-primary"
              style={{ opacity: 0.5 }}
            />
          </Animated.View>

          <Animated.View entering={FadeInUp.duration(700).delay(280)}>
            <Text variant="body" className="text-text-muted">
              A calm place to land, every day.
            </Text>
          </Animated.View>
        </View>

        {/* CTAs — primary first, secondary below, then the quiet
            crisis link. Staggered so they arrive after the brand. */}
        <View className="gap-3">
          <Animated.View entering={FadeInUp.duration(600).delay(450)}>
            <Button
              label="Get started"
              size="lg"
              onPress={() => router.push("/(auth)/onboarding/intro")}
            />
          </Animated.View>

          <Animated.View entering={FadeInUp.duration(600).delay(560)}>
            <Button
              label="I already have an account"
              variant="ghost"
              size="lg"
              onPress={() => router.push("/(auth)/sign-in")}
            />
          </Animated.View>

          <Animated.View entering={FadeIn.duration(600).delay(800)}>
            <Pressable
              onPress={() => router.push("/crisis")}
              accessibilityRole="link"
              className="items-center pt-3"
            >
              <Text variant="caption" className="text-crisis underline">
                In crisis right now? Tap here for help.
              </Text>
            </Pressable>
          </Animated.View>
        </View>
      </View>
    </Screen>
  );
}
