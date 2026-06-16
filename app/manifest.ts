import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "CLB Chạy bộ CMC Global",
    short_name: "CMC Runner",
    description: "Nơi kết nối những người yêu thể thao của CMC Global",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#0ea5e9",
    icons: [
      {
        src: "/logo_runningclub_wb_192x192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/logo_runningclub_wb_512x512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
