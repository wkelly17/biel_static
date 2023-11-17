import {fromMarkdown} from "mdast-util-from-markdown";
import {mdxFromMarkdown} from "mdast-util-mdx";
import {mdxjs} from "micromark-extension-mdxjs";
import {readFileSync} from "node:fs";
import {Cache} from "./cache/index.js";
import {visit} from "unist-util-visit";

// Receive a diff
// Process diff
// Take raw old sections and get just the text from them and same for new
// Find the corresponding row in the cache based on old content
// Update it to use "manual translation" column
//
export function manageDiff(diff: string, translationsCache: Cache) {
  const splitByFile = diff.split(/^diff --git /gm);
  const contentChanges = splitByFile.filter((chunk) => {
    return chunk.includes("site/src/content");
  });
  let meetsCriteria = getDiffsThatMeetCriteria(contentChanges);
  if (!meetsCriteria) return;
  meetsCriteria.forEach((pair) => {
    const beforeTree = fromMarkdown(pair.removal, {
      extensions: [mdxjs()],
      mdastExtensions: [mdxFromMarkdown()],
    });
    let oldText = "";
    visit(beforeTree, "text", (node) => {
      oldText = node.value;
    });
    let newText = "";
    const afterTree = fromMarkdown(pair.addition, {
      extensions: [mdxjs()],
      mdastExtensions: [mdxFromMarkdown()],
    });
    visit(afterTree, "text", (node) => {
      newText = node.value;
    });
    console.log({oldText, newText});
    const matchingOldRowAuto = translationsCache.findByContent(oldText);
    console.log({matchingOldRow: matchingOldRowAuto});
    const matchingOldRowFromManual =
      translationsCache.findByManualContent(newText);
    let matching = matchingOldRowAuto || matchingOldRowFromManual;
    if (matching) {
      const casted = matching as {
        id: string;
        content: string;
        last_used: string;
        manual_translation: string;
      };
      const result = translationsCache.updateManualTranslationCol({
        rowId: casted.id,
        lastUsed: new Date().toISOString(),
        manualContent: newText,
      });
      if (result) {
        console.log(`updated cache with ${result.lastInsertRowid}`);
      }
    }
  });
}

function getDiffsThatMeetCriteria(contentChanges: string[]) {
  let meetsCriteria = null;

  contentChanges.forEach((change) => {
    const fileNameSplitter = /--- .+\n\+\+\+ .+/;
    const fileAndChange = change.split(fileNameSplitter);
    // const changesInChunk = change.split(/\n(?=@@)/);
    const fileInfo = fileAndChange[0];

    const linesChanges = fileAndChange[1];
    const wasContentChange = fileInfo.includes("site/src/content");
    if (wasContentChange) {
      let fileName = fileInfo.match(/(site\/src\/content\/[^ ]+)/);
      if (fileName && fileName.length) {
        let actualFileName = fileName[0];
        const changePairs = linesChanges
          .split(/\n(?=@@)/)
          .filter((line) => line != "");

        const changedSections = changePairs
          .map((pair) => pair.split("/n"))
          .flat();
        meetsCriteria = changedSections
          .filter((section) => {
            const lines = section.split("\n");
            if (
              lines.length >= 3 &&
              lines[1].startsWith("-") &&
              lines[2].startsWith("+")
            ) {
              return true;
            } else return false;
          })
          .map((changedSection) => {
            const lines = changedSection.split("\n");

            const removal = lines[1].replace(/^-+ */, "");
            const addition = lines[2].replace(/^\++ */, "");
            return {removal, addition};
          });
      }
    }
  });
  return meetsCriteria as Array<{removal: string; addition: string}> | null;
}
