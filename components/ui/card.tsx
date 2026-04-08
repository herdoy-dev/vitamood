import { View, type ViewProps } from "react-native";

export interface CardProps extends ViewProps {
  className?: string;
}

/**
 * Lifted surface for grouping related content. Uses the surface token
 * so it adapts to light/dark automatically.
 */
export function Card({ className, children, ...props }: CardProps) {
  return (
    <View
      className={`rounded-2xl bg-surface border border-border p-5 ${className ?? ""}`}
      {...props}
    >
      {children}
    </View>
  );
}
