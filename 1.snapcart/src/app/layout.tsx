
import type { Metadata } from "next";
import { Manrope, Space_Grotesk } from "next/font/google";

import "./globals.css";
import Provider from "@/Provider";
import StoreProvider from "@/redux/StoreProvider";
import InitUser from "@/InitUser";
import RootLayoutShell from "@/components/RootLayoutShell";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-sans",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
});

export const metadata: Metadata = {
  title: "Quick Basket | Fast groceries, polished delivery operations",
  description:
    "Quick Basket brings groceries, delivery operations, and customer tracking into one fast and premium shopping experience.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${manrope.variable} ${spaceGrotesk.variable} min-h-screen w-full bg-[var(--app-bg)] text-slate-950 antialiased`}
      >
        <Provider>
          <StoreProvider>
            <InitUser />
            <RootLayoutShell>{children}</RootLayoutShell>
          </StoreProvider>
        </Provider>
      </body>
    </html>
  );
}
