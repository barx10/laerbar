import type { Metadata } from "next";
import { Playfair_Display, Outfit } from "next/font/google";
import { cookies } from "next/headers";
import Footer from "@/components/shared/Footer";
import { LanguageProvider } from "@/lib/language-context";
import { LANG_COOKIE, parseLang } from "@/lib/language-cookie";
import "./globals.css";

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["400", "700"],
  style: ["normal", "italic"],
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Lærbar",
  description: "Last opp fagstoff og bevis at du kan det.",
  icons: { icon: "/favicon.jpg" },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const lang = parseLang(cookieStore.get(LANG_COOKIE)?.value);
  return (
    <html lang={lang} className={`${playfair.variable} ${outfit.variable}`}>
      <body className="antialiased min-h-screen flex flex-col">
        <LanguageProvider initialLang={lang}>
          <div className="flex-1">{children}</div>
          <Footer />
        </LanguageProvider>
      </body>
    </html>
  );
}
