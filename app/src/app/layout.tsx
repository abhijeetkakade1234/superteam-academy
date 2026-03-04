import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Suspense } from "react";
import "./globals.css";
import { WalletContextProvider } from "@/components/WalletContextProvider";
import { ServicesProvider } from "@/contexts/ServicesContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { I18nProvider } from "@/components/I18nProvider";
import { Navbar } from "@/components/Navbar";
import { GoogleAnalytics } from "@next/third-parties/google";
import { Toaster } from "react-hot-toast";
import { AnalyticsTracker } from "@/components/AnalyticsTracker";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Superteam Academy — Master Solana Development",
  description: "The decentralized learning platform where developers earn soulbound XP tokens and verifiable credentials.",
  manifest: "/manifest.json",

  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Superteam Academy",
  },
  icons: {
    apple: "/logo192.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body className={`${inter.variable} font-sans`}>
        <I18nProvider>
          <Suspense fallback={null}>
            <AnalyticsTracker />
          </Suspense>
          <WalletContextProvider>
            <AuthProvider>
              <ServicesProvider>
                <Navbar />
                {children}
                <Toaster
                  position="top-right"
                  toastOptions={{
                    duration: 4000,
                    style: {
                      background: "rgba(0, 0, 0, 0.9)",
                      color: "#fff",
                      border: "1px solid rgba(255, 255, 255, 0.1)",
                    },
                    success: {
                      iconTheme: {
                        primary: "#22c55e",
                        secondary: "#000",
                      },
                    },
                    error: {
                      iconTheme: {
                        primary: "#ef4444",
                        secondary: "#000",
                      },
                    },
                  }}
                />
              </ServicesProvider>
            </AuthProvider>
          </WalletContextProvider>
        </I18nProvider>
        {/* Microsoft Clarity Heatmap */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function(c,l,a,r,i,t,y){
                  c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
                  t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
                  y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
              })(window, document, "clarity", "script", "${process.env.NEXT_PUBLIC_CLARITY_ID || "your-clarity-id"}");
            `,
          }}
        />
      </body>
      <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID || ""} />
    </html>
  );
}
