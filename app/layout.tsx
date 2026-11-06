import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ademi & Rasheed | An Intimate Celebration",
  description: "An intimate post-wedding celebration. Kindly RSVP by November 24, 2026.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://example.com"),
  openGraph: {
    title: "Ademi & Rasheed | An Intimate Celebration",
    description: "Friday, November 27, 2026 · Schaumburg, Illinois",
    type: "website"
  }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
