import { type ReactNode } from "react";
import { View } from "react-native";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { Screen } from "@/components/ui/screen";
import { Text } from "@/components/ui/text";
import { StepProgress } from "@/components/exercises/step-progress";

/**
 * Shared layout for every onboarding screen.
 *
 * Why it exists: before this, each onboarding screen rolled its own
 * vertical rhythm — some used py-8, some used flex-1 + justify-between,
 * some put the step counter in different places. The result felt
 * accidental as you stepped through the flow. This shell unifies the
 * structure so the only thing changing screen-to-screen is the body
 * content and the CTAs.
 *
 * What it provides:
 *   - Optional StepProgress slider at the very top (matches the
 *     animated bar from the exercise players) when `step` is given.
 *   - A confident display title and optional subtitle in the header.
 *   - Body content slotted via `children`, vertically scrollable.
 *   - Footer slotted via `footer`, pinned to the bottom — usually
 *     the Continue button(s).
 *   - A calm fade-in-up entrance for the body and a fade-in-down
 *     entrance for the header. Both at 500ms with no spring, in
 *     keeping with PLAN.md §8's "no bouncy / playful springs" rule.
 *
 * The header animation uses FadeInDown so it appears to settle from
 * above, the body uses FadeInUp so it rises into place from below.
 * Together they create a quiet "the page is gathering itself" feel.
 */

interface OnboardingShellProps {
  /** 1-indexed current step. Omit to hide the progress slider. */
  step?: number;
  /** Total steps in the flow this screen belongs to. */
  totalSteps?: number;
  title: string;
  subtitle?: string;
  /** Body content — fills the middle, scrolls if it overflows. */
  children: ReactNode;
  /** Pinned-to-bottom CTAs. Typically one or more Buttons. */
  footer: ReactNode;
}

export function OnboardingShell({
  step,
  totalSteps,
  title,
  subtitle,
  children,
  footer,
}: OnboardingShellProps) {
  const showProgress = typeof step === "number" && typeof totalSteps === "number";

  return (
    <Screen scroll>
      <View className="flex-1 justify-between gap-8 py-4">
        {/* Header — step progress + title + subtitle. The slight
            FadeInDown gives the header a "settling from above" feel
            so screen transitions don't snap. */}
        <Animated.View entering={FadeInDown.duration(500)} className="gap-5">
          {showProgress && (
            <StepProgress current={step} total={totalSteps} />
          )}
          <View className="gap-3">
            <Text variant="display" className="text-text">
              {title}
            </Text>
            {subtitle && (
              <Text variant="body" className="text-text-muted">
                {subtitle}
              </Text>
            )}
          </View>
        </Animated.View>

        {/* Body — fills the middle. FadeInUp on a slight delay so it
            arrives just after the header. */}
        <Animated.View
          entering={FadeInUp.duration(600).delay(120)}
          className="flex-1"
        >
          {children}
        </Animated.View>

        {/* Footer — pinned at the bottom. No entrance animation; the
            CTAs should be there the moment the user looks for them. */}
        <View className="gap-3 pb-4">{footer}</View>
      </View>
    </Screen>
  );
}
