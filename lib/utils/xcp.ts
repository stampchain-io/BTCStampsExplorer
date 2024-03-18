const public_nodes = [
  {
    name: "stampchain.io",
    url:
      "https://k6e0ufzq8h.execute-api.us-east-1.amazonaws.com/beta/counterpartyproxy",
    user: "rpc",
    password: "rpc",
  },
  {
    name: "xcp.dev",
    url: "https://api.xcp.dev/0/v9_61",
    user: "rpc",
    password: "rpc",
  },
  {
    name: "counterparty.io",
    url: "http://api.counterparty.io:4000/",
    user: "rpc",
    password: "rpc",
  },
  {
    name: "coindaddy",
    url: "https://public.coindaddy.io:4001/api/rest",
    user: "rpc",
    password: "1234",
  },
];

/**
 * Creates a payload object for JSON-RPC requests.
 * @param method - The method name.
 * @param params - The parameters for the method.
 * @returns The payload object.
 */
const create_payload = (method: string, params: XCPParams) => {
  return {
    jsonrpc: "2.0",
    id: 0,
    method,
    params,
  };
};

/**
 * Makes a query to the specified URL with retries in case of failure.
 * @param url - The URL to make the query to.
 * @param auth - The authentication string.
 * @param payload - The payload to send with the query.
 * @param retries - The number of retries to attempt (default is 0).
 * @returns The result of the query or null if all retries failed.
 */
const handleQueryWithRetries = async (
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
      return await handleQueryWithRetries(url, payload, retries + 1);
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
export const handleQuery = async (payload: any) => {
  for (const node of public_nodes) {
    const auth = btoa(`${node.user}:${node.password}`);
    const result = await handleQueryWithRetries(node.url, auth, payload, 0);
    if (result !== null) {
      return result;
    }
  }
  console.error("Todas las consultas a los nodos han fallado.");
  return null;
};

/**
 * Retrieves the balances for a given address.
 * @param address - The address for which to retrieve the balances.
 * @returns An array of balances, each containing the asset ID, quantity, and divisibility.
 */
export const get_balances = async (address: string) => {
  const params = {
    filters: [
      {
        field: "address",
        op: "==",
        value: address,
      },
    ],
  };
  const payload = create_payload("get_balances", params);
  const balances = await handleQuery(payload);
  if (!balances) {
    return [];
  }
  return balances
    .filter((balance: any) => balance.quantity > 0)
    .map((balance: any) => ({
      cpid: balance.asset,
      quantity: balance.quantity,
      divisible: balance.divisible,
    }));
};

/**
 * Retrieves the stamps balance for a given address.
 * @param address - The address for which to retrieve the stamps balance.
 * @returns A promise that resolves to the stamps balance.
 */
export const get_stamps_balance = async (address: string) => {
  //TODO: filter xcp balances and add populated info with stamptable data
  return await get_balances(address);
};

/**
 * Retrieves a list of sends for a given cpid.
 * @param cpid - The cpid to filter sends by.
 * @returns An array of sends, each containing transaction hash, block index, source, destination, quantity, and asset.
 */
export const get_sends = async (cpid: string) => {
  const params = {
    filters: [
      {
        field: "asset",
        op: "==",
        value: cpid,
      },
      {
        field: "status",
        op: "==",
        value: "valid",
      },
    ],
    "filterop": "AND",
  };
  const payload = create_payload("get_sends", params);
  const sends = await handleQuery(payload);

  if (!sends) {
    console.log("no sends found");
    return [];
  }
  return sends.map((send: any) => ({
    tx_hash: send.tx_hash,
    block_index: send.block_index,
    source: send.source,
    destination: send.destination,
    quantity: send.quantity,
    asset: send.asset,
  }));
};

/**
 * Retrieves the holders of a specific asset.
 *
 * @param cpid - The asset identifier.
 * @returns An array of holders with a positive quantity of the specified asset.
 */
export const get_holders = async (cpid: string) => {
  const params = {
    filters: [
      {
        field: "asset",
        op: "==",
        value: cpid,
      },
    ],
  };
  const payload = create_payload("get_balances", params);
  const holders = await handleQuery(payload);
  if (!holders) {
    return [];
  }
  return holders.filter(
    (holder: any) => {
      if (holder.quantity > 0) {
        return true;
      }
    },
  );
};

/**
 * Retrieves the dispensers for a given asset.
 * @param cpid - The asset identifier.
 * @returns An array of mapped dispensers.
 */
export const get_dispensers = async (cpid: string) => {
  const params = {
    filters: [
      {
        field: "asset",
        op: "==",
        value: cpid,
      },
    ],
  };
  const payload = create_payload("get_dispensers", params);
  console.log("Dispenser Payload:", payload);

  const dispensers = await handleQuery(payload);
  console.log("Dispenser Response:", dispensers);

  if (!dispensers) {
    console.log("No dispensers found");
    return [];
  }

  const filteredDispensers = dispensers.filter((dispenser: string) =>
    dispenser.give_remaining > 0
  );

  const mappedDispensers = filteredDispensers.map((dispenser: any) => ({
    tx_hash: dispenser.tx_hash,
    block_index: dispenser.block_index,
    source: dispenser.source,
    cpid: dispenser.asset,
    give_quantity: dispenser.give_quantity,
    give_remaining: dispenser.give_remaining,
    escrow_quantity: dispenser.escrow_quantity,
    satoshirate: dispenser.satoshirate,
    btcrate: dispenser.satoshirate / 100000000,
    origin: dispenser.origin,
  }));

  return mappedDispensers;
};

/**
 * Retrieves all dispensers with remaining give quantity.
 * @returns An object containing the total number of dispensers and an array of mapped dispensers.
 */
export const get_all_dispensers = async () => {
  const payload = create_payload("get_dispensers", {});
  console.log("Payload:", payload);

  const dispensers = await handleQuery(payload);
  console.log("Response:", dispensers);

  if (!dispensers) {
    console.log("No dispensers found");
    return [];
  }

  const filteredDispensers = dispensers.filter((dispenser: any) =>
    dispenser.give_remaining > 0
  );

  const mappedDispensers = filteredDispensers.map((dispenser: any) => ({
    tx_hash: dispenser.tx_hash,
    block_index: dispenser.block_index,
    source: dispenser.source,
    cpid: dispenser.asset,
    give_quantity: dispenser.give_quantity,
    escrow_quantity: dispenser.escrow_quantity,
    satoshirate: dispenser.satoshirate,
    origin: dispenser.origin,
  }));

  const total = filteredDispensers.length;

  return { total, mappedDispensers };
};

/**
 * Retrieves dispenses for a given cpid.
 * @param cpid - The asset identifier.
 * @returns An array of dispenses.
 */
export const get_dispenses = async (cpid: string) => {
  const params = {
    filters: [
      {
        field: "asset",
        op: "==",
        value: cpid,
      },
    ],
  };
  const payload = create_payload("get_dispenses", params);
  const dispenses = await handleQuery(payload);
  if (!dispenses) {
    return [];
  }
  return dispenses.map((dispense: any) => ({
    tx_hash: dispense.tx_hash,
    block_index: dispense.block_index,
    cpid: dispense.asset,
    source: dispense.source,
    destination: dispense.destination,
    dispenser_tx_hash: dispense.dispenser_tx_hash,
    dispense_quantity: dispense.dispense_quantity,
    // need to query the tx_hash to get the amount?
  }));
};
