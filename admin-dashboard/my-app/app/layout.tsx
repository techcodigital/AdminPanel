import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "InfluenceHub Admin",
  description: "Admin Dashboard",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0, background: "#0a0e1a", color: "#e8eaf6" }}>
        {children}
      </body>
    </html>
  );
}