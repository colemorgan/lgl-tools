import type { Metadata } from "next";
import localFont from "next/font/local";
import { AuthProvider } from "@/components/auth/auth-provider";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://zenflow.app";

export const metadata: Metadata = {
  title: {
    default: "ZenFlow - Professional Tools for Creators",
    template: "%s | ZenFlow",
  },
  description:
    "Professional tools for creators. Timer, prompter, and VOG tools to enhance your workflow and boost productivity.",
  keywords: [
    "timer",
    "prompter",
    "teleprompter",
    "VOG",
    "voice of god",
    "creator tools",
    "productivity",
  ],
  authors: [{ name: "ZenFlow" }],
  creator: "ZenFlow",
  metadataBase: new URL(appUrl),
  openGraph: {
    type: "website",
    locale: "en_US",
    url: appUrl,
    siteName: "ZenFlow",
    title: "ZenFlow - Professional Tools for Creators",
    description:
      "Professional tools for creators. Timer, prompter, and VOG tools to enhance your workflow and boost productivity.",
  },
  twitter: {
    card: "summary_large_image",
    title: "ZenFlow - Professional Tools for Creators",
    description:
      "Professional tools for creators. Timer, prompter, and VOG tools to enhance your workflow and boost productivity.",
  },
  robots: {
    index: true,
    follow: true,
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
        className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}
      >
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
