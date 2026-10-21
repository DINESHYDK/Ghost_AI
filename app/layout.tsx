import { ClerkProvider } from "@clerk/nextjs";
import { shadcn } from "@clerk/ui/themes";
import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
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
          appearance={{
            theme: shadcn,
            cssLayerName: shadcn.cssLayerName,
            variables: {
              fontFamily: "var(--font-inter)",
              fontFamilyMono: "var(--font-jetbrains-mono)",
              // Clerk derives its largest radius as 2x this base, so half of --radius caps it at 6px.
              borderRadius: "calc(var(--radius) / 2)",
            },
          }}
          afterSignOutUrl={process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL}
        >
          {children}
        </ClerkProvider>
      </body>
    </html>
  );
}
