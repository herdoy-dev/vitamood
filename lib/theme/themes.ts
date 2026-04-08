import { vars } from "nativewind";

/**
 * Runtime theme variables for VitaMood (PLAN.md §8).
 *
 * Why this file exists: NativeWind v4 on React Native compiles
 * tailwind classes to static style objects at build time. The
 * `.dark { --bg: ...; }` CSS selector in app/global.css works on
 * web but isn't honored when NativeWind resolves CSS variables on
 * native — the `bg-bg` class always picks up the `:root` value.
 *
 * The official fix (per the NativeWind v4 themes guide) is to
 * apply CSS variables at runtime via the `vars()` helper, wrapped
 * around the View that contains the screens you want themed. The
 * variables override down the tree, and every `bg-bg`, `text-text`,
 * `border-border`, etc. class resolves against the runtime override.
 *
 * The keys here mirror the variable names declared in
 * app/global.css (which still drives the web build). If you change
 * a token in one file, change it in the other.
 *
 * Values are space-separated RGB triples so the
 * `rgb(var(--bg) / <alpha-value>)` form in tailwind.config.js
 * resolves to a usable color at runtime.
 */
export const themes = {
  light: vars({
    "--bg": "247 245 242",
    "--surface": "255 255 255",
    "--text": "42 45 51",
    "--text-muted": "108 112 122",
    "--primary": "123 166 138",
    "--primary-fg": "255 255 255",
    "--accent": "232 195 158",
    "--accent-fg": "42 45 51",
    "--crisis": "201 123 92",
    "--crisis-fg": "255 255 255",
    "--border": "230 226 220",
  }),
  dark: vars({
    "--bg": "14 16 20",
    "--surface": "24 27 32",
    "--text": "232 230 225",
    "--text-muted": "156 160 168",
    "--primary": "138 178 152",
    "--primary-fg": "14 16 20",
    "--accent": "232 195 158",
    "--accent-fg": "14 16 20",
    "--crisis": "217 142 110",
    "--crisis-fg": "14 16 20",
    "--border": "38 42 50",
  }),
} as const;
