import type { Metadata } from "next";
import { Geist_Mono } from "next/font/google";
import localFont from "next/font/local";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/components/theme-provider";

import "./globals.css";
import { SessionProvider } from "next-auth/react";

export const metadata: Metadata = {
  metadataBase: new URL("https://chat.vercel.ai"),
  title: "TIF Agent",
  description:
    "Access and query the TIF dataset to get realtime data on Kids, Parents and Families.",
};

export const viewport = {
  maximumScale: 1, // Disable auto-zoom on mobile Safari
};

const openSauceOne = localFont({
  src: [
    {
      path: "../public/fonts/OpenSauceOne-Light.ttf",
      weight: "300",
      style: "normal",
    },
    {
      path: "../public/fonts/OpenSauceOne-LightItalic.ttf",
      weight: "300",
      style: "italic",
    },
    {
      path: "../public/fonts/OpenSauceOne-Regular.ttf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../public/fonts/OpenSauceOne-Italic.ttf",
      weight: "400",
      style: "italic",
    },
    {
      path: "../public/fonts/OpenSauceOne-Medium.ttf",
      weight: "500",
      style: "normal",
    },
    {
      path: "../public/fonts/OpenSauceOne-MediumItalic.ttf",
      weight: "500",
      style: "italic",
    },
    {
      path: "../public/fonts/OpenSauceOne-SemiBold.ttf",
      weight: "600",
      style: "normal",
    },
    {
      path: "../public/fonts/OpenSauceOne-SemiBoldItalic.ttf",
      weight: "600",
      style: "italic",
    },
    {
      path: "../public/fonts/OpenSauceOne-Bold.ttf",
      weight: "700",
      style: "normal",
    },
    {
      path: "../public/fonts/OpenSauceOne-BoldItalic.ttf",
      weight: "700",
      style: "italic",
    },
  ],
  display: "swap",
  variable: "--font-open-sauce",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-geist-mono",
});

const LIGHT_THEME_COLOR = "hsl(0 0% 100%)";
const DARK_THEME_COLOR = "hsl(230deg 25% 8%)";
const THEME_COLOR_SCRIPT = `\
(function() {
  var html = document.documentElement;
  var meta = document.querySelector('meta[name="theme-color"]');
  if (!meta) {
    meta = document.createElement('meta');
    meta.setAttribute('name', 'theme-color');
    document.head.appendChild(meta);
  }
  function updateThemeColor() {
    var isDark = html.classList.contains('dark');
    meta.setAttribute('content', isDark ? '${DARK_THEME_COLOR}' : '${LIGHT_THEME_COLOR}');
  }
  var observer = new MutationObserver(updateThemeColor);
  observer.observe(html, { attributes: true, attributeFilter: ['class'] });
  updateThemeColor();
})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      className={`${openSauceOne.variable} ${geistMono.variable}`}
      // `next-themes` injects an extra classname to the body element to avoid
      // visual flicker before hydration. Hence the `suppressHydrationWarning`
      // prop is necessary to avoid the React hydration mismatch warning.
      // https://github.com/pacocoursey/next-themes?tab=readme-ov-file#with-app
      lang="en"
      suppressHydrationWarning
    >
      <head>
        <script
          // biome-ignore lint/security/noDangerouslySetInnerHtml: "Required"
          dangerouslySetInnerHTML={{
            __html: THEME_COLOR_SCRIPT,
          }}
        />
      </head>
      <body className="antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          disableTransitionOnChange
          enableSystem
        >
          <Toaster position="top-center" />
          <SessionProvider>{children}</SessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
