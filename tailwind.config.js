/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        // Headings — DM Sans (PLAN.md §8)
        heading: ["DMSans-Regular"],
        "heading-medium": ["DMSans-Medium"],
        "heading-semibold": ["DMSans-SemiBold"],
        "heading-bold": ["DMSans-Bold"],
        // Body — Inter
        body: ["Inter-Regular"],
        "body-medium": ["Inter-Medium"],
        "body-semibold": ["Inter-SemiBold"],
      },
      colors: {
        // Semantic tokens — drive light/dark via CSS vars in app/global.css
        bg: "rgb(var(--bg) / <alpha-value>)",
        surface: "rgb(var(--surface) / <alpha-value>)",
        text: "rgb(var(--text) / <alpha-value>)",
        "text-muted": "rgb(var(--text-muted) / <alpha-value>)",
        primary: {
          DEFAULT: "rgb(var(--primary) / <alpha-value>)",
          fg: "rgb(var(--primary-fg) / <alpha-value>)",
        },
        accent: {
          DEFAULT: "rgb(var(--accent) / <alpha-value>)",
          fg: "rgb(var(--accent-fg) / <alpha-value>)",
        },
        crisis: {
          DEFAULT: "rgb(var(--crisis) / <alpha-value>)",
          fg: "rgb(var(--crisis-fg) / <alpha-value>)",
        },
        border: "rgb(var(--border) / <alpha-value>)",
      },
    },
  },
  plugins: [],
};
