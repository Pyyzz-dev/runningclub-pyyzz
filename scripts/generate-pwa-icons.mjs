import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const LOGO_URL =
  "https://tlmzqwnvgcxhekljtrvg.supabase.co/storage/v1/object/public/Running%20Club%20-%20CMC%20Global/Image/logo_runningclub.jpg";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const logoPath = join(__dirname, "logo_runningclub.jpg");
const publicDir = join(root, "public");

const icons = [
  { size: 192, filename: "logo_runningclub_wb_192x192.png" },
  { size: 512, filename: "logo_runningclub_wb_512x512.png" },
];

mkdirSync(publicDir, { recursive: true });

let buffer;
if (existsSync(logoPath)) {
  buffer = readFileSync(logoPath);
} else {
  const response = await fetch(LOGO_URL);
  if (!response.ok) {
    throw new Error(`Failed to download logo: ${response.status}`);
  }
  buffer = Buffer.from(await response.arrayBuffer());
  writeFileSync(logoPath, buffer);
}

const sharp = (await import("sharp")).default;

for (const { size, filename } of icons) {
  const outputPath = join(publicDir, filename);
  await sharp(buffer)
    .resize(size, size, { fit: "contain", background: "#ffffff" })
    .png()
    .toFile(outputPath);
  console.log(`Wrote ${outputPath}`);
}
