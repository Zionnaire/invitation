import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ademi & Rasheed | The Beginning of Forever",
  description: "With full hearts and deep gratitude. You are cordially invited. Kindly RSVP by November 24, 2026.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://example.com"),
  openGraph: {
    title: "Ademi & Rasheed | The Beginning of Forever",
    description: "Friday, November 27, 2026 · Schaumburg, Illinois",
    type: "website"
  }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
