import type { Metadata } from "next";
import { Space_Grotesk } from "next/font/google";
import "@fontsource/dm-sans/400.css";
import "@fontsource/dm-sans/500.css";
import "@fontsource/dm-sans/600.css";
import "@fontsource/dm-sans/700.css";
import "./globals.css";
import { Footer } from "@/components/Footer";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["500", "700"],
  variable: "--font-headline",
  display: "swap",
});

export const metadata: Metadata = {
  title: "MerchNguys",
  description: "MerchNguys — campus merch, commit-then-print.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={spaceGrotesk.variable}>
      <body className="antialiased">
        {children}
        <Footer />
      </body>
    </html>
  );
}
