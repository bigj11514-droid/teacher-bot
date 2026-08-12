const fs = require("fs");
const path = require("path");

console.log("--- Checking Links and References ---");
const htmlFiles = fs.readdirSync(".").filter((f) => f.endsWith(".html"));
const jsFiles = fs.readdirSync(".").filter((f) => f.endsWith(".js"));
const cssFiles = fs.readdirSync(".").filter((f) => f.endsWith(".css"));

// Check href and src links in HTML
htmlFiles.forEach((file) => {
  const content = fs.readFileSync(file, "utf8");
  // Check hrefs
  const hrefMatches = [...content.matchAll(/href=["']([^"']+)["']/g)];
  hrefMatches.forEach((m) => {
    let target = m[1].split("?")[0].split("#")[0];
    if (
      target &&
      !target.startsWith("http") &&
      !target.startsWith("https") &&
      !target.startsWith("mailto:") &&
      !target.startsWith("tel:") &&
      !target.startsWith("javascript:")
    ) {
      if (!fs.existsSync(target)) {
        console.error(
          `Broken link in ${file}: href="${m[1]}" -> ${target} does not exist`,
        );
      }
    }
  });

  // Check srcs
  const srcMatches = [...content.matchAll(/src=["']([^"']+)["']/g)];
  srcMatches.forEach((m) => {
    let target = m[1].split("?")[0].split("#")[0];
    if (
      target &&
      !target.startsWith("http") &&
      !target.startsWith("https") &&
      !target.startsWith("data:")
    ) {
      if (!fs.existsSync(target)) {
        console.error(
          `Broken src in ${file}: src="${m[1]}" -> ${target} does not exist`,
        );
      }
    }
  });
});

console.log("\n--- Checking DOM Element references in teacherbot.js ---");
const jsContent = fs.readFileSync("teacherbot.js", "utf8");

const getElementByIdMatches = [
  ...jsContent.matchAll(/document\.getElementById\(["']([^"']+)["']\)/g),
];
const referencedIds = Array.from(
  new Set(getElementByIdMatches.map((m) => m[1])),
);

console.log("IDs referenced in teacherbot.js:", referencedIds);

htmlFiles.forEach((file) => {
  const content = fs.readFileSync(file, "utf8");
  const idsInHtml = new Set(
    [...content.matchAll(/id=["']([^"']+)["']/g)].map((m) => m[1]),
  );
  console.log(`\nHTML File: ${file}`);
  referencedIds.forEach((id) => {
    if (idsInHtml.has(id)) {
      console.log(`  [FOUND] #${id}`);
    }
  });
});

console.log("\n--- Check complete ---");
