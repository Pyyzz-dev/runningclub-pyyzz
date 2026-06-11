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
const png32 = await sharp(buffer).resize(32, 32, { fit: "contain", background: "#ffffff" }).png().toBuffer();
const png16 = await sharp(buffer).resize(16, 16, { fit: "contain", background: "#ffffff" }).png().toBuffer();

const toIco = (await import("to-ico")).default;
const ico = await toIco([png16, png32]);
writeFileSync(faviconPath, ico);

console.log(`Wrote ${faviconPath} (${ico.length} bytes)`);
