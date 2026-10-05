import type { Metadata } from "next";
import { CLUB_DESCRIPTION, CLUB_NAME, getSiteUrl } from "@/lib/site-config";
import { getPostExcerpt } from "@/lib/utils/editorjs";

const FALLBACK_IMAGE_PATH = "/logo_runningclub_wb_512x512.png";

interface CreateMetadataOptions {
  title: string;
  description: string;
  image?: string | null;
  url?: string;
  type?: "website" | "article";
  publishedTime?: string;
}

function toOgImageUrl(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  if (!trimmed || !/^https?:\/\//i.test(trimmed)) return null;

  const queryIndex = trimmed.indexOf("?");
  const path = queryIndex === -1 ? trimmed : trimmed.slice(0, queryIndex);
  const query = queryIndex === -1 ? "" : trimmed.slice(queryIndex);
  return `${path.replaceAll("&", "%26")}${query}`;
}

export function createExcerpt(content: string, maxLength = 160): string {
  if (!content.trim()) return "";
  return getPostExcerpt(content, maxLength);
}

export function createMetadata({
  title,
  description,
  image,
  url,
  type = "website",
  publishedTime,
}: CreateMetadataOptions): Metadata {
  const siteUrl = getSiteUrl();
  const summary = description.trim() || CLUB_DESCRIPTION;
  const socialTitle = `${title} | ${CLUB_NAME}`;
  const pageUrl =
    !url || url === "/"
      ? siteUrl
      : `${siteUrl}${url.startsWith("/") ? url : `/${url}`}`;
  const coverUrl = toOgImageUrl(image);
  const ogImage = coverUrl
    ? { url: coverUrl, width: 1200, height: 675, alt: title }
    : {
        url: `${siteUrl}${FALLBACK_IMAGE_PATH}`,
        width: 512,
        height: 512,
        alt: CLUB_NAME,
      };

  return {
    title: { absolute: socialTitle },
    description: summary,
    alternates: { canonical: pageUrl },
    openGraph: {
      title: socialTitle,
      description: summary,
      url: pageUrl,
      siteName: CLUB_NAME,
      images: [ogImage],
      locale: "vi_VN",
      type,
      ...(type === "article" && publishedTime ? { publishedTime } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: socialTitle,
      description: summary,
      images: [ogImage.url],
    },
  };
}
