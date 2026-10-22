import { ClerkProvider } from "@clerk/nextjs";
import { ui } from "@clerk/ui";
import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";

import { clerkAppearance } from "@/lib/clerk-appearance";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "Ghost AI",
  description:
    "Describe a system in plain English, refine the architecture with your team on a shared canvas, and generate the technical spec.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`dark ${inter.variable} ${jetbrainsMono.variable} h-full`}
    >
      <body className="flex min-h-full flex-col">
        <ClerkProvider
          ui={ui}
          appearance={clerkAppearance}
          afterSignOutUrl={process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL}
        >
          {children}
        </ClerkProvider>
      </body>
    </html>
  );
}
