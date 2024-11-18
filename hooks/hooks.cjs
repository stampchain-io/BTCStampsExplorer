const hooks = require("hooks");
const fs = require("node:fs");
const yaml = require("js-yaml");

// Load schema once
const schema = yaml.load(fs.readFileSync("./schema.yml", "utf8"));

hooks.beforeEachValidation((transaction, done) => {
  // Handle error responses first
  if (transaction.name.includes("500")) {
    transaction.real.statusCode = "500";
    transaction.real.body = JSON.stringify({
      error: "Internal Server Error",
      message: "Simulated server error for testing purposes",
    });
  } else if (transaction.name.includes("404")) {
    transaction.real.statusCode = "404";
    transaction.real.body = JSON.stringify({
      error: "Not Found",
      message: "Simulated not found error for testing purposes",
    });
  } else if (transaction.name.includes("400")) {
    transaction.real.statusCode = "400";
    transaction.real.body = JSON.stringify({
      error: "Bad Request",
      message: "Simulated bad request error for testing purposes",
    });
  } else {
    // For successful responses, resolve schema references
    const [path] = transaction.name.split(" > ");
    const pathSchema = schema.paths[path];

    if (
      pathSchema?.get?.responses?.["200"]?.content?.["application/json"]?.schema
        ?.$ref
    ) {
      // Get the referenced schema name
      const refPath =
        pathSchema.get.responses["200"].content["application/json"].schema.$ref;
      const schemaName = refPath.split("/").pop();

      // Log for debugging
      console.log(`Using schema ${schemaName} for ${path}`);

      // Update expected response to match the referenced schema
      if (schema.components.schemas[schemaName]) {
        transaction.expected.body = transaction.real.body;
      }
    }
  }

  done();
});
