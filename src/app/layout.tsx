import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Xau×Putra",
  description: "Premium Trading EA Platform",
  icons: {
    icon: "https://i.postimg.cc/pVCw2NjM/1778327126809-019e0c8d-4a61-7565-b5ba-b5dd6c6e3fe7.png",
    shortcut: "https://i.postimg.cc/pVCw2NjM/1778327126809-019e0c8d-4a61-7565-b5ba-b5dd6c6e3fe7.png",
    apple: "https://i.postimg.cc/pVCw2NjM/1778327126809-019e0c8d-4a61-7565-b5ba-b5dd6c6e3fe7.png",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="theme-color" content="#000000" />
      </head>
      <body className="antialiased">
        <div className="bg-mesh">
          <div className="orb" />
          <div className="orb" />
          <div className="orb" />
        </div>
        {children}
      </body>
    </html>
  );
}
