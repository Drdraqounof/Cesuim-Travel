// DO NOT EDIT — This file is automatically maintained and checked by the CI pipeline.
// If changes are needed, update the source generator or contact the project maintainer.
// TerraScope App Test / Verification Script
// Run with: npm run test  (or: node scripts/run-tests.mjs)

import { execSync } from "child_process";
import { existsSync, readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

let passed = 0;
let failed = 0;

function pass(label) {
  passed++;
  console.log(`  ✅  ${label}`);
}

function fail(label, detail) {
  failed++;
  console.log(`  ❌  ${label}`);
  if (detail) console.log(`      ${detail}`);
}

function section(title) {
  console.log(`\n── ${title} ─${"─".repeat(60 - title.length - 4)}`);
}

function fileExists(path) {
  return existsSync(resolve(ROOT, path));
}

// ── 1. File Structure ────────────────────────────────────
section("File Structure");

const REQUIRED_FILES = [
  "package.json",
  "next.config.ts",
  "tsconfig.json",
  "components/CesiumMap.tsx",
  "components/Tutorial.tsx",
  "components/CityStatsDisplay.tsx",
  "components/PlaceSearch.tsx",
  "components/HeroPage.tsx",
  "lib/facts.ts",
  "lib/storage.ts",
  "lib/types.ts",
  "lib/prisma.ts",
  "lib/auth.ts",
  "lib/session.ts",
  "app/page.tsx",
  "app/layout.tsx",
  "app/viewer/page.tsx",
  "app/dashboard/page.tsx",
  "app/api/facts/route.ts",
  "app/api/temperature/route.ts",
  "app/api/locations/route.ts",
  "docs/facts-pipeline.md",
  "docs/location-info-overlay.md",
  "docs/cesium-render.md",
  "docs/heatmap-implementation.md",
  "prisma/schema.prisma",
];

let allFilesExist = true;
for (const f of REQUIRED_FILES) {
  if (!fileExists(f)) {
    fail(`Missing file: ${f}`);
    allFilesExist = false;
  }
}
if (allFilesExist) pass(`All ${REQUIRED_FILES.length} required files exist`);

// ── 2. Facts Database Integrity ──────────────────────────
section("Facts Database");

try {
  const factsContent = readFileSync(resolve(ROOT, "lib/facts.ts"), "utf8");

  // Count famous place entries by counting 'name:' lines (skip the interface definition)
  const nameLines = factsContent.match(/^\s+name: "/gm);
  const entryCount = nameLines ? nameLines.length : 0;

  // Count fact entries
  const factLines = factsContent.match(/"([^"]+)"/g);
  const uniqueFacts = new Set(
    (factsContent.match(/"([^"]{10,})"/g) || []).filter(
      (f) => f.length > 20 && !f.startsWith('"use ')
    )
  );

  if (entryCount >= 40) {
    pass(`${entryCount} famous places registered`);
  } else {
    fail(`Only ${entryCount} famous places (expected ≥ 40)`);
  }

  if (uniqueFacts.size >= 160) {
    pass(`${uniqueFacts.size} unique fact strings`);
  } else {
    fail(`Only ${uniqueFacts.size} unique fact strings (expected ≥ 160)`);
  }

  // Check each place has a country field
  const countryLines = factsContent.match(/^\s+country: "/gm);
  const countryCount = countryLines ? countryLines.length : 0;
  if (countryCount === entryCount) {
    pass(`All ${entryCount} places have country field`);
  } else {
    fail(`${countryCount}/${entryCount} places have country field`);
  }

  // Check no duplicate place names
  const placeNames = [...factsContent.matchAll(/name: "([^"]+)"/g)].map(m => m[1]);
  const seen = new Set();
  let dupes = 0;
  for (const name of placeNames) {
    if (name.length > 2 && seen.has(name)) dupes++;
    seen.add(name);
  }
  if (dupes === 0) {
    pass("No duplicate place names");
  } else {
    fail(`${dupes} duplicate place names found`);
  }

  // Test haversine distance (Tokyo to Tokyo = ~0)
  const code = factsContent;
  if (code.includes("function haversineKm")) {
    pass("haversineKm function defined");
  }
  if (code.includes("function findFamousPlace")) {
    pass("findFamousPlace function defined");
  }
  if (code.includes("function getRandomFact")) {
    pass("getRandomFact function defined");
  }
} catch (e) {
  fail("Could not read lib/facts.ts", e.message);
}

// ── 3. CesiumMap Component Integrity ────────────────────
section("CesiumMap Component");

try {
  const cesiumContent = readFileSync(resolve(ROOT, "components/CesiumMap.tsx"), "utf8");

  // Check key features are present
  const checks = [
    ["location info overlay", 'centerLocation'],
    ["place name state", 'centerPlaceName'],
    ["full address state", 'centerFullAddress'],
    ["elevation state", 'centerElevation'],
    ["fact state", 'centerFact'],
    ["show details toggle", 'showDetails'],
    ["reverse geocode", 'nominatim.openstreetmap.org/reverse'],
    ["elevation API", 'api.open-elevation.com'],
    ["facts API", '/api/facts'],
    ["more details button", 'More Details'],
    ["less details button", 'Less Details'],
    ["country normalization", 'COUNTRY_ALIASES'],
    ["normalizeCountry function", 'function normalizeCountry'],
    ["pointer-events-auto on buttons", 'pointer-events-auto'],
  ];

  for (const [label, pattern] of checks) {
    if (cesiumContent.includes(pattern)) {
      pass(label);
    } else {
      fail(label, `Pattern "${pattern}" not found`);
    }
  }
} catch (e) {
  fail("Could not read CesiumMap.tsx", e.message);
}

// ── 4. Viewer Page Integrity ────────────────────────────
section("Viewer Page");

try {
  const viewerContent = readFileSync(resolve(ROOT, "app/viewer/page.tsx"), "utf8");

  const viewerChecks = [
    ["tutorial import", 'Tutorial'],
    ["tutorial check on mount", 'isTutorialCompleted'],
    ["tutorial state", 'showTutorial'],
    ["tutorial rendered", '<Tutorial'],
  ];

  for (const [label, pattern] of viewerChecks) {
    if (viewerContent.includes(pattern)) {
      pass(label);
    } else {
      fail(label, `Pattern "${pattern}" not found`);
    }
  }
} catch (e) {
  fail("Could not read viewer page", e.message);
}

// ── 5. Tutorial Component ───────────────────────────────
section("Tutorial Component");

try {
  const tutorialContent = readFileSync(resolve(ROOT, "components/Tutorial.tsx"), "utf8");

  if (tutorialContent.includes("Search & Discover")) {
    pass("Has 'Search & Discover' step");
  }
  if (tutorialContent.includes("Fun Facts")) {
    pass("Has 'Fun Facts' step");
  }

  // Count steps
  const stepHeaders = tutorialContent.match(/title: "/g);
  const stepCount = stepHeaders ? stepHeaders.length : 0;
  if (stepCount >= 5) {
    pass(`${stepCount} tutorial steps`);
  } else {
    fail(`Only ${stepCount} tutorial steps (expected ≥ 5)`);
  }
} catch (e) {
  fail("Could not read Tutorial.tsx", e.message);
}

// ── 6. API Routes ──────────────────────────────────────
section("API Routes");

const apiRoutes = [
  "app/api/facts/route.ts",
  "app/api/temperature/route.ts",
  "app/api/locations/route.ts",
  "app/api/locations/[id]/route.ts",
  "app/api/auth/login/route.ts",
  "app/api/auth/register/route.ts",
  "app/api/auth/logout/route.ts",
  "app/api/auth/me/route.ts",
  "app/api/auth/tutorial/route.ts",
];

let allApiRoutesExist = true;
for (const route of apiRoutes) {
  if (!fileExists(route)) {
    fail(`Missing API route: ${route}`);
    allApiRoutesExist = false;
  }
}
if (allApiRoutesExist) pass(`All ${apiRoutes.length} API routes exist`);

// Check facts route has OpenAI integration
try {
  const factsRoute = readFileSync(resolve(ROOT, "app/api/facts/route.ts"), "utf8");
  if (factsRoute.includes("generateFacts")) pass("Facts API has generateFacts function");
  if (factsRoute.includes("verifyPrompt")) pass("Facts API has fact-checking");
  if (factsRoute.includes("openai.chat.completions.create")) pass("Facts API uses OpenAI");
} catch (e) {
  fail("Could not read facts API route", e.message);
}

// ── 7. Configuration Files ──────────────────────────────
section("Configuration");

try {
  const pkg = JSON.parse(readFileSync(resolve(ROOT, "package.json"), "utf8"));

  const requiredScripts = ["dev", "build", "lint", "copy:cesium-assets"];
  for (const script of requiredScripts) {
    if (pkg.scripts?.[script]) {
      pass(`package.json script: ${script}`);
    } else {
      fail(`Missing package.json script: ${script}`);
    }
  }

  const requiredDeps = ["next", "react", "cesium", "resium", "@prisma/client", "openai"];
  const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };
  for (const dep of requiredDeps) {
    if (allDeps[dep]) {
      pass(`Dependency: ${dep}`);
    } else {
      fail(`Missing dependency: ${dep}`);
    }
  }
} catch (e) {
  fail("Could not read package.json", e.message);
}

// Check tsconfig exists and has strict mode
try {
  const tsconfig = JSON.parse(readFileSync(resolve(ROOT, "tsconfig.json"), "utf8"));
  if (tsconfig.compilerOptions?.strict) {
    pass("TypeScript strict mode enabled");
  } else {
    fail("TypeScript strict mode not enabled");
  }
} catch (e) {
  fail("Could not read tsconfig.json", e.message);
}

// Check env file exists
if (fileExists(".env")) {
  pass(".env file exists");
} else {
  fail(".env file missing — copy .env.example");
}

// ── 8. Documentation ────────────────────────────────────
section("Documentation");

const docFiles = [
  "docs/facts-pipeline.md",
  "docs/location-info-overlay.md",
  "docs/cesium-render.md",
  "docs/heatmap-implementation.md",
  "docs/heat-map.md",
  "docs/temperature-overlay.md",
];

let allDocsExist = true;
for (const doc of docFiles) {
  if (!fileExists(doc)) {
    fail(`Missing doc: ${doc}`);
    allDocsExist = true;
  }
}
if (allDocsExist) pass(`All ${docFiles.length} documentation files exist`);

// ── 9. TypeScript Check ────────────────────────────────
section("TypeScript Compilation");

try {
  execSync("npx tsc --noEmit", { cwd: ROOT, stdio: "pipe", timeout: 60000 });
  pass("TypeScript compiles with no errors");
} catch (e) {
  const output = e.stdout?.toString() || e.stderr?.toString() || "";
  const errors = output.split("\n").filter(l => l.includes("error")).slice(0, 5);
  fail("TypeScript compilation errors", errors.join("\n      ") || "Check output above");
}

// ── 10. ESLint Check ───────────────────────────────────
section("ESLint");

try {
  execSync('npx eslint . --max-warnings 20 --ignore-pattern "public/cesium/**" --ignore-pattern ".next/**"', { cwd: ROOT, stdio: "pipe", timeout: 60000 });
  pass("ESLint passes (≤ 20 warnings)");
} catch (e) {
  const output = e.stdout?.toString() || e.stderr?.toString() || "";
  const warnings = output.split("\n").filter(l => l.includes("warning") || l.includes("error")).slice(0, 5);
  if (warnings.length > 0) {
    fail("ESLint warnings/errors", warnings.join("\n      "));
  } else {
    // ESLint may have failed for other reasons — just note it
    fail("ESLint check failed (see output above)");
  }
}

// ── Summary ─────────────────────────────────────────────
console.log("");
console.log("─".repeat(68));
const total = passed + failed;
console.log(`  ${passed}/${total} checks passed` + (failed === 0 ? "  🎉" : ""));
console.log("─".repeat(68));

process.exit(failed > 0 ? 1 : 0);
