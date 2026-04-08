import { Pressable, Text, View } from "react-native";

export interface SliderProps {
  /**
   * Current selected value, 1-indexed (1..options.length).
   * `null` means nothing selected yet.
   */
  value: number | null;
  onChange: (value: number) => void;
  /**
   * Labels for each step. For mood/energy this is typically emoji faces.
   * Length determines the range (e.g. 5 emojis = 1..5).
   *
   * Accepts readonly arrays so callers can use `as const` tuples
   * (which is what lib/checkin exports) without a cast.
   */
  options: readonly string[];
  /**
   * Accessibility label describing what the slider measures.
   */
  label: string;
  className?: string;
}

/**
 * Discrete 1..N picker rendered as a row of large tappable steps.
 * Used for mood + energy (PLAN.md §4.2). Designed for 5 emoji faces
 * but works with any small N.
 *
 * Discrete by design — a continuous slider invites overthinking; the
 * goal is a sub-30-second check-in.
 */
export function Slider({
  value,
  onChange,
  options,
  label,
  className,
}: SliderProps) {
  return (
    <View
      className={`flex-row items-center justify-between gap-2 ${className ?? ""}`}
      accessibilityRole="adjustable"
      accessibilityLabel={label}
      accessibilityValue={
        value !== null
          ? { min: 1, max: options.length, now: value }
          : undefined
      }
    >
      {options.map((option, index) => {
        const stepValue = index + 1;
        const selected = value === stepValue;
        return (
          <Pressable
            key={stepValue}
            onPress={() => onChange(stepValue)}
            accessibilityRole="button"
            accessibilityLabel={`${label} ${stepValue} of ${options.length}`}
            accessibilityState={{ selected }}
            className={`flex-1 items-center justify-center rounded-2xl py-4 ${
              selected
                ? "bg-primary"
                : "bg-surface border border-border active:bg-bg"
            }`}
          >
            <Text className="text-3xl">{option}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}
