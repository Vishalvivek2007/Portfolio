import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistPixelSquare, GeistPixelCircle } from "geist/font/pixel";
import "./globals.css";

export const metadata: Metadata = {
  title: "Vishal Vivek, full-stack and ML engineer",
  description: "Third-year CS student at VIT Vellore building full-stack and machine-learning products people actually use.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistPixelSquare.variable} ${GeistPixelCircle.variable} res-broadcast`}>
      <body>{children}</body>
    </html>
  );
}
