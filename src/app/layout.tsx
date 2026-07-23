import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ServiceWorkerRegistration } from "@/components/service-worker-registration";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Tiera",
  description: "Discover entertainment you'll actually enjoy.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Tiera",
  },
  // Next's appleWebApp option only emits the modern `mobile-web-app-capable`
  // tag — iOS versions before 17.4 only honor the apple-prefixed one, so add
  // it explicitly to cover both.
  other: {
    "apple-mobile-web-app-capable": "yes",
  },
};

export const viewport: Viewport = {
  themeColor: "#6D5DF6",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`dark ${geistSans.variable} ${geistMono.variable} h-full scroll-smooth antialiased`}
      suppressHydrationWarning
    >
      <head>
        {/* Runs before hydration/paint so a stored "light" preference (see
            ThemeToggleButton) takes effect immediately on reload instead of
            flashing dark first, or worse, silently reverting to dark with
            no visible explanation — exactly what broke the previous
            version of this toggle. */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "try{if(localStorage.getItem('theme')==='light'){document.documentElement.classList.remove('dark')}}catch(e){}",
          }}
        />
      </head>
      <body
        className="min-h-full flex flex-col"
        suppressHydrationWarning
      >
        {children}
        <ServiceWorkerRegistration />
      </body>
    </html>
  );
}
