import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const sora = localFont({
  src: [
    { path: "./fonts/Sora-Regular.ttf", weight: "400", style: "normal" },
    { path: "./fonts/Sora-Medium.ttf", weight: "500", style: "normal" },
    { path: "./fonts/Sora-SemiBold.ttf", weight: "600", style: "normal" },
    { path: "./fonts/Sora-Bold.ttf", weight: "700", style: "normal" },
  ],
  variable: "--font-sora",
  display: "swap",
});

const butler = localFont({
  src: [
    { path: "./fonts/Butler_Regular.otf", weight: "400", style: "normal" },
    { path: "./fonts/Butler_Medium.otf", weight: "500", style: "normal" },
    { path: "./fonts/Butler_Bold.otf", weight: "700", style: "normal" },
    { path: "./fonts/Butler_ExtraBold.otf", weight: "800", style: "normal" },
  ],
  variable: "--font-butler",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Herramientas Estudios E",
  description: "Micro-SaaS para emprendedoras. Coach de ventas en Instagram impulsado por IA.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={`${sora.variable} ${butler.variable} antialiased selection:bg-secondary selection:text-white`}>
        {children}
      </body>
    </html>
  );
}
