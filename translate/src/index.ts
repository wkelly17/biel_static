import fs, {writeFileSync} from "node:fs";

let rootDir = process.cwd();
console.log({rootDir});
let text_file_location = rootDir + "/site/README.md";

let data = fs.readFileSync(text_file_location, {
  encoding: "utf-8",
});

console.log({data});
