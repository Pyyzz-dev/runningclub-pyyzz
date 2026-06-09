import type { Metadata } from "next";
import { Be_Vietnam_Pro } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { GlobalToasts } from "@/components/admin/GlobalToasts";
import { ConditionalSiteChrome } from "@/components/layout/ConditionalSiteChrome";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { fetchCurrentUser } from "@/app/actions/dataActions";
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
    default: "Câu lạc bộ Chạy bộ CMC Global",
    template: "%s | Câu lạc bộ Chạy bộ CMC Global",
  },
  description:
    "Câu lạc bộ chạy bộ CMC Global — cộng đồng runners năng động, lịch tập, sự kiện và bảng xếp hạng.",
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
