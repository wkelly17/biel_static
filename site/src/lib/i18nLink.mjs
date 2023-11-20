import {visit} from "unist-util-visit";

export function handleI18nInternalLinks() {
  return function (tree, file) {
    const currentFileName = file.history[0];
    const filePath = currentFileName.split("src/content/")[1];
    const inContentFolderPathSplit = filePath.split("/");
    const locale = inContentFolderPathSplit[1];
    let fullyQualifiedLinkStarts = ["#", "http", "file"];
    visit(tree, "link", (node, index, parent) => {
      if (
        !fullyQualifiedLinkStarts.some((fq) => node.url.startsWith(fq)) &&
        !node.url.includes(`/${locale}/`)
      ) {
        if (node.url.startsWith("/")) {
          node.url = `/${locale}/${node.url.slice(1)}`;
        } else {
          node.url = `/${locale}/${node.url}`;
        }
      }
    });
  };
}
