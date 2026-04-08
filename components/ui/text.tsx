import { Text as RNText, type TextProps as RNTextProps } from "react-native";

type Variant =
  | "display"
  | "title"
  | "subtitle"
  | "body"
  | "body-medium"
  | "caption"
  | "muted";

const variantClass: Record<Variant, string> = {
  display: "font-heading-bold text-4xl text-text leading-tight",
  title: "font-heading-semibold text-2xl text-text leading-snug",
  subtitle: "font-heading-medium text-lg text-text leading-snug",
  body: "font-body text-base text-text leading-relaxed",
  "body-medium": "font-body-medium text-base text-text leading-relaxed",
  caption: "font-body text-sm text-text-muted leading-relaxed",
  muted: "font-body text-base text-text-muted leading-relaxed",
};

export interface TextProps extends RNTextProps {
  variant?: Variant;
  className?: string;
}

export function Text({
  variant = "body",
  className,
  ...props
}: TextProps) {
  return (
    <RNText
      className={`${variantClass[variant]} ${className ?? ""}`}
      {...props}
    />
  );
}
