import type { Config } from "tailwindcss";

// Token names are kept from the original store so every screen (admin included) picks up the
// new palette; only their values changed. paper = page, sage = raised surface, forest = neon
// magenta (primary action), leaf = ice cyan (secondary accent, links, focus).
const config: Config = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        paper: "#0D0A18",
        sage: "#181329",
        ink: "#F1EDFF",
        muted: "#A49BC6",
        line: "#2C2547",
        forest: "#FF4FC3",
        leaf: "#45E3FF",
        danger: "#FF6B7F",
        warn: "#FFC94D",
      },
      fontFamily: {
        neon: ["Monoton", "\"Unbounded\"", "sans-serif"],
        display: ["\"Unbounded\"", "system-ui", "sans-serif"],
        sans: ["\"Figtree\"", "system-ui", "sans-serif"],
      },
      fontSize: {
        meta: ["13px", "18px"],
        body: ["15px", "22px"],
        "body-lg": ["17px", "26px"],
        h4: ["22px", "28px"],
        h3: ["28px", "34px"],
        h2: ["38px", "44px"],
        h1: ["52px", "56px"],
      },
      borderRadius: {
        pill: "999px",
        tile: "18px",
        card: "12px",
        control: "8px",
      },
    },
  },
  plugins: [],
};

export default config;
