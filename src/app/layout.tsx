import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import NextTopLoader from "nextjs-toploader";
import { Geist, Geist_Mono } from "next/font/google";
import { Providers } from "@/app/restaurant/components/providers";
import { INIT_SCRIPT } from "@/app/restaurant/lib/init-script";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Microsoft Clarity (session recordings and heatmaps). The tag loads itself asynchronously, so it does not block rendering.
const CLARITY_SCRIPT = `(function(c,l,a,r,i,t,y){
  c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
  t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
  y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
})(window, document, "clarity", "script", "yxn14570qv");`;

export const metadata: Metadata = {
  title: "AI Engineer Lab",
  description: "Tune chunking, retrieval and reranking live, and evaluate RAG on real applications.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // Browser extensions (e.g. Scribe) add attributes to <html>/<body> before React hydrates; that is not an app bug.
    <html lang="en" suppressHydrationWarning className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: INIT_SCRIPT }} />
        <script type="text/javascript" dangerouslySetInnerHTML={{ __html: CLARITY_SCRIPT }} />
      </head>
      <body suppressHydrationWarning className="flex min-h-full flex-col">
        {/* The thin line along the top edge while a page loads; white because the header it runs over is brand green. */}
        <NextTopLoader color="#ffffff" height={3} showSpinner={false} shadow="0 0 10px rgb(255 255 255 / 0.9)" zIndex={2000} />
        <Providers>{children}</Providers>
        <Analytics />
      </body>
    </html>
  );
}
