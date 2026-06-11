import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Lexsee Admin Console",
  description: "Admin dashboard for the Lexsee legal tech platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className="h-full">
      <body className="h-full bg-bg text-text-high antialiased">{children}</body>
    </html>
  );
}
