import { cpSync, existsSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(currentDir, "..");
const cesiumRoot = path.join(projectRoot, "node_modules", "cesium", "Build", "Cesium");
const publicRoot = path.join(projectRoot, "public", "cesium");
const foldersToCopy = ["Assets", "ThirdParty", "Workers", "Widgets"];

if (!existsSync(cesiumRoot)) {
  throw new Error(`Cesium build assets not found at ${cesiumRoot}`);
}

mkdirSync(publicRoot, { recursive: true });

for (const folder of foldersToCopy) {
  cpSync(path.join(cesiumRoot, folder), path.join(publicRoot, folder), {
    force: true,
    recursive: true,
  });
}

console.log("Copied Cesium runtime assets to public/cesium");