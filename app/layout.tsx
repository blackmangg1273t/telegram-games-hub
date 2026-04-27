import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Games Hub 🎮",
  description: "العاب تنافسية على تيليجرام",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <script src="https://telegram.org/js/telegram-web-app.js" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
      </head>
      <body className="bg-gray-950 text-white min-h-screen overflow-x-hidden antialiased">
        {children}
      </body>
    </html>
  );
}
