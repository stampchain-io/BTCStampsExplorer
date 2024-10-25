import { xcp_public_nodes, xcp_v2_nodes } from "../services/xcpService.ts";
import { XCPParams } from "globals";
import { dbManager } from "$server/database/db.ts";

export interface XCPPayload {
  jsonrpc: string;
  id: number;
  method: string;
  params: XCPParams;
}

/**
 * Creates a payload object for JSON-RPC requests.
 * @param method - The method name.
 * @param params - The parameters for the method.
 * @returns The payload object.
 */
export const CreatePayload = (
  method: string,
  params: XCPParams,
): XCPPayload => {
  return {
    jsonrpc: "2.0",
    id: 0,
    method,
    params,
  };
};

export async function handleXcpApiRequestWithCache(
  method: string,
  params: XCPParams,
  cacheDuration: number | "never",
) {
  const cacheKey = `api:${method}:${JSON.stringify(params)}`;

  return await dbManager.handleCache(
    cacheKey,
    async () => {
      const payload = CreatePayload(method, params);
      return await handleXcpV1Query(payload);
    },
    cacheDuration,
  );
}

/**
 * Makes a query to the specified URL with retries in case of failure.
 * @param url - The URL to make the query to.
 * @param auth - The authentication string.
 * @param payload - The payload to send with the query.
 * @param retries - The number of retries to attempt (default is 0).
 * @returns The result of the query or null if all retries failed.
 */
const handleXcpQueryWIthRetries = async (
  url: string,
  auth: string,
  payload: XCPPayload,
  retries = 0,
): Promise<any> => {
  try {
    console.log(`Sending request to ${url}, attempt ${retries + 1}`);
    const response = await fetch(url, {
      method: "POST",
      body: JSON.stringify(payload),
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Basic " + auth,
      },
    });
    console.log(`Response status: ${response.status}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const json = await response.json();
    console.log("Response JSON:", json);
    if (json.error) {
      // If it's an API error, return it instead of throwing
      return json.error;
    }
    return json.result;
  } catch (err) {
    console.error(`Error in attempt ${retries + 1}:`, err);
    if (retries < 3) {
      console.log(`Retrying... (${retries + 1}/3)`);
      return await handleXcpQueryWIthRetries(url, auth, payload, retries + 1);
    } else {
      console.error("Max retries reached. Giving up.");
      throw err;
    }
  }
};

/**
 * Handles the query by sending it to multiple public nodes and returning the result from the first successful query.
 * If all queries fail, it logs an error message and returns null.
 * @param payload - The query payload to be sent to the nodes.
 * @returns The result of the successful query or null if all queries fail.
 */
export const handleXcpV1Query = async (payload: XCPPayload): Promise<any> => {
  console.log("Starting handleXcpV1Query with payload:", payload);

  for (const node of xcp_public_nodes) {
    try {
      console.log(`Attempting query to node: ${node.url}`);
      const auth = btoa(`${node.user}:${node.password}`);
      const result = await handleXcpQueryWIthRetries(
        node.url,
        auth,
        payload,
        0,
      );

      // If we get a result (even if it's an error), return it
      if (result !== null) {
        console.log(`Response from node ${node.url}:`, result);
        return result;
      }
    } catch (error) {
      console.error(`Error querying node ${node.url}:`, error);

      // If it's not a connection error, throw the error
      if (
        !(error instanceof TypeError && error.message.includes("connection"))
      ) {
        throw error;
      }
      // If it is a connection error, we'll try the next node
    }
  }

  // If we've tried all nodes and none worked
  throw new Error("All queries to nodes have failed due to connection issues.");
};
