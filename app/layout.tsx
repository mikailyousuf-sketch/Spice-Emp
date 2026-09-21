import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Spice Emp",
    template: "%s | Spice Emp",
  },
  description:
    "Discover spices, recipes and wholesale spice solutions built for South Africa.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
