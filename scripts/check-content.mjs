import { readFileSync } from "node:fs";
const txt = readFileSync("src/content.ts", "utf8");
const used = (txt.match(/\bTODO\b/g) || []).length - 2; // minus the definition and its comment
console.log(used > 0 ? "content.ts still has " + used + " TODO fields" : "content ok");
process.exit(used > 0 ? 1 : 0);
