import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const LOGO_URL =
  "https://tlmzqwnvgcxhekljtrvg.supabase.co/storage/v1/object/public/Running%20Club%20-%20CMC%20Global/Image/logo_runningclub.jpg";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const logoPath = join(__dirname, "logo_runningclub.jpg");
const faviconPath = join(root, "app", "favicon.ico");

const response = await fetch(LOGO_URL);
if (!response.ok) {
  throw new Error(`Failed to download logo: ${response.status}`);
}

const buffer = Buffer.from(await response.arrayBuffer());
writeFileSync(logoPath, buffer);

const sharp = (await import("sharp")).default;
const sizes = [16, 32, 64];
const pngBuffers = await Promise.all(
  sizes.map((size) =>
    sharp(buffer)
      .resize(size, size, { fit: "contain", background: "#ffffff" })
      .png()
      .toBuffer()
  )
);

const toIco = (await import("to-ico")).default;
const ico = await toIco(pngBuffers);
writeFileSync(faviconPath, ico);

console.log(`Wrote ${faviconPath} (${ico.length} bytes, ${sizes.join("/")}px)`);
