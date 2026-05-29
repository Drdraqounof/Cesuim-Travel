import { cpSync, existsSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const currentDir = path.dirname(__filename);
const foldersToCopy = ["Assets", "ThirdParty", "Workers", "Widgets"];

// Try to locate the Cesium build directory by walking up from likely start points.
function findCesiumRoot(startDirs) {
  for (const start of startDirs) {
    let dir = path.resolve(start);
    while (true) {
      const candidate = path.join(dir, "node_modules", "cesium", "Build", "Cesium");
      if (existsSync(candidate)) return candidate;

      const parent = path.dirname(dir);
      if (!parent || parent === dir) break;
      dir = parent;
    }
  }

  return null;
}

// Prefer an explicit override if provided (useful in CI)
const override = process.env.CESIUM_BUILD_PATH;

const cesiumRoot = override && existsSync(override)
  ? override
  : findCesiumRoot([currentDir, process.cwd()]);

if (!cesiumRoot) {
  console.error("Unable to find Cesium build assets. Looked from:", currentDir, process.cwd());
  console.error("You can set the CESIUM_BUILD_PATH env var to the path containing Build/Cesium");
  throw new Error("Cesium build assets not found. Ensure 'cesium' is installed and accessible.");
}

// Place assets into the current working directory's public/cesium so deploy builders
// that change the working directory (e.g., Vercel) will get the files in the served
// public folder for that build root.
const publicRoot = path.join(process.cwd(), "public", "cesium");

mkdirSync(publicRoot, { recursive: true });

for (const folder of foldersToCopy) {
  const src = path.join(cesiumRoot, folder);
  const dest = path.join(publicRoot, folder);
  if (!existsSync(src)) {
    console.warn(`Skipping missing Cesium folder: ${src}`);
    continue;
  }
  cpSync(src, dest, { force: true, recursive: true });
}

console.log("Copied Cesium runtime assets to", publicRoot);