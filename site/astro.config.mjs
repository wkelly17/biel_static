import {defineConfig} from "astro/config";
import cloudflare from "@astrojs/cloudflare";
import mdx from "@astrojs/mdx";
import UnoCSS from "unocss/astro";
import svelte from "@astrojs/svelte";
import {handleI18nInternalLinks} from "./src/lib/i18nLink.mjs";
// https://astro.build/config
export default defineConfig({
  output: "server",
  adapter: cloudflare(),
  integrations: [
    mdx({
      remarkPlugins: [handleI18nInternalLinks],
    }),
    svelte(),
    UnoCSS(),
  ],
});
