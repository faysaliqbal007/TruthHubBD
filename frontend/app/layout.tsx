import type { Metadata } from "next";
import "./globals.css";
import "./spatial.css";
import "./effects.css";
import "./alerts.css";
import "./clarity.css";
import "./editorial.css";
import "./editorial-civic.css";

export const metadata: Metadata = {
  title: "TruthHubBD — Bangladesh Nationwide Trust Layer & Public Reviews",
  description: "Real citizen and consumer reviews for businesses, doctors, hospitals, universities, and services across Bangladesh. Check before you trust.",
  keywords: "Bangladesh reviews, business reviews, scam alerts, trusthubbd, truthhubbd, bangladesh directory",
  other: {
    "development-preview": "development",
  },
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon.png", type: "image/png" },
    ],
    shortcut: "/favicon.svg",
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
        <meta name="theme-color" content="#faf6eb" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Noto+Sans+Bengali:wght@400;500;600;700&family=Noto+Serif+Bengali:wght@500;700&display=swap"
          rel="stylesheet"
        />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="icon" type="image/png" href="/favicon.png" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
