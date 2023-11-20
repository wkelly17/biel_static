import {mdxjs} from "micromark-extension-mdxjs";
import {fromMarkdown} from "mdast-util-from-markdown";
import {mdxFromMarkdown, mdxToMarkdown} from "mdast-util-mdx";
import {toMarkdown} from "mdast-util-to-markdown";
import {visit} from "unist-util-visit";

export function internationalizeInternalLinks(
  page: {
    body: string;
  },
  locale: string
) {
  return;
  const content = page.body;
  let fullyQualifiedLinkStarts = ["#", "http", "file"];
  const tree = fromMarkdown(content, {
    extensions: [mdxjs({})],
    mdastExtensions: [mdxFromMarkdown()],
  });
  console.log("hhereer");
  console.log(tree);
  visit(tree, "link", (node, index, parent) => {
    console.log("lkjlkj;");
    console.log(node.url);
    if (
      !fullyQualifiedLinkStarts.some((fq) => node.url.startsWith(fq)) ||
      !node.url.includes(`/${locale}/`)
    ) {
      if (node.url.startsWith("/")) {
        node.url = `/${locale}/${node.url.slice(1)}`;
      } else {
        node.url = `/${locale}/${node.url}`;
      }
    }
  });
  const out = toMarkdown(tree, {extensions: [mdxToMarkdown()]});
  page.body = out;
}
