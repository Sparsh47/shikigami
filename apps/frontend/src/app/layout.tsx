import type { Metadata, Viewport } from "next";
import { Outfit, JetBrains_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/ThemeProvider";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

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
  themeColor: "#09090b",
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${outfit.variable} ${jetbrainsMono.variable} font-sans min-h-screen bg-[var(--bg-base)] text-[var(--text-body)] antialiased selection:bg-[var(--accent)]/30 selection:text-[var(--text-heading)]`}>
        {/* Background glow effects */}
        <div className="fixed inset-0 z-[-1] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[rgba(56,189,248,0.07)] via-[var(--bg-base)] to-[var(--bg-base)]"></div>
        <div className="fixed top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[var(--accent)]/20 to-transparent"></div>
        
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
