import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TuneItIn",
  description: "A music player app built with Next.js",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
