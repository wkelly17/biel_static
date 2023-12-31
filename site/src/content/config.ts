// Import utilities from `astro:content`
import {z, defineCollection} from "astro:content";
// Define a `type` and `schema` for each collection
const pagesCollection = defineCollection({
  type: "content",
  schema: z.object({
    title: z.string(),
    sha256: z.string().optional(),
    draft: z.boolean().optional(),
    localize: z.boolean().optional(),
  }),
});
const singletonCollection = defineCollection({
  type: "content",
  schema: z.object({
    name: z.string(),
  }),
});

const menuSchema = z.object({
  name: z.string(),
  linksSha256: z.string().optional(),
  links: z.array(
    z.object({
      url: z.string(),
      label: z.string(),
    })
  ),
});

export type MenuSchemaType = z.infer<typeof menuSchema>;

const menuCollection = defineCollection({
  type: "data",
  schema: menuSchema,
});
// Export a single `collections` object to register your collection(s)
export const collections = {
  pages: pagesCollection,
  singletons: singletonCollection,
  menus: menuCollection,
};
