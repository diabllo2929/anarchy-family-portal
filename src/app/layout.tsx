import type { Metadata } from "next";
import { Cairo } from "next/font/google";
import "./globals.css";

const cairo = Cairo({
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "ANARCHY FAMILY | بوابة العيلة الرسمية - Kian CFW",
  description: "الموقع الرسمي لعيلة Anarchy في سيرفر كيان - الليدربورد، الرتب، اللوجات، والتقديم",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" className="dark">
      <body className={`${cairo.className} bg-[#070506] text-[#f7f3eb] antialiased selection:bg-red-600/40 selection:text-white min-h-screen`}>
        {children}
      </body>
    </html>
  );
}