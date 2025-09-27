import type { Metadata } from "next";
import { Inter } from "next/font/google";
// import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { env } from "@/lib/env";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Le Fade - Look Sharp, Always",
  description: "Professional haircut subscriptions for busy professionals. Standard and Deluxe plans with consistent quality and flexible scheduling.",
  keywords: "haircut subscription, professional haircuts, barber service, mobile barber, premium grooming",
  authors: [{ name: "Le Fade" }],
  creator: "Le Fade",
  publisher: "Le Fade",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    title: "Le Fade - Look Sharp, Always",
    description: "Professional haircut subscriptions for busy professionals",
    type: "website",
    url: env.appUrl,
    siteName: "Le Fade",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Le Fade - Look Sharp, Always",
    description: "Professional haircut subscriptions for busy professionals",
    creator: "@lefade",
  },
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} min-h-screen bg-background font-sans antialiased`}
      >
        <ErrorBoundary>
          <Navbar />
          <main className="flex-1">
            {children}
          </main>
        </ErrorBoundary>
      </body>
    </html>
  );
}

