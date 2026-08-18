import scrollbarHide from "tailwind-scrollbar-hide";

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      keyframes: {
        "progress-stripes": {
          "0%": { backgroundPosition: "0 0" },
          "100%": { backgroundPosition: "1rem 0" },
        },
      },
      animation: {
        "progress-stripes": "progress-stripes 1s linear infinite",
      },
    },
  },
  plugins: [scrollbarHide],
};
