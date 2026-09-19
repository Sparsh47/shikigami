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
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon.png", type: "image/png", sizes: "32x32" },
      { url: "/favicon-64.png", type: "image/png", sizes: "64x64" },
      { url: "/icon.png", type: "image/png", sizes: "512x512" },
    ],
    apple: [
      { url: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
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
  themeColor: "#09090b",
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-zinc-950 text-zinc-100 antialiased selection:bg-indigo-500/30 selection:text-indigo-200">
        {children}
      </body>
    </html>
  );
}
