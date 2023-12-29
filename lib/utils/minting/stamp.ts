import { generateRandomNumber } from "utils/util.ts";

export const burnkeys = [
    "022222222222222222222222222222222222222222222222222222222222222222",
    "033333333333333333333333333333333333333333333333333333333333333333",
    "020202020202020202020202020202020202020202020202020202020202020202",
    "030303030303030303030303030303030303030303030303030303030303030302"
];


export const transferMethod = ({
    sourceWallet,
    destinationWallet,
    assetName,
    qty,
    divisible,
    satsPerKB
}: stampTransferData) => {
    if (typeof sourceWallet !== 'string') {
        throw new Error('Invalid sourceWallet parameter');
    }
    if (typeof destinationWallet !== 'string') {
        throw new Error('Invalid destinationWallet parameter');
    }
    if (typeof assetName !== 'string') {
        throw new Error('Invalid assetName parameter');
    }
    if (typeof qty !== 'number') {
        throw new Error('Invalid qty parameter');
    }
    if (typeof divisible !== 'boolean') {
        throw new Error('Invalid divisible parameter');
    }
    if (typeof satsPerKB !== 'number') {
        throw new Error('Invalid satsPerKB parameter');
    }
    return {
        method: "create_send",
        params: {
            "source": sourceWallet,
            "asset": assetName,
            "quantity": divisible ? qty * 100000000 : qty,
            "destination": destinationWallet,
            "fee_per_kb": satsPerKB
        },
    };
};

export const mintMethod = ({
    sourceWallet,
    assetName,
    qty,
    locked,
    divisible,
    base64Data,
    satsPerKB
}: stampMintData) => {
    if (typeof sourceWallet !== 'string') {
        throw new Error('Invalid sourceWallet parameter. Expected a string.');
    }
    if (typeof assetName !== 'string') {
        throw new Error('Invalid assetName parameter. Expected a string.');
    }
    if (typeof qty !== 'number') {
        throw new Error('Invalid qty parameter. Expected a number.');
    }
    if (typeof locked !== 'boolean') {
        throw new Error('Invalid locked parameter. Expected a boolean.');
    }
    if (typeof divisible !== 'boolean') {
        throw new Error('Invalid divisible parameter. Expected a boolean.');
    }
    if (typeof base64Data !== 'string') {
        throw new Error('Invalid base64Data parameter. Expected a string.');
    }
    if (typeof satsPerKB !== 'number') {
        throw new Error('Invalid satsPerKB parameter. Expected a number.');
    }
    const selectedBurnKey = burnkeys[generateRandomNumber(0, burnkeys.length)];
    return {
        method: "create_issuance",
        params: {
            "source": sourceWallet,
            "asset": assetName,
            "quantity": qty,
            "divisible": divisible || false,
            "description": "stamp:" + base64Data,
            "lock": locked || true,
            "reset": false,
            "encoding": 'multisig',
            "allow_unconfirmed_inputs": true,
            "extended_tx_info": true,
            "multisig_dust_size": 796,
            "disable_utxo_locks": false,
            "dust_return_pubkey": selectedBurnKey,
            "fee_per_kb": satsPerKB
        }
    }
};
