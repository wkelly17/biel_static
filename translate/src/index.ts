import fs, {writeFileSync} from "node:fs";
import {readdir, stat} from "fs/promises";
import locales from "../../site/src/config/locales.json";
import {getInput} from "@actions/core";

const name = getInput("name");

console.log({name});
locales.forEach((locale) => {
  console.log({locale});
});
// let rootDir = process.cwd();
// console.log({rootDir});
// let text_file_location = rootDir + "/site/README.md";

// let data = fs.readFileSync(text_file_location, {
//   encoding: "utf-8",
// });

// console.log({data});
