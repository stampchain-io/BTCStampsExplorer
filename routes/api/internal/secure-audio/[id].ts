import { Handlers } from "$fresh/server.ts";
import { SecurityService } from "$server/services/security/securityService.ts";
import { join } from "@std/path";

export const handler: Handlers = {
  async GET(req, ctx) {
    const csrfToken = req.headers.get("x-csrf-token");
    if (!csrfToken || !SecurityService.validateCSRFToken(csrfToken)) {
      return new Response("Invalid CSRF token", { status: 403 });
    }

    const id = ctx.params.id;

    // For development, we'll serve static files from a music directory
    try {
      const audioPath = join(Deno.cwd(), "static", "music", `${id}.mp3`);
      const file = await Deno.readFile(audioPath);

      return new Response(file, {
        headers: {
          "Content-Type": "audio/mpeg",
          "Content-Length": file.length.toString(),
        },
      });
    } catch (error) {
      console.error("Error serving audio file:", error);
      return new Response("Audio file not found", { status: 404 });
    }
  },
};
