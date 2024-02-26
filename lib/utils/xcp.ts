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

const create_payload = (method: string, params: XCPParams) => {
  return {
    jsonrpc: "2.0",
    id: 0,
    method,
    params,
  };
};

const handleQueryWithRetries = async (
  url: string,
  auth: string,
  payload: any,
  retries: number = 0,
) => {
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

export const get_stamps_balance = async (address: string) => {
  //TODO: filter xcp balances and add populated info with stamptable data
  return await get_balances(address);
};

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
  const dispensers = await handleQuery(payload);
  if (!dispensers) {
    return [];
  }
  return dispensers
    .filter((dispenser: any) => dispenser.give_remaining > 0)
    .map((dispenser: any) => ({
      tx_hash: dispenser.tx_hash,
      block_index: dispenser.block_index,
      source: dispenser.source,
      cpid: dispenser.asset,
      give_quantity: dispenser.give_quantity,
      escrow_quantity: dispenser.escrow_quantity,
      satoshirate: dispenser.satoshirate,
      origin: dispenser.origin,
    }));
};
