const fs = require("fs");

const dir = ".next/static/chunks/";
const files = fs.readdirSync(dir).filter(f => f.endsWith(".js"));

let totalEscapes = 0;
let totalSize = 0;

files.forEach(f => {
  const c = fs.readFileSync(dir + f, "utf8");
  totalSize += c.length;
  
  let count = 0;
  for (let i = 0; i < c.length - 3; i++) {
    if (c[i] === "`") {
      for (let j = i + 1; j < c.length && c[j] !== "`"; j++) {
        if (c[j] === "\\" && c[j+1] >= "0" && c[j+1] <= "9") {
          count++;
          break;
        }
      }
    }
  }
  
  if (count > 0) {
    console.log(f + ": " + count + " octal escapes in template strings, size=" + (c.length/1024).toFixed(0) + "KB");
    totalEscapes += count;
  }
});

console.log("\nTotal js files in static/chunks: " + files.length);
console.log("Total template+octal escapes: " + totalEscapes);
console.log("Total JS size: " + (totalSize/1024).toFixed(0) + "KB");

fs.writeFileSync("C:\\Users\\LAUNCH~1\\AppData\\Local\\Temp\\opencode\\build_verification.txt", 
  "Build verification:\n" +
  "Total files: " + files.length + "\n" +
  "Total template+octal escapes: " + totalEscapes + "\n" +
  "Previous: 89 escapes in 0f2~mn9l9w4y1.js\n" +
  "Status: " + (totalEscapes === 0 ? "FIXED" : "STILL HAS ISSUES"));
