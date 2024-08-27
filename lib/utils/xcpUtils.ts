import { xcp_public_nodes, xcp_v2_nodes } from "../services/xcpService.ts";
import { XCPParams } from "globals";
import { dbManager } from "$lib/database/db.ts";

/**
 * Creates a payload object for JSON-RPC requests.
 * @param method - The method name.
 * @param params - The parameters for the method.
 * @returns The payload object.
 */
export const CreatePayload = (method: string, params: XCPParams) => {
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
  payload: any,
  retries = 0,
): Promise<any | null> => {
  try {
    const response = await fetch(url, {
      method: "POST",
      body: JSON.stringify(payload),
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Basic " + auth,
      },
    });
    const json = await response.json();
    return json.result;
  } catch (err) {
    if (retries < 3) {
      return await handleXcpQueryWIthRetries(url, auth, payload, retries + 1);
    } else {
      console.error(err);
      return null;
    }
  }
};

/**
 * Handles the query by sending it to multiple public nodes and returning the result from the first successful query.
 * If all queries fail, it logs an error message and returns null.
 * @param payload - The query payload to be sent to the nodes.
 * @returns The result of the successful query or null if all queries fail.
 */
export const handleXcpV1Query = async (payload: any) => {
  for (const node of xcp_public_nodes) {
    const auth = btoa(`${node.user}:${node.password}`);
    const result = await handleXcpQueryWIthRetries(node.url, auth, payload, 0);
    if (result !== null) {
      return result;
    }
  }
  console.error("Todas las consultas a los nodos han fallado.");
  return null;
};
