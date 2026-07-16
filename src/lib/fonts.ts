import { Fraunces, JetBrains_Mono, Plus_Jakarta_Sans } from "next/font/google";

export const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",     // ← map to --font-display (what your CSS expects)
  weight: ["500", "600"],
  style: ["normal", "italic"],
});

export const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "500"],
});

export const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-body",        // ← the body font
  weight: ["400", "500", "600", "700"],
});