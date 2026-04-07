import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "RAG Paper Compare",
  description: "A narrow AI-enabled proof of concept for comparing a curated set of RAG papers.",
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
