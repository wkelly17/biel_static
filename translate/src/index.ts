import * as fs from "node:fs/promises";
// import locales from "../../site/src/config/locales.json";
import {getInput} from "@actions/core";
import {type Globber, create as globCreate} from "@actions/glob";
import matter from "gray-matter";
import {mdxjs} from "micromark-extension-mdxjs";
import {fromMarkdown} from "mdast-util-from-markdown";
import {mdxFromMarkdown, mdxToMarkdown} from "mdast-util-mdx";
import {toMarkdown} from "mdast-util-to-markdown";
import {visit} from "unist-util-visit";
import * as deepl from "deepl-node";
import {createHash} from "crypto";
import path from "node:path";
import {findRowById, writeRow} from "./cache/index.js";
import {isDeepLSupported, type localeType} from "./utils.js";
import "dotenv/config";

async function run() {
  console.log(process.env.NODE_ENV);
  const rootDir =
    process.env.NODE_ENV && process.env.NODE_ENV == "CI"
      ? process.cwd()
      : path.resolve("../");

  const localesPath = `${rootDir}/site/src/config/locales.json`;
  const englishMdFiles = `${rootDir}/site/src/content/en`;
  const localesString = await fs.readFile(localesPath, {
    encoding: "utf-8",
  });
  const localesJson = JSON.parse(localesString) as Array<localeType>;
  const deepLKey =
    process.env.NODE_ENV && process.env.NODE_ENV == "CI"
      ? getInput("deepLKey")
      : (process.env.DEEPLKEY as string);

  // let row = writeRow({
  //   id: "exid",
  //   content: "The tr content",
  //   lastUsed: new Date().toISOString(),
  // });
  // let foundRow = findRowById("exid");
  // console.log({foundRow});

  // if (!deepLKey) return console.log("no api key!");
  const globber = await globCreate(`${rootDir}/site/src/content/**/*.mdx`);
  const translator = new deepl.Translator(deepLKey);
  await handleMdx(globber, translator, localesJson);
}
async function handleMdx(
  englishMdx: Globber,
  translator: deepl.Translator,
  localesJson: Array<localeType>
) {
  for await (const englishFile of englishMdx.globGenerator()) {
    const fileData = await fs.readFile(englishFile, {
      encoding: "utf-8",
    });
    let file = matter({
      content: fileData,
    });
    // No need to translate if opting out
    if (file.data?.localize === false) continue;
    // todo: reeanbled
    // const needsUpdating = await manageFileSha(file, englishFile);
    // console.log(`${englishFile} needs updating = ${needsUpdating}`);
    // if (!needsUpdating) {
    //   continue;
    // }
    console.log(`working on ${englishFile}`);
    for await (const targetLocale of localesJson) {
      if (targetLocale.code == "en") continue; //base lang
      if (!isDeepLSupported.has(targetLocale.code)) {
        console.log(
          `${targetLocale.name} code:${targetLocale.code} is not deepL supported`
        );
        continue;
      }
      const fileOutPath = englishFile.replace("/en/", `/${targetLocale.code}/`);
      const dir = path.dirname(fileOutPath);
      await fs.mkdir(dir, {recursive: true});
      let needsTranslating = true;
      try {
        needsTranslating = await checkIfTargetFileIsMarkedToNotTranslate(
          fileOutPath
        );
      } catch (error) {
        // noop:
        // console.log(error);
      }
      if (!needsTranslating) continue;

      const langCopy = {...file};
      const yamlContent = langCopy.data;
      const coercedLocaleCode = targetLocale.code as deepl.TargetLanguageCode;
      // Manage the yaml for the pages
      if (englishFile.includes("/pages/") && yamlContent.title) {
        const cacheSha = await getSha256(
          `${yamlContent.title}-${coercedLocaleCode}`
        );
        const cachedRow = findRowById(cacheSha);
        console.log({cachedRow});
        if (
          !cachedRow ||
          (typeof cachedRow === "object" && !("content" in cachedRow))
        ) {
          try {
            const translatedTitle = await translator.translateText(
              yamlContent.title,
              "en",
              coercedLocaleCode
            );
            if (!Array.isArray(translatedTitle)) {
              yamlContent.title = translatedTitle.text;
              writeRow({
                id: cacheSha,
                content: translatedTitle.text,
                lastUsed: new Date().toISOString(),
              });
            }
          } catch (e) {
            console.error(e);
          }
        }
      }
      // Manage the body:
      const tree = fromMarkdown(file.content, {
        extensions: [mdxjs()],
        mdastExtensions: [mdxFromMarkdown()],
      });

      const translationMap = new Map();

      // Step 1: Push all text nodes to an array and populate the translation map
      const textNodes: any[] = [];
      const promises: Array<Promise<any>> = [];
      if (!englishFile.includes("home")) continue;

      visit(tree, "text", (node) => {
        const promise = getSha256(`${node.value}-${coercedLocaleCode}`).then(
          (shaLangCode) => {
            console.log({shaLangCode});
            if (shaLangCode) {
              textNodes.push({node, shaLangCode});
              translationMap.set(shaLangCode, {node, translation: null});
            }
          }
        );
        promises.push(promise);
      });

      // Wait for all promises to resolve before continuing
      await Promise.all(promises);

      console.log({textNodes});
      // Step 2: Filter the array by checking for the presence of SHA256-langCode in the cache
      const nodesToTranslate = textNodes.filter(({shaLangCode}) => {
        const matchingRow = findRowById(shaLangCode);
        console.log({matchingRow});
        return matchingRow ? false : true;
      });
      // console.log({debug: nodesToTranslate[0].node});
      const onlyTextNodes = nodesToTranslate.map((node) => node.node.value);
      console.log({onlyTextNodes});
      // Step 3: Run DeepL translate on the batch
      let translations: deepl.TextResult[] | null = null;
      try {
        translations = await translator.translateText(
          onlyTextNodes,
          "en",
          coercedLocaleCode
        );
      } catch (error) {
        console.error(error);
      }
      if (translations) {
        // Step 4: Update the translation map with the translations
        translations.forEach((result, index) => {
          const {shaLangCode} = nodesToTranslate[index];
          const {node} = translationMap.get(shaLangCode);
          console.log({tmNode: node});
          console.log({result});
          translationMap.set(shaLangCode, {node, translation: result.text});
        });
      }

      // Step 5: Reinsert the original nodes and their translations back into the tree
      translationMap.forEach((value, key, map) => {
        if (value.translation !== null) {
          console.log({key, value});
          // Update the original text node with the translation
          value.node.value = value.translation;
          writeRow({
            id: key,
            content: value.translation,
            lastUsed: new Date().toISOString(),
          });
        }
      });
      const out = toMarkdown(tree, {extensions: [mdxToMarkdown()]});
      const finishedTranslation = matter.stringify({content: out}, yamlContent);
      await fs.writeFile(fileOutPath, finishedTranslation);
      // todo afternon: test if changing one line
      // some guardrails for if not texts to send to deepL
      // Json version for header
      // ? see if I can Map A links using props with Astro actually for that processing on build time
    }
  }
}
run();

async function manageFileSha(
  file: matter.GrayMatterFile<string>,
  filePath: string
) {
  let needsUpdating = false;
  const currentSha256 = createHash("sha256")
    .update(file.content, "utf-8")
    .digest("hex");
  if (file.data?.sha256 == currentSha256) {
    console.log(
      `checksum for ${filePath} not changed since last build: continue`
    );
    return needsUpdating;
  } else {
    file.data.sha256 = currentSha256;
    const withChecksum = matter.stringify({content: file.content}, file.data);
    needsUpdating = true;
    await fs.writeFile(filePath, withChecksum);
    return needsUpdating;
  }
}
async function checkIfTargetFileIsMarkedToNotTranslate(fileOutPath: string) {
  let needsTranslating = true;
  try {
    let existingTargetFile = await fs.readFile(fileOutPath, {
      encoding: "utf-8",
    });
    let fileWithData = matter({
      content: existingTargetFile,
    });
    // intentional. Strictly false in yaml, not just falsy
    // todo: this needs testing;
    if (fileWithData.data?.localize === false) {
      needsTranslating = false;
      return needsTranslating;
    } else return needsTranslating;
  } catch (error) {
    return needsTranslating;
  }
}
async function getSha256(str: string) {
  const sha = createHash("sha256").update(str, "utf-8").digest("hex");
  return sha;
}
// export async function walk(dir: string = "./src/content"): Promise<string[]> {
//   let files: any[] = await readdir(dir);
//   files = await Promise.all(
//     files.map(async (file: string) => {
//       const filePath: string = path.join(dir, file);
//       const stats = await stat(filePath);
//       if (stats.isDirectory()) return walk(filePath);
//       else if (stats.isFile()) return filePath;
//     })
//   );

//   return files.reduce((all, folderContents) => all.concat(folderContents), []);
// }
