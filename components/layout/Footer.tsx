import { Separator } from "@/components/ui/separator";
import { getServerPathname } from "@/lib/server-pathname";
import Link from "next/link";
import { ExternalLink, Mail, MapPin } from "lucide-react";

const footerLinks = {
  club: [
    { label: "Giới thiệu", href: "/about" },
    { label: "Lịch sử", href: "/history" },
    { label: "Thành tích", href: "/achievements" },
  ],
  activities: [
    { label: "Lịch tập", href: "/training" },
    { label: "Sự kiện", href: "/events" },
    { label: "Cộng đồng", href: "/community" },
    { label: "Bảng xếp hạng", href: "/leaderboard" },
  ],
};

export async function Footer() {
  const pathname = await getServerPathname();

  if (pathname.startsWith("/admin")) {
    return null;
  }

  return (
    <footer className="border-t bg-white">
      <div className="container-custom py-12">
        <div className="grid gap-8 md:grid-cols-3">
          <div>
            <h3 className="font-display text-lg font-semibold text-primary">
              Câu lạc bộ Chạy bộ CMC Global
            </h3>
            <p className="mt-3 text-sm text-muted-foreground">
              Cộng đồng chạy bộ năng động — cùng nhau chinh phục từng cây số.
            </p>
            <div className="mt-4 space-y-2 text-sm text-muted-foreground">
              <p className="flex items-center gap-2">
                <MapPin className="h-4 w-4 shrink-0" />
                Hà Nội, Việt Nam
              </p>
              <p className="flex items-center gap-2">
                <Mail className="h-4 w-4 shrink-0" />
                contact@cmcglobal.vn
              </p>
            </div>
          </div>

          <div>
            <h4 className="font-semibold">Về CLB</h4>
            <ul className="mt-3 space-y-2">
              {footerLinks.club.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-primary"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold">Hoạt động</h4>
            <ul className="mt-3 space-y-2">
              {footerLinks.activities.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-primary"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <Separator className="my-8" />

        <div className="flex flex-col items-center justify-between gap-4 text-sm text-muted-foreground sm:flex-row">
          <p>
            © {new Date().getFullYear()} Câu lạc bộ Chạy bộ CMC Global. All rights
            reserved.
          </p>
          <Link
            href="https://cmcglobal.vn"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 transition-colors hover:text-primary"
          >
            CMC Global
            <ExternalLink className="h-3 w-3" />
          </Link>
        </div>
      </div>
    </footer>
  );
}
