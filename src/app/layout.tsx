import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistPixelSquare, GeistPixelCircle, GeistPixelLine, GeistPixelTriangle, GeistPixelGrid } from "geist/font/pixel";
import "./globals.css";

export const metadata: Metadata = {
  title: "Vishal Vivek, full-stack and ML engineer",
  description: "Third-year CS student at VIT Vellore building full-stack and machine-learning products people actually use.",
};

const BOOT_JS = "try{var d=document.documentElement,q=new URLSearchParams(location.search).get(\"boot\"),r=matchMedia(\"(prefers-reduced-motion: reduce)\").matches,s=sessionStorage.getItem(\"raster-booted\");d.dataset.boot=(q===\"skip\"||r)?\"skip\":(s?\"short\":\"run\")}catch(e){document.documentElement.dataset.boot=\"skip\"}";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${GeistSans.variable} ${GeistPixelSquare.variable} ${GeistPixelCircle.variable} ${GeistPixelLine.variable} ${GeistPixelTriangle.variable} ${GeistPixelGrid.variable} res-broadcast`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: BOOT_JS }} />
        <noscript><style>{"html[data-boot=run] body{clip-path:none!important}html[data-boot=run] [data-late]{opacity:1!important}"}</style></noscript>
      </head>
      <body>{children}</body>
    </html>
  );
}
