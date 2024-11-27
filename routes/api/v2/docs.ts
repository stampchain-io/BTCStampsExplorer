import { Handlers } from "$fresh/server.ts";
import { ResponseUtil } from "$lib/utils/responseUtil.ts";
import { parse as parseYaml } from "@std/yaml";
import { fromFileUrl, join } from "@std/path";

const __dirname = fromFileUrl(new URL(".", import.meta.url));
const schemaPath = join(__dirname, "../../../schema.yml");
const schemaContent = await Deno.readTextFile(schemaPath);
const openApiSchema = parseYaml(schemaContent) as Record<string, unknown>;

export const handler: Handlers = {
  GET() {
    return ResponseUtil.success({
      openapi: openApiSchema.openapi,
      info: openApiSchema.info,
      paths: openApiSchema.paths,
      components: openApiSchema.components,
      tags: openApiSchema.tags,
      servers: openApiSchema.servers,
      externalDocs: openApiSchema.externalDocs,
    });
  },
};
