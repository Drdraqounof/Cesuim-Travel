const fs = require("fs");
const c = fs.readFileSync(".next/static/chunks/03~yq9q893hmn.js", "utf8");
const idx = c.indexOf("\\0");
if (idx === -1) {
  console.log("no \\0 found");
  process.exit(0);
}
const s = Math.max(0, idx - 300);
const e = Math.min(c.length, idx + 300);
console.log(c.substring(s, e));
