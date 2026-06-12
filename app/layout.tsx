import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Providers from "./providers";
import { ServiceWorkerRegistration } from "./components/ServiceWorkerRegistration";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  themeColor: "#040407",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  title: "Orbit — Track your AI subscriptions",
  description: "See everything you're paying for across your AI tools, what you're actually using, and what to cut.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Orbit",
  },
  openGraph: {
    title: "Orbit — Track your AI subscriptions",
    description: "See everything you're paying for across your AI tools.",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Orbit — Track your AI subscriptions",
    description: "See everything you're paying for across your AI tools.",
  },
  icons: {
    icon: "/icon.svg",
    apple: "/icon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <ServiceWorkerRegistration />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
