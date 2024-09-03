import { Handlers } from "$fresh/server.ts";
import { StampController } from "$lib/controller/stampController.ts";
import { verifySignature } from "$lib/utils/cryptoUtils.ts"; // Implement this function
import { validateCSRFToken } from "$lib/utils/securityUtils.ts"; // Implement this function

export const handler: Handlers = {
  async POST(req) {
    try {
      const body = await req.json();
      console.log("Full request body:", body);

      const { address, newName, signature, timestamp, csrfToken } = body;

      console.log("Received request:", {
        address,
        newName,
        signature,
        timestamp,
        csrfToken,
      });

      if (!address || !newName || !signature || !timestamp || !csrfToken) {
        console.log("Missing fields:", {
          address: !address,
          newName: !newName,
          signature: !signature,
          timestamp: !timestamp,
          csrfToken: !csrfToken,
        });
        return new Response("Missing required fields", { status: 400 });
      }

      // Verify CSRF token
      const isValidCSRF = await validateCSRFToken(csrfToken);
      console.log("CSRF token validation result:", isValidCSRF);
      if (!isValidCSRF) {
        return new Response("Invalid CSRF token", { status: 403 });
      }

      // Verify the signature
      const message = `Update creator name to ${newName} at ${timestamp}`;
      const isValidSignature = verifySignature(message, signature, address);
      console.log("Signature validation result:", isValidSignature);
      if (!isValidSignature) {
        return new Response("Invalid signature", { status: 403 });
      }

      // Check if the signature is recent (e.g., within the last 5 minutes)
      const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
      if (parseInt(timestamp) < fiveMinutesAgo) {
        console.log("Signature expired");
        return new Response("Signature expired", { status: 403 });
      }

      const updated = await StampController.updateCreatorName(address, newName);
      console.log("Update result:", updated);
      if (updated) {
        return new Response(
          JSON.stringify({ success: true, creatorName: newName }),
          {
            headers: { "Content-Type": "application/json" },
          },
        );
      } else {
        return new Response(
          JSON.stringify({
            success: false,
            message: "Failed to update creator name",
          }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          },
        );
      }
    } catch (error) {
      console.error("Error in update-creator-name handler:", error);
      return new Response(
        JSON.stringify({
          error: "Internal Server Error",
          details: error.message,
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        },
      );
    }
  },
};
