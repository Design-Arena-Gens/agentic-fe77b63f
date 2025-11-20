import type { Metadata } from "next";
import {
  Cinzel_Decorative,
  Noto_Serif_Devanagari,
} from "next/font/google";
import "./globals.css";

const displayFont = Cinzel_Decorative({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "700"],
});

const bodyFont = Noto_Serif_Devanagari({
  variable: "--font-body",
  subsets: ["devanagari", "latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "वनगाथा — राम और जटायु",
  description:
    "स्वर्णिम संध्या में राम, लक्ष्मण और जटायु का पवित्र क्षण — मिथकीय सिनेमैटिक अनुभव।",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${displayFont.variable} ${bodyFont.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
