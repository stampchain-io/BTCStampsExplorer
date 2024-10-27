// lib/utils/xcpUtils.ts

// TODO: move to server for xcp related functions

import { xcp_public_nodes } from "$server/services/xcpService.ts";
import { XCPParams } from "globals";
import { dbManager } from "$server/database/index.ts";

export interface XCPPayload {
  jsonrpc: string;
  id: number;
  method: string;
  params: XCPParams;
}

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

      if (result !== null) {
        console.log(`Response from node ${node.url}:`, result);
        return result;
      }
    } catch (error) {
      console.error(`Error querying node ${node.url}:`, error);

      if (
        !(error instanceof TypeError && error.message.includes("connection"))
      ) {
        throw error;
      }
    }
  }

  throw new Error("All queries to nodes have failed due to connection issues.");
};
