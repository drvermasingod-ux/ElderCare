import { cp, mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url));
const output = path.join(root, "dist");
const apiBaseUrl = (process.env.VITE_API_URL || "https://eldercare-api-vaee.onrender.com").trim().replace(/\/+$/, "");
const downloadUrl = (process.env.PUBLIC_DOWNLOAD_URL || "").trim();

function publicHttpsUrl(value, label) {
  if (!value) return "";
  let url;
  try {
    url = new URL(value);
  } catch {
    throw new Error(`${label} must be a valid absolute HTTPS URL.`);
  }
  if (url.protocol !== "https:" || !url.hostname || url.username || url.password) {
    throw new Error(`${label} must be HTTPS and must not contain credentials.`);
  }
  return url.toString();
}

const config = {
  apiBaseUrl: publicHttpsUrl(apiBaseUrl, "VITE_API_URL"),
  downloadUrl: publicHttpsUrl(downloadUrl, "PUBLIC_DOWNLOAD_URL"),
};

await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
for (const entry of ["index.html", "admin.html", "site.js", "runtime-config.js", "styles.css", "assets", "manus-routes.json"]) {
  await cp(path.join(root, entry), path.join(output, entry), { recursive: true });
}
await writeFile(
  path.join(output, "runtime-config.js"),
  `window.ELDERCARE_CONFIG = ${JSON.stringify(config)};\n`,
  "utf8",
);
console.log("Cloudflare Pages static website built with public runtime configuration.");
