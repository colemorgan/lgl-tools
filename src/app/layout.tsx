import type { Metadata } from "next";
import { Poppins, Lato } from "next/font/google";
import localFont from "next/font/local";
import { AuthProvider } from "@/components/auth/auth-provider";
import "./globals.css";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-poppins",
  display: "swap",
});

const lato = Lato({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-lato",
  display: "swap",
});

const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://letsgolive.io";

export const metadata: Metadata = {
  title: {
    default: "Let's Go Live - Professional Tools for Creators",
    template: "%s | Let's Go Live",
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
    "live streaming",
  ],
  authors: [{ name: "Let's Go Live" }],
  creator: "Let's Go Live",
  metadataBase: new URL(appUrl),
  openGraph: {
    type: "website",
    locale: "en_US",
    url: appUrl,
    siteName: "Let's Go Live",
    title: "Let's Go Live - Professional Tools for Creators",
    description:
      "Professional tools for creators. Timer, prompter, and VOG tools to enhance your workflow and boost productivity.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Let's Go Live - Professional Tools for Creators",
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
        className={`${poppins.variable} ${lato.variable} ${geistMono.variable} font-sans antialiased`}
      >
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
