import fs, {writeFileSync} from "node:fs";
import {readdir, stat} from "fs/promises";
// import locales from "../../site/src/config/locales.json";
import {getInput} from "@actions/core";
const rootDir = process.cwd();
const localesPath = `${rootDir}/site/src/config/locales.json`;
const localesString = fs.readFileSync(localesPath, {
  encoding: "utf-8",
});
const localesJson = JSON.parse(localesString);
console.log({localesJson});
const name = getInput("name");
console.log({name});

// console.log({name});
// locales.forEach((locale) => {
//   console.log({locale});
// });
// console.log({rootDir});
// let text_file_location = rootDir + "/site/README.md";

// let data = fs.readFileSync(text_file_location, {
//   encoding: "utf-8",
// });

// console.log({data});
