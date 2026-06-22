import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";

// Poppins — font utama dashboard
const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-poppins",
  display: "swap",
});

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
    <html lang="id" className={`h-full ${poppins.variable}`}>
      <body className="h-full bg-bg text-text-high antialiased">{children}</body>
    </html>
  );
}
