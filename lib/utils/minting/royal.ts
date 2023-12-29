//import * as btc from "@scure/btc-signer";
//import * as btc from "npm:@scure/btc-signer@1.1.1";
//import { Transaction } from "npm:@scure/btc-signer@1.1.1";
import { hex } from "npm:@scure/base@1.1.1";

import * as bitcoin from "npm:bitcoinjs-lib@6.1.5";
//import { Buffer } from "https://deno.land/std/io/mod.ts";
import { Buffer } from "https://deno.land/std@0.177.0/node/buffer.ts";
import { getTransactionInfo } from "utils/mempool.ts";


// export const decode = async (tx: any) => {
//     const tx_hex = hex.decode(tx);
//     console.log(tx_hex);
//     const decoded_tx = Transaction.fromRaw(tx_hex);
// 
//     console.log(decoded_tx);
// 
// };




export const convertRawToPSBT = async (tx: any) => {
    const transaction = bitcoin.Transaction.fromHex(tx)

    const psbt = new bitcoin.Psbt({ network: bitcoin.networks.bitcoin }) // Asegúrate de usar la red correcta (bitcoin, testnet, etc.)
        .addInputs(await Promise.all(transaction.ins.map(async (input) => {
            const txid = Array.prototype.reverse.call(input.hash).toString('hex');
            const txHex = await getTransactionInfo(txid)
            const u8hex = hex.decode(txHex);
            const txBuffer = Buffer.from(u8hex.buffer, u8hex.byteOffset, u8hex.byteLength);

            const new_input = {
                hash: input.hash,
                index: input.index,
                nonWitnessUtxo: txBuffer,
            }
            return new_input;
        })))
        .addOutputs(transaction.outs.map(output => {
            try {
                const address = bitcoin.address.fromOutputScript(output.script, bitcoin.networks.bitcoin);
                return {
                    address,
                    value: output.value,
                };
            } catch (error) {
                return {
                    script: output.script,
                    value: output.value,
                };
            }
        }));
    return psbt;
}

const txToTest = "02000000000106fb0a2b2f22a72968770eed97787ec4cee72a214c5c7bcee9d99888b1eb6df40703000000160014b2d473adbc04436fcf1f3c6e1df72e1d427cc8e0ffffffffced2e336dca40fd91172719bef0a46e87b99ab7402af166f71794e01edc4db1501000000160014b2d473adbc04436fcf1f3c6e1df72e1d427cc8e0ffffffff4418ac14686bbc491fb9b56dbac9ce84e561704228a772ac70b87720b48f351c01000000160014b2d473adbc04436fcf1f3c6e1df72e1d427cc8e0ffffffffcd7a69a2ac8c16af20a5162ab6478d41a232bee5934be5cf5141c06f2a802d8603000000160014b2d473adbc04436fcf1f3c6e1df72e1d427cc8e0ffffffffee59c68a39ea2fb6e65f1bb7fdca6ab2b29c53d44eaa48e72f57973280bbb4bc03000000160014b2d473adbc04436fcf1f3c6e1df72e1d427cc8e0ffffffff52296695779b1fb23156a887b7767904b0c09d32a9e6dcd7ef3c3b70c515f8cf01000000160014b2d473adbc04436fcf1f3c6e1df72e1d427cc8e0ffffffff041c0300000000000069512103e81ab5f150054fe2e4ee5dc5c584bded7b49779588aa54d32e127511d1c879472102311a7023b72cdac1ea551043d1a826ea6cf512f797bf4f5b9fd29256f00f7a0a2102222222222222222222222222222222222222222222222222222222222222222253ae1c0300000000000069512103e81ab5f150054fe2e4b964b18c3ffa08f50036d4cbe436aa4c1a345190fa45dc2102151b4548882bd1bf8a721427b9f766dc1e8c14f085b2635788fe9627f50657662102222222222222222222222222222222222222222222222222222222222222222253ae1c0300000000000069512103f91ab5f150054fe2e49f499a833bf808e37823cdc49a0de7613e025190fa4cbc2102123d524ceb3feae5f245476fabf249ab2db453b9c4ea271ecab5d317b14e2fe42102222222222222222222222222222222222222222222222222222222222222222253aed2327d0300000000160014b2d473adbc04436fcf1f3c6e1df72e1d427cc8e002000002000002000002000002000002000000000000";

const converted = await convertRawToPSBT(txToTest);
console.log(converted);

