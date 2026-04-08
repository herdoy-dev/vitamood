import {
  Pressable,
  Text,
  type PressableProps,
  type View,
} from "react-native";
import { forwardRef } from "react";

type Variant = "primary" | "ghost" | "crisis";
type Size = "sm" | "md" | "lg";

const containerByVariant: Record<Variant, string> = {
  primary: "bg-primary active:opacity-80",
  ghost: "bg-transparent border border-border active:bg-surface",
  crisis: "bg-crisis active:opacity-80",
};

const labelByVariant: Record<Variant, string> = {
  primary: "text-primary-fg font-body-semibold",
  ghost: "text-text font-body-semibold",
  crisis: "text-crisis-fg font-body-semibold",
};

const containerBySize: Record<Size, string> = {
  sm: "px-4 py-2 rounded-xl",
  md: "px-5 py-3 rounded-2xl",
  lg: "px-6 py-4 rounded-2xl",
};

const labelBySize: Record<Size, string> = {
  sm: "text-sm",
  md: "text-base",
  lg: "text-lg",
};

export interface ButtonProps extends Omit<PressableProps, "children"> {
  label: string;
  variant?: Variant;
  size?: Size;
  className?: string;
}

export const Button = forwardRef<View, ButtonProps>(function Button(
  {
    label,
    variant = "primary",
    size = "md",
    className,
    disabled,
    ...props
  },
  ref,
) {
  return (
    <Pressable
      ref={ref}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      className={`items-center justify-center ${containerByVariant[variant]} ${containerBySize[size]} ${disabled ? "opacity-40" : ""} ${className ?? ""}`}
      {...props}
    >
      <Text className={`${labelByVariant[variant]} ${labelBySize[size]}`}>
        {label}
      </Text>
    </Pressable>
  );
});
