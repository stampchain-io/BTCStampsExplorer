// 🚧 TEMPORARY TEST ROUTE - Remove after Horizon Wallet API discovery is complete
import { Handlers } from "$fresh/server.ts";

export const handler: Handlers = {
  GET(_req, ctx) {
    return ctx.render();
  },
};

export default function HorizonDiscoveryPage() {
  return (
    <div
      style={{
        padding: "20px",
        maxWidth: "800px",
        margin: "0 auto",
        fontFamily: "monospace",
        backgroundColor: "#1a1a1a",
        color: "#00ff00",
        minHeight: "100vh",
      }}
    >
      <div
        style={{
          background: "#ff4444",
          color: "white",
          padding: "15px",
          borderRadius: "8px",
          marginBottom: "20px",
          border: "2px solid #ff6666",
        }}
      >
        ⚠️ <strong>TEMPORARY TEST ROUTE</strong>{" "}
        - This route is for Horizon Wallet API discovery only. Remove after
        integration analysis is complete.
      </div>

      <h1>🔍 Horizon Wallet Discovery Test</h1>

      <p>
        This is a temporary test route to help discover the Horizon Wallet API
        structure.
      </p>

      <div
        style={{
          background: "#2a2a2a",
          padding: "20px",
          borderRadius: "8px",
          margin: "20px 0",
          border: "1px solid #444",
        }}
      >
        <h2>Instructions:</h2>
        <ol>
          <li>Make sure Horizon Wallet extension is installed and active</li>
          <li>
            Open the standalone test page:{" "}
            <a href="/test/horizon.html" style={{ color: "#00aaff" }}>
              horizon-discovery.html
            </a>
          </li>
          <li>Use the discovery tools to analyze the wallet API</li>
          <li>Document findings for integration development</li>
        </ol>
      </div>

      <div
        style={{
          background: "#2a2a2a",
          padding: "20px",
          borderRadius: "8px",
          margin: "20px 0",
          border: "1px solid #444",
        }}
      >
        <h2>What to Look For:</h2>
        <ul>
          <li>
            <strong>Window Object:</strong>{" "}
            What global object does Horizon inject?
          </li>
          <li>
            <strong>Connection Methods:</strong>{" "}
            How do we connect to the wallet?
          </li>
          <li>
            <strong>Account Access:</strong> How do we get user addresses?
          </li>
          <li>
            <strong>Balance Queries:</strong> How do we fetch BTC balances?
          </li>
          <li>
            <strong>Transaction Signing:</strong>{" "}
            What's the PSBT signing interface?
          </li>
          <li>
            <strong>Network Support:</strong> What networks are supported?
          </li>
        </ul>
      </div>

      <div
        style={{
          background: "#004400",
          padding: "15px",
          borderRadius: "8px",
          margin: "20px 0",
          border: "1px solid #008800",
        }}
      >
        <strong>Next Steps:</strong>{" "}
        Once API structure is discovered, we'll implement the integration
        following the same patterns as UniSat, Leather, and other existing
        wallet integrations.
      </div>

      <p>
        <a
          href="/test/horizon.html"
          style={{
            background: "#0066cc",
            color: "white",
            padding: "10px 20px",
            textDecoration: "none",
            borderRadius: "4px",
            display: "inline-block",
            marginTop: "20px",
          }}
        >
          🚀 Open Discovery Tool
        </a>
      </p>
    </div>
  );
}
