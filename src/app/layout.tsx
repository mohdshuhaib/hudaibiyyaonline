import type { Metadata } from "next";
import { Inter, Noto_Sans_Malayalam } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const notoSansMalayalam = Noto_Sans_Malayalam({
  variable: "--font-malayalam",
  subsets: ["malayalam"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Hudaibiyya Islamic Trust | ഹുദൈബിയ്യ ഇസ്ലാമിക് ട്രസ്റ്റ്",
  description:
    "Official Membership Registration & Verification Portal for Hudaibiyya Islamic Trust (ഹുദൈബിയ്യ ഇസ്ലാമിക് ട്രസ്റ്റ്).",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ml"
      className={`${inter.variable} ${notoSansMalayalam.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900 font-sans">
        {children}
      </body>
    </html>
  );
}
