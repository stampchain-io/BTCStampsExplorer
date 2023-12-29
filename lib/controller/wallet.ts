import {
    connectDb,
    get_stamp_balances_by_address_with_client,
    get_src20_balance_by_address_with_client
} from "$lib/database/index.ts";

import { getBtcAddressInfo } from "utils/btc.ts";


export const api_get_stamp_balance = async (address: string) => {
    try {
        const client = await connectDb();
        const balances = await get_stamp_balances_by_address_with_client(client, address);
        await client.close();
        return balances;
    } catch (error) {
        console.error(error);
        throw error;
    }
}

export const api_get_src20_balance = async (address: string) => {
    try {
        const client = await connectDb();
        const balances = await get_src20_balance_by_address_with_client(client, address);
        await client.close();
        return balances.rows;
    } catch (error) {
        console.error(error);
        throw error;
    }
}

export const api_get_balance = async (address: string) => {
    try {
        const client = await connectDb();
        const btcInfo = await getBtcAddressInfo(address);
        const stamps = await get_stamp_balances_by_address_with_client(client, address);
        const src20 = await get_src20_balance_by_address_with_client(client, address);
        await client.close();
        return {
            stamps,
            src20: src20.rows,
            btc: btcInfo
        };
    } catch (error) {
        console.error(error);
        throw error;
    }
}
