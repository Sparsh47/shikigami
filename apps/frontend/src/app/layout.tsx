import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Shikigami — Deploy AI Agents Instantly",
    template: "%s | Shikigami",
  },
  description:
    "The modern deployment platform for autonomous AI agents. Push code, build securely with Kaniko, and go live with zero infrastructure overhead.",
  keywords: [
    "AI agents",
    "deployment platform",
    "Vercel for AI",
    "Kaniko",
    "Kubernetes",
    "autonomous agents",
    "serverless AI",
  ],
  authors: [{ name: "Shikigami" }],
  icons: {
    icon: [
      { url: "/shikigami.ico", sizes: "any" },
      { url: "/shikigami.png", type: "image/png", sizes: "32x32" },
      { url: "/shikigami.png", type: "image/png", sizes: "64x64" },
      { url: "/shikigami.png", type: "image/png", sizes: "512x512" },
    ],
    apple: [
      { url: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
    shortcut: "/shikigami.ico",
  },
  manifest: "/manifest.json",
  openGraph: {
    title: "Shikigami — Deploy AI Agents Instantly",
    description:
      "The modern deployment platform for autonomous AI agents. Push code, build securely with Kaniko, and go live with zero infrastructure overhead.",
    siteName: "Shikigami",
    images: [
      {
        url: "/icon.png",
        width: 512,
        height: 512,
        alt: "Shikigami",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Shikigami — Deploy AI Agents Instantly",
    description:
      "The modern deployment platform for autonomous AI agents. Push code, build securely with Kaniko, and go live with zero infrastructure overhead.",
    images: ["/icon.png"],
  },
};

export const viewport: Viewport = {
  themeColor: "#1a1714",
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[#1a1714] text-[#c4b8b0] antialiased selection:bg-[#c96b3e]/30 selection:text-[#e8ddd5]">
        {children}
      </body>
    </html>
  );
}
