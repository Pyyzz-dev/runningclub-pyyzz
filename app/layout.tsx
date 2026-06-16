import type { Metadata } from "next";
import { Be_Vietnam_Pro } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { GlobalToasts } from "@/components/admin/GlobalToasts";
import { ConditionalSiteChrome } from "@/components/layout/ConditionalSiteChrome";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { fetchCurrentUser } from "@/app/actions/dataActions";
import { CLUB_DESCRIPTION, CLUB_LOGO_URL, CLUB_NAME } from "@/lib/site-config";
import "./globals.css";

const beVietnamPro = Be_Vietnam_Pro({
  subsets: ["latin", "vietnamese"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
  preload: true,
  variable: "--font-be-vietnam",
});

export const metadata: Metadata = {
  title: {
    default: CLUB_NAME,
    template: `%s | ${CLUB_NAME}`,
  },
  description: CLUB_DESCRIPTION,
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [{ url: "/favicon.ico", sizes: "any" }],
    apple: [{ url: CLUB_LOGO_URL, type: "image/jpeg" }],
  },
  openGraph: {
    title: CLUB_NAME,
    description: CLUB_DESCRIPTION,
    images: [{ url: CLUB_LOGO_URL, alt: CLUB_NAME }],
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { data: initialUser } = await fetchCurrentUser();

  return (
    <html lang="vi" className={beVietnamPro.variable} suppressHydrationWarning>
      <body className="flex min-h-screen flex-col font-sans antialiased">
        <AuthProvider initialUser={initialUser}>
          <ConditionalSiteChrome>
            <Header />
            <main className="w-full flex-1 overflow-x-hidden">{children}</main>
            <Footer />
          </ConditionalSiteChrome>
          <Toaster richColors position="top-right" />
          <GlobalToasts />
        </AuthProvider>
      </body>
    </html>
  );
}
