import type { Metadata, Viewport } from "next";
import { DM_Sans, JetBrains_Mono, Manrope } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { TelegramBridge } from "@/components/telegram-bridge";

const manrope = Manrope({
  subsets: ["latin", "cyrillic"],
  variable: "--font-manrope",
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin", "cyrillic"],
  variable: "--font-jetbrains",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Sollo — журнал сделок и аналитика",
  description:
    "Приватный трейдинг-дашборд: журнал сделок, аналитика, идеи, библиотека стратегий, академия и рейтинг.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0a0a0f",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" className={`${manrope.variable} ${jetbrains.variable} ${dmSans.variable}`} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `try{if(localStorage.getItem('theme')==='dark')document.documentElement.setAttribute('data-theme','dark');}catch(e){}`,
          }}
        />
        <script src="https://telegram.org/js/telegram-web-app.js" async />
      </head>
      <body className="min-h-full bg-bg text-text-1">
        <Providers>
          {children}
          <TelegramBridge />
        </Providers>
      </body>
    </html>
  );
}
