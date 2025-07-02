import * as bitcoin from "bitcoinjs-lib";
import * as ecc from "tiny-secp256k1";

// Initialize bitcoinjs-lib with the ECC library
bitcoin.initEccLib(ecc);

console.log("bitcoinjs-lib ECC initialized on client-side.");
