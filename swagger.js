// Importing necessary modules from Deno standard library
import { walk } from "https://deno.land/std/fs/mod.ts";
import { stringify } from "https://deno.land/std@0.179.0/encoding/yaml.ts";

// to run this file, use the following command
// deno run --allow-read --allow-write swagger.js

async function extractJsdocComments(filePath) {
  const content = await Deno.readTextFile(filePath);
  const comments = [...content.matchAll(/\/\*\*([\s\S]*?)\*\//g)].map(match => {
      // Remove '@swagger', then remove '*' and add indentation to each line
      return match[1]
          .replace(/@swagger/g, '')
          .replace(/\n\s*\*/g, '\n')
          .split('\n')
          .map(line => '  ' + line)  // Adding two spaces for indentation
          .join('\n')

  });
  return comments;
}

async function processYamlFile(filePath) {
  // Read the content of the YAML file
  let content = await Deno.readTextFile(filePath);

  // Split the content into lines for processing
  let lines = content.split('\n');

  // Process each line
  let processedLines = lines.map((line, index) => {
    if (index < 11) {
      return line;
  }
      // Remove lines with "type: null"
      if (line.trim().includes('type: null')) {
          return null;  // This line will be removed later
      }

      // Wrap descriptions in single quotes
      if (line.trim().startsWith('description:')) {
          const descriptionContent = line.trim().substring('description:'.length).trim();
          return `           description: '${descriptionContent}'`;
      }

      return line; // Return the line unchanged if none of the above conditions are met
  }).filter(line => line !== null);  // Remove the lines marked as null

  // Join the processed lines back into a single string
  let processedContent = processedLines.join('\n');

  // Write the processed content back to the file
  await Deno.writeTextFile(filePath, processedContent);
}



async function main() {
    const routesDir = "./routes/api/v2"; // Update this with your actual routes directory path
    const schemaFile = "./schema.yml"; // Update this with your actual schema file path
    let jsdocYaml = "";

    // OpenAPI specification details
    const openApiSpec = {
        openapi: "3.0.3",
        info: {
            title: "Stampchain - OpenAPI 3.0",
            description: "Stampchain API UI",
            version: "2.0.0"
        },
        externalDocs: {
            description: "Find out more about Stampchain",
            url: "http://stampchain.io"
        },
        servers: [
            { url: "https://stampchain.io/api/v3" }  // or localhost if in dev
        ]
    };

    // Convert OpenAPI spec to YAML
    const openApiYaml = stringify(openApiSpec);

    // Traverse the routes directory recursively
    for await (const entry of walk(routesDir, { includeDirs: false, exts: [".ts"] })) {
        const comments = await extractJsdocComments(entry.path);
        comments.forEach(comment => {
            // Convert comment to YAML and append
            // Assuming comments are already in a YAML-like format
            jsdocYaml += comment + "\n";
        });
    }

    // Read the schema.yml content
    const schemaYaml = await Deno.readTextFile(schemaFile);

    // Combine OpenAPI YAML with JSDoc YAML and schema YAML
    const combinedYaml = openApiYaml + "paths:\n"+ jsdocYaml + "\n" + schemaYaml;

    // Write the combined content to a new file
    await Deno.writeTextFile("openapi.yml", combinedYaml);

    await processYamlFile("openapi.yml");
}

main();
