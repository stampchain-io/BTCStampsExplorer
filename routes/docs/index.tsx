import { Handlers } from "$fresh/server.ts";

export const handler: Handlers = {
  GET(_req: Request, _ctx) {
    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Swagger UI</title>
  <link rel="stylesheet" type="text/css" href="https://unpkg.com/swagger-ui-dist@4.5.0/swagger-ui.css">
  <style>
    body {
      margin: 0;
      padding: 0;
    }
  </style>
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@4.5.0/swagger-ui-bundle.js"></script>
  <script src="https://unpkg.com/swagger-ui-dist@4.5.0/swagger-ui-standalone-preset.js"></script>
  <script>
    globalThis.onload = function() {
      // Begin Swagger UI call region
      const ui = SwaggerUIBundle({
        url: "swagger/openapi.yml", // Path to your OpenAPI YAML file
        dom_id: '#swagger-ui',
        deepLinking: true,
        presets: [
          SwaggerUIBundle.presets.apis,
          SwaggerUIStandalonePreset
        ],
        plugins: [
          SwaggerUIBundle.plugins.DownloadUrl
        ],
        layout: "StandaloneLayout"
      })
      // End Swagger UI call region
    }
  </script>
</body>
</html>
    `;

    return new Response(htmlContent, {
      headers: { "content-type": "text/html; charset=UTF-8" },
    });
  },
};
