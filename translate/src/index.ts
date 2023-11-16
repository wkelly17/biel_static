import fs, {writeFileSync} from "node:fs";
import {readdir, stat} from "fs/promises";
// import locales from "../../site/src/config/locales.json";
import {getInput} from "@actions/core";
import {create as globCreate} from "@actions/glob";
import matter from "gray-matter";
import {mdxjs} from "micromark-extension-mdxjs";
import {fromMarkdown} from "mdast-util-from-markdown";
import {mdxFromMarkdown, mdxToMarkdown} from "mdast-util-mdx";
import {toMarkdown} from "mdast-util-to-markdown";
import {visit} from "unist-util-visit";
import * as deepl from "deepl-node";
import {createHash} from "crypto";
import path from "node:path";

const rootDir = process.cwd();
const localesPath = `${rootDir}/site/src/config/locales.json`;
const englishMdFiles = `${rootDir}/site/src/content/en`;
const localesString = fs.readFileSync(localesPath, {
  encoding: "utf-8",
});
const localesJson = JSON.parse(localesString);
const deepLKey = getInput("deepLKey");

async function run() {
  // if (!deepLKey) return console.log("no api key!");
  const globber = await globCreate(`${rootDir}/site/src/content/**/*.mdx`);
  const translator = new deepl.Translator(deepLKey);
  for await (const file of globber.globGenerator()) {
    console.log(file);
  }
}
run();
export async function walk(dir: string = "./src/content"): Promise<string[]> {
  let files: any[] = await readdir(dir);
  files = await Promise.all(
    files.map(async (file: string) => {
      const filePath: string = path.join(dir, file);
      const stats = await stat(filePath);
      if (stats.isDirectory()) return walk(filePath);
      else if (stats.isFile()) return filePath;
    })
  );

  return files.reduce((all, folderContents) => all.concat(folderContents), []);
}
