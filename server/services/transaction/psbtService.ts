import { Buffer } from "node:buffer";
import { Psbt, Transaction, payments, networks, address as bjsAddress } from "bitcoinjs-lib";
import { getUTXOForAddress as getUTXOForAddressFromUtils } from "$lib/utils/utxoUtils.ts";
import { estimateFee } from "$lib/utils/minting/feeCalculations.ts";
import { TX_CONSTANTS } from "$lib/utils/minting/constants.ts";
import { getScriptTypeInfo } from "$lib/utils/scriptTypeUtils.ts";
import { hex2bin, bytesToHex } from "$lib/utils/binary/baseUtils.ts";
import { logger } from "$lib/utils/logger.ts";
import { CommonUTXOService } from "$server/services/utxo/commonUtxoService.ts";
import type { Output } from "$lib/types/index.d.ts";

// Define interfaces for dependency injection
export interface PSBTServiceDependencies {
  getUTXOForAddress: typeof getUTXOForAddressFromUtils;
  estimateFee: typeof estimateFee;
  commonUtxoService: CommonUTXOService;
  bitcoin?: typeof import("bitcoinjs-lib"); // Optional bitcoin lib injection for testing
}

export function formatPsbtForLogging(psbt: Psbt) {
  return {
      inputs: psbt.data.inputs.map(input => ({
          witnessUtxo: input.witnessUtxo ? {
              value: Number(input.witnessUtxo.value),
              script: input.witnessUtxo.script.toString()
          } : undefined,
          nonWitnessUtxo: input.nonWitnessUtxo ? input.nonWitnessUtxo.toString('hex') : undefined,
          redeemScript: input.redeemScript ? input.redeemScript.toString('hex') : undefined,
          witnessScript: input.witnessScript ? input.witnessScript.toString('hex') : undefined,
      })),
      outputs: psbt.txOutputs.map(output => ({
          address: output.address,
          script: output.script?.toString('hex'),
          value: Number(output.value)
      })),
  };
}

// Implementation class with dependency injection support
export class PSBTServiceImpl {
  private dependencies: PSBTServiceDependencies;
  private bitcoin: typeof import("bitcoinjs-lib");

  constructor(dependencies: PSBTServiceDependencies) {
    this.dependencies = dependencies;
    // Use injected bitcoin lib or fallback to default import
    this.bitcoin = dependencies.bitcoin || { Psbt, Transaction, payments, networks, address: bjsAddress };
  }

  // Simple createPSBT method with dependency injection
  async createPSBT(
    utxo: string,
    salePrice: number,
    sellerAddress: string,
  ): Promise<string> {
    // Validate input
    if (!utxo || !utxo.includes(':')) {
      throw new Error("Invalid utxo format. Expected format: 'txid:vout'");
    }

    const [txid, voutStr] = utxo.split(":");
    const vout = parseInt(voutStr, 10);

    if (isNaN(vout) || vout < 0) {
      throw new Error("Invalid vout value");
    }

    const network = this.getAddressNetwork(sellerAddress);
    const psbt = new this.bitcoin.Psbt({ network });

    // Fetch specific UTXO details using injected dependency
    const txInfo = await this.dependencies.getUTXOForAddress(sellerAddress, txid, vout);
    
    // Validate network consistency - UTXO and address must be on same network
    if (txInfo && 'utxo' in txInfo && txInfo.utxo) {
      // For mainnet UTXOs, ensure we're not using testnet addresses
      const isTestnetAddress = sellerAddress.startsWith('tb1') || sellerAddress.startsWith('2') || 
                              sellerAddress.startsWith('m') || sellerAddress.startsWith('n');
      if (isTestnetAddress) {
        throw new Error(`Network mismatch: Cannot use testnet address ${sellerAddress} with mainnet UTXO`);
      }
    }
    
    // Type guard to check if txInfo has utxo property
    if (!txInfo || Array.isArray(txInfo) || !('utxo' in txInfo) || !txInfo.utxo) {
      throw new Error(`Invalid UTXO details for ${txid}:${vout}`);
    }
    
    const utxoDetails = txInfo.utxo;
    logger.debug("UTXO Details:", utxoDetails);

    const satoshiAmount = BigInt(Math.floor(salePrice * 100000000));
    
    // Get the raw transaction hex for the input
    const rawTxHex = await this.dependencies.commonUtxoService.getRawTransactionHex(txid);
    const rawTxBuffer = Buffer.from(rawTxHex, 'hex');
    
    // Determine the script type and add appropriate input
    const script = Buffer.from(utxoDetails.script, 'hex');
    const scriptTypeInfo = getScriptTypeInfo(script);
    
    const inputData: any = {
      hash: txid,
      index: vout,
      sequence: 0xfffffffd, // RBF enabled
    };

    // Add witness or non-witness UTXO based on script type
    if (scriptTypeInfo.isSegwit) {
      inputData.witnessUtxo = {
        script: script,
        value: BigInt(utxoDetails.value),
      };
    } else {
      inputData.nonWitnessUtxo = rawTxBuffer;
    }

    // Add redeem script for P2SH
    if (scriptTypeInfo.type === 'p2sh' || scriptTypeInfo.type === 'p2sh-p2wpkh' || scriptTypeInfo.type === 'p2sh-p2wsh') {
      if (scriptTypeInfo.type === 'p2sh-p2wpkh') {
        const addressInfo = this.getAddressInfo(sellerAddress, network);
        if (addressInfo && addressInfo.hash) {
          inputData.redeemScript = this.bitcoin.payments.p2wpkh({ hash: addressInfo.hash, network }).output;
        }
      }
    }

    psbt.addInput(inputData);

    // Add outputs
    psbt.addOutput({
      address: sellerAddress,
      value: satoshiAmount,
    });

    // Calculate and add change output if needed
    const feeRate = 10; // sats/vbyte
    const estimatedFee = this.dependencies.estimateFee(
      [{ address: sellerAddress, value: satoshiAmount }],
      feeRate,
      1 // one input
    );

    const changeAmount = BigInt(utxoDetails.value) - satoshiAmount - BigInt(estimatedFee);
    console.log("PSBTService DEBUG - Change calculation:", {
      utxoValue: utxoDetails.value,
      satoshiAmount: satoshiAmount.toString(),
      estimatedFee,
      changeAmount: changeAmount.toString(),
      dustLimit: TX_CONSTANTS.SRC20_DUST,
      shouldAddChange: changeAmount > BigInt(TX_CONSTANTS.SRC20_DUST)
    });
    
    if (changeAmount < 0n) {
      throw new Error(`Insufficient funds: need ${satoshiAmount + BigInt(estimatedFee)} satoshis but only have ${utxoDetails.value} satoshis`);
    } else if (changeAmount > BigInt(TX_CONSTANTS.SRC20_DUST)) {
      // Add change output back to seller
      psbt.addOutput({
        address: sellerAddress,
        value: changeAmount,
      });
      console.log("PSBTService DEBUG - Added change output");
    } else {
      console.log("PSBTService DEBUG - No change output added, amount too small");
    }

    logger.debug("Created PSBT:", formatPsbtForLogging(psbt));
    
    return psbt.toHex();
  }

  async validateUTXOOwnership(
    utxoString: string,
    address: string,
  ): Promise<boolean> {
    const [txid, voutStr] = utxoString.split(":");
    const vout = parseInt(voutStr, 10);

    try {
      const utxo = await this.dependencies.commonUtxoService.getSpecificUTXO(txid, vout);
      
      // Check if the UTXO's address matches the provided address
      if (utxo.address) {
        return utxo.address === address;
      }
      
      // If no address, try to derive it from the script
      const script = Buffer.from(utxo.script, 'hex');
      const derivedAddress = this.bitcoin.address.fromOutputScript(script, this.getAddressNetwork(address));
      
      return derivedAddress === address;
    } catch (error) {
      logger.error(`Error validating UTXO ownership: ${error}`);
      throw error;
    }
  }

  // Helper methods
  private getAddressType(address: string, network: any): string {
    try {
      const decoded = this.bitcoin.address.fromBase58Check(address);
      if (decoded.version === network.pubKeyHash) return "p2pkh";
      if (decoded.version === network.scriptHash) return "p2sh";
    } catch {
      // Not a base58 address, try bech32
      try {
        const decoded = this.bitcoin.address.fromBech32(address);
        if (decoded.version === 0 && decoded.data.length === 20) return "p2wpkh";
        if (decoded.version === 0 && decoded.data.length === 32) return "p2wsh";
        if (decoded.version === 1 && decoded.data.length === 32) return "p2tr";
      } catch {
        throw new Error("Invalid address format");
      }
    }
    throw new Error("Unknown address type");
  }

  private getAddressNetwork(address: string): any {
    // Check for testnet prefixes
    if (address.startsWith('tb1') || address.startsWith('2') || 
        address.startsWith('m') || address.startsWith('n')) {
      try {
        this.bitcoin.address.toOutputScript(address, this.bitcoin.networks.testnet);
        return this.bitcoin.networks.testnet;
      } catch {
        // Fall through to mainnet
      }
    }
    
    // Default to mainnet
    try {
      this.bitcoin.address.toOutputScript(address, this.bitcoin.networks.bitcoin);
      return this.bitcoin.networks.bitcoin;
    } catch (_error) {
      // Throw error for invalid addresses or network mismatch
      throw new Error(`Invalid address or network mismatch: ${address}`);
    }
  }

  private getAddressInfo(address: string, _network: any): any {
    try {
      const decoded = this.bitcoin.address.fromBase58Check(address);
      return { hash: decoded.hash, version: decoded.version };
    } catch {
      try {
        const decoded = this.bitcoin.address.fromBech32(address);
        return { hash: Buffer.from(decoded.data), version: decoded.version };
      } catch {
        return null;
      }
    }
  }

  // Simplified version of processCounterpartyPSBT for testing
  async processCounterpartyPSBT(
    psbtHex: string,
    sellerUtxo: string,
    sellerAddress: string,
    _options?: { serviceFee?: number }
  ): Promise<{ psbtHex: string; isComplete: boolean }> {
    const psbt = this.bitcoin.Psbt.fromHex(psbtHex);
    
    // Parse seller UTXO
    const [txid, voutStr] = sellerUtxo.split(":");
    const vout = parseInt(voutStr, 10);
    
    // Verify buyer is paying to seller
    const hasPaymentToSeller = psbt.txOutputs.some(output => output.address === sellerAddress);
    if (!hasPaymentToSeller) {
      throw new Error("PSBT does not pay to the seller address");
    }
    
    // Get seller UTXO details
    const txInfo = await this.dependencies.getUTXOForAddress(sellerAddress, txid, vout);
    if (!txInfo || !('utxo' in txInfo) || !txInfo.utxo) {
      throw new Error(`Invalid seller UTXO: ${sellerUtxo}`);
    }
    
    const utxoDetails = txInfo.utxo;
    
    // Add seller's input
    psbt.addInput({
      hash: txid,
      index: vout,
      witnessUtxo: {
        script: Buffer.from(utxoDetails.script, 'hex'),
        value: BigInt(utxoDetails.value),
      },
    });
    
    return {
      psbtHex: psbt.toHex(),
      isComplete: false
    };
  }

  // Simplified version of buildPsbtFromUserFundedRawHex for testing
  async buildPsbtFromUserFundedRawHex(rawHex: string): Promise<string> {
    const tx = this.bitcoin.Transaction.fromHex(rawHex);
    const psbt = new this.bitcoin.Psbt();
    
    // Add inputs from the transaction
    for (let i = 0; i < tx.ins.length; i++) {
      const input = tx.ins[i];
      const txid = Buffer.from(input.hash).reverse().toString('hex');
      const vout = input.index;
      
      // Get UTXO details for this input
      const utxoInfo = await this.dependencies.commonUtxoService.getSpecificUTXO(txid, vout);
      
      if (utxoInfo && utxoInfo.script) {
        const script = Buffer.from(utxoInfo.script, 'hex');
        const scriptTypeInfo = getScriptTypeInfo(script);
        
        const inputData: any = {
          hash: txid,
          index: vout,
          sequence: input.sequence,
        };
        
        if (scriptTypeInfo.isSegwit) {
          inputData.witnessUtxo = {
            script: script,
            value: BigInt(utxoInfo.value),
          };
        } else {
          // For non-segwit, we need the full transaction
          const rawTxHex = await this.dependencies.commonUtxoService.getRawTransactionHex(txid);
          inputData.nonWitnessUtxo = Buffer.from(rawTxHex, 'hex');
        }
        
        psbt.addInput(inputData);
      }
    }
    
    // Add outputs from the transaction
    for (const output of tx.outs) {
      psbt.addOutput({
        script: output.script,
        value: output.value,
      });
    }
    
    return psbt.toHex();
  }
}

export class PSBTService {
  private static commonUtxoService = new CommonUTXOService();
  
  // Dependency injection support
  private static customInstance: PSBTServiceImpl | null = null;

  static setInstance(instance: PSBTServiceImpl) {
    PSBTService.customInstance = instance;
  }

  static resetInstance() {
    PSBTService.customInstance = null;
  }

  private static getInstance(): PSBTServiceImpl {
    if (PSBTService.customInstance) {
      return PSBTService.customInstance;
    }
    // Return default instance with current dependencies
    return new PSBTServiceImpl({
      getUTXOForAddress: getUTXOForAddressFromUtils,
      estimateFee,
      commonUtxoService: PSBTService.commonUtxoService,
    });
  }

  static async createPSBT(
    utxo: string,
    salePrice: number,
    sellerAddress: string,
  ): Promise<string> {
    const [txid, voutStr] = utxo.split(":");
    const vout = parseInt(voutStr, 10);

    const network = PSBTService.getAddressNetwork(sellerAddress);
    const psbt = new Psbt({ network });

    // Fetch specific UTXO details (no ancestor info needed)
    const txInfo = await getUTXOForAddressFromUtils(sellerAddress, txid, vout);
    
    // Type guard to check if txInfo has utxo property
    if (!txInfo || Array.isArray(txInfo) || !('utxo' in txInfo) || !txInfo.utxo) {
      throw new Error(`Invalid UTXO details for ${txid}:${vout}`);
    }
    
    const utxoDetails = txInfo.utxo;
    console.log("UTXO Details:", utxoDetails);

    if (!utxoDetails || !utxoDetails.value || !utxoDetails.script) {
      throw new Error(`Invalid UTXO details for ${txid}:${vout}`);
    }

    const inputAmount = utxoDetails.value;

    const input: any = {
      hash: txid,
      index: vout,
      sequence: 0xfffffffd, // Enable RBF
      witnessUtxo: {
        script: new Uint8Array(hex2bin(utxoDetails.script)), // Use hex2bin and be explicit with Uint8Array
        value: BigInt(inputAmount), // Use BigInt for values
      },
      sighashType: Transaction.SIGHASH_SINGLE | Transaction.SIGHASH_ANYONECANPAY,
    };

    // Add input
    psbt.addInput(input);

    // Add output for sale price
    const salePriceSats = BigInt(Math.round(salePrice * 1e8)); // Use BigInt
    psbt.addOutput({
      address: sellerAddress,
      value: salePriceSats,
    });

    const addressType = PSBTService.getAddressType(sellerAddress, network);
    
    if (addressType === 'p2sh-p2wpkh') {
      const p2wpkh = payments.p2wpkh({ address: sellerAddress, network });
      const p2sh = payments.p2sh({ redeem: p2wpkh, network });
      if (p2sh.redeem?.output) {
        psbt.updateInput(0, { 
          redeemScript: new Uint8Array(p2sh.redeem.output) // Be explicit with Uint8Array
        });
      }
    }

    // Return the PSBT as a hex string
    return psbt.toHex();
  }

  // Make sure all helper functions are static class methods
  private static getAddressType(address: string, network: networks.Network): string {
    try {
      // First check if it's a valid address
      bjsAddress.toOutputScript(address, network);
      
      // Check for P2WPKH (native segwit) - starts with bc1q for mainnet, tb1q for testnet
      if ((network === networks.bitcoin && address.startsWith('bc1q')) ||
          (network === networks.testnet && address.startsWith('tb1q'))) {
        return 'p2wpkh';
      }
      
      // Check for P2PKH (legacy) - starts with 1 for mainnet, m/n for testnet
      if ((network === networks.bitcoin && address.startsWith('1')) ||
          (network === networks.testnet && (address.startsWith('m') || address.startsWith('n')))) {
        return 'p2pkh';
      }
      
      // Check for P2SH - starts with 3 for mainnet, 2 for testnet
      if ((network === networks.bitcoin && address.startsWith('3')) ||
          (network === networks.testnet && address.startsWith('2'))) {
        // Try to determine if it's P2SH-P2WPKH by checking with payments
        try {
          payments.p2sh({
            redeem: payments.p2wpkh({ address, network }),
            network,
          });
          return 'p2sh-p2wpkh';
        } catch {
          return 'p2sh';
        }
      }
      
      throw new Error('Unsupported address type');
    } catch (_error) {
      throw new Error('Unsupported address type');
    }
  }

  private static getAddressNetwork(btcAddress: string) {
    try {
      payments.p2wpkh({ address: btcAddress, network: networks.bitcoin });
      return networks.bitcoin;
    } catch {
      try {
        payments.p2wpkh({ address: btcAddress, network: networks.testnet });
        return networks.testnet;
      } catch {
        throw new Error("Invalid Bitcoin address");
      }
    }
  }

  private static getAddressFromScript(script: Uint8Array, network: networks.Network): string {
    try {
      // Use bjsAddress.fromOutputScript which handles multiple script types
      return bjsAddress.fromOutputScript(Buffer.from(script), network);
    } catch (error: any) {
      throw new Error(`Failed to derive address from script: ${error.message}`);
    }
  }

  static async validateUTXOOwnership(
    utxo: string,
    address: string,
  ): Promise<boolean> {
    try {
      const [txid, voutStr] = utxo.split(":");
      const vout = parseInt(voutStr, 10);

      // Use getUTXOForAddress with specific UTXO lookup and failover
      const txInfo = await getUTXOForAddressFromUtils(address, txid, vout);
      // Check if txInfo is the expected structure with utxo property
      if (!txInfo || Array.isArray(txInfo) || !('utxo' in txInfo) || !txInfo.utxo) return false;

      // Get the scriptPubKey hex
      const scriptPubKeyHex = txInfo.utxo.script;
      if (!scriptPubKeyHex) {
        throw new Error("Missing scriptPubKey in transaction output");
      }

      // Convert scriptPubKey to address using Uint8Array
      const network = this.getAddressNetwork(address);
      const scriptPubKey = new Uint8Array(hex2bin(scriptPubKeyHex));

      let derivedAddress: string;
      try {
        // Try P2PKH
        derivedAddress = bjsAddress.fromOutputScript(Buffer.from(scriptPubKey), network);
      } catch (_e) {
        try {
          // Try P2WPKH or other script types
          derivedAddress = bjsAddress.fromOutputScript(Buffer.from(scriptPubKey), network);
        } catch (_e) {
          // Unsupported script type
          throw new Error("Unsupported script type in UTXO");
        }
      }

      // Compare the derived address with the provided address
      return derivedAddress === address;

    } catch (error) {
      console.error("Error in validateUTXOOwnership:", error);
      return false;
    }
  }

  static async completePSBT(
    sellerPsbtHex: string,
    buyerUtxoString: string,
    buyerAddress: string,
    feeRate: number,
  ): Promise<string> {
    console.log(`Starting completePSBT with feeRate: ${feeRate} sat/vB`);

    const network = PSBTService.getAddressNetwork(buyerAddress);

    // Parse the seller's PSBT
    const psbt = Psbt.fromHex(sellerPsbtHex, { network });

    // **Validate Seller's UTXO**
    const sellerTxInput = psbt.txInputs[0];
    if (!sellerTxInput) {
      throw new Error("Seller's txInput not found in PSBT");
    }

    // Extract seller's input details
    const sellerInputTxid = Array.from(sellerTxInput.hash)
      .reverse()
      .map(b => b.toString(16).padStart(2, "0"))
      .join("");
    const sellerInputVout = sellerTxInput.index;

    // Get seller's address from witnessUtxo
    const sellerWitnessUtxo = psbt.data.inputs[0].witnessUtxo;
    if (!sellerWitnessUtxo) {
      throw new Error("Seller's witnessUtxo not found");
    }

    const sellerAddress = PSBTService.getAddressFromScript(
      new Uint8Array(sellerWitnessUtxo.script), // Be explicit with Uint8Array
      network
    );

    // Validate seller's UTXO
    const sellerUtxoInfo = await getUTXOForAddressFromUtils(
      sellerAddress,
      sellerInputTxid,
      sellerInputVout,
    );

    if (!sellerUtxoInfo || Array.isArray(sellerUtxoInfo) || !('utxo' in sellerUtxoInfo) || !sellerUtxoInfo.utxo) {
      throw new Error("Seller's UTXO not found or already spent");
    }

    // **Process Buyer's UTXO**
    const [buyerTxid, buyerVoutStr] = buyerUtxoString.split(":");
    const buyerVout = parseInt(buyerVoutStr, 10);

    // Validate buyer's UTXO
    const buyerUtxoInfo = await getUTXOForAddressFromUtils(
      buyerAddress,
      buyerTxid,
      buyerVout,
    );

    if (!buyerUtxoInfo || Array.isArray(buyerUtxoInfo) || !('utxo' in buyerUtxoInfo) || !buyerUtxoInfo.utxo) {
      throw new Error("Buyer's UTXO not found or already spent");
    }

    const buyerUtxo = buyerUtxoInfo.utxo;

    if (!buyerUtxo.script || buyerUtxo.value === undefined) {
      throw new Error("Incomplete buyer UTXO data.");
    }

    // Add buyer's input to the PSBT
    psbt.addInput({
      hash: buyerTxid,
      index: buyerVout,
      sequence: 0xfffffffd, // Enable RBF
      witnessUtxo: {
        script: new Uint8Array(hex2bin(buyerUtxo.script)), // Use hex2bin and be explicit
        value: BigInt(buyerUtxo.value), // Use BigInt
      },
    });

    // **Calculate Total Input and Output Values**
    const totalInputValue = psbt.data.inputs.reduce(
      (sum, input) => sum + BigInt(input.witnessUtxo?.value || 0),
      BigInt(0)
    );

    const totalOutputValue = psbt.txOutputs.reduce(
      (sum, output) => sum + BigInt(output.value),
      BigInt(0)
    );

    // **Prepare Outputs Array for Fee Estimation**
    const outputs = psbt.txOutputs.map((output) => {
      return {
        script: output.script.toString(),
        value: Number(output.value),
      };
    });

    // **Estimate the Fee**
    const estimatedFee = estimateFee(
      outputs,
      feeRate,
      psbt.txInputs.length,
      buyerUtxo.ancestor ? [buyerUtxo.ancestor] : undefined
    );

    // **Calculate Change**
    const changeValue = totalInputValue - totalOutputValue - BigInt(estimatedFee);

    if (changeValue < 0) {
      throw new Error("Insufficient funds to cover outputs and fees.");
    }

    // **Add Change Output if Necessary**
    if (changeValue > 0) {
      psbt.addOutput({
        address: buyerAddress,
        value: changeValue,
      });
    }

    // Return the updated PSBT hex without signing
    return psbt.toHex();
  }

  /**
   * @deprecated This will be removed in a future release. Please migrate to the buildPsbtFromUserFundedRawHex function.
   */
  static async processCounterpartyPSBT(
    psbtBase64: string,
    userAddress: string,
    targetFeeRateSatVb: number,
    isDryRun = false,
    options?: {
      serviceFeeDetails?: { fee: number; address: string };
    }
  ): Promise<{
    psbtHex?: string;
    inputsToSign?: { index: number; address?: string; sighashTypes?: number[] }[];
    estimatedFee?: number;
    estimatedVsize?: number;
    totalInputValue?: bigint;
    totalOutputValue?: bigint;
    finalUserChange?: bigint;
  }> {
    console.log("\n[PSBTService] === Entered processCounterpartyPSBT function v2.0 (Robust Fee/Change/ServiceFee) ===");
    console.log(`[PSBTService] Initial psbtBase64 (len): ${psbtBase64.length}, userAddress: ${userAddress}, targetFeeRateSatVb: ${targetFeeRateSatVb}`);
    if (options?.serviceFeeDetails) {
        console.log("[PSBTService] Service Fee Details:", options.serviceFeeDetails);
    }

    try {
      const psbt = Psbt.fromBase64(psbtBase64);
      const network = this.getAddressNetwork(userAddress);

      console.log(`[PSBTService] PSBT parsed. Initial input count: ${psbt.inputCount}, output count: ${psbt.txOutputs.length}`);

      const originalTx = psbt.data.globalMap.unsignedTx;
      if (!originalTx || !originalTx.ins || !originalTx.outs) {
        throw new Error("Invalid transaction structure in PSBT from Counterparty");
      }

      // 1. Enrich Inputs (fetch full UTXO details)
      let totalInputValue = BigInt(0);
      for (const [index, _inputDetail] of psbt.data.inputs.entries()) {
        // If witnessUtxo is already present and seems valid, we might trust it.
        // However, CP might provide minimal PSBTs, so re-fetching is safer.
        const txIn = originalTx.ins[index];
        const inputTxid = Buffer.from(txIn.hash).reverse().toString('hex');
        const inputVout = txIn.index;
        
        console.log(`[PSBTService] Enriching input ${index}: ${inputTxid}:${inputVout}`);
        const utxoDetails = await this.commonUtxoService.getSpecificUTXO(inputTxid, inputVout, { 
            includeAncestorDetails: !isDryRun, 
            forcePublicAPI: true // Consider if always forcing public is needed or use smart fallback
        });

        if (!utxoDetails || !utxoDetails.script || utxoDetails.value === undefined) {
          throw new Error(`UTXO details/script not found for input ${index}: ${inputTxid}:${inputVout}.`);
        }

        totalInputValue += BigInt(utxoDetails.value);
        const scriptTypeInfo = getScriptTypeInfo(utxoDetails.script);
        const updateData: any = { sighashType: Transaction.SIGHASH_ALL };

        if (scriptTypeInfo.isWitness || (scriptTypeInfo.type === "P2SH" && scriptTypeInfo.redeemScriptType?.isWitness)) {
          updateData.witnessUtxo = {
            script: hex2bin(utxoDetails.script),
            value: BigInt(utxoDetails.value),
          };
        } else {
          const rawTxHex = await this.commonUtxoService.getRawTransactionHex(inputTxid);
          if (!rawTxHex) throw new Error(`Failed to fetch raw tx hex for non-witness input ${inputTxid}`);
          updateData.nonWitnessUtxo = hex2bin(rawTxHex);
        }
        if (scriptTypeInfo.type === "P2SH" && scriptTypeInfo.redeemScriptType) {
          // Fix: Use redeemScriptType instead of redeemScript
          if (scriptTypeInfo.redeemScriptType && 'hex' in scriptTypeInfo.redeemScriptType) {
            updateData.redeemScript = hex2bin((scriptTypeInfo.redeemScriptType as any).hex);
          }
        }
        psbt.updateInput(index, updateData);
        console.log(`[PSBTService] Input ${index} enriched. Value: ${utxoDetails.value}`);
      }
      console.log(`[PSBTService] All inputs enriched. Total Input Value: ${totalInputValue.toString()}`);

      // 2. Identify outputs to preserve from original PSBT (excluding any potential old change to userAddress)
      // And calculate their total value.
      let totalValueToPreservedOutputs = BigInt(0);
      const outputsToPreserve: { address?: string; script: Buffer; value: bigint }[] = [];

      for (const output of originalTx.outs) {
          let isChangeToUser = false;
          try {
            const outputAddress = bjsAddress.fromOutputScript(output.script, network);
            if (outputAddress === userAddress) {
                isChangeToUser = true;
            }
          } catch (_e) { /* Not an address output or not parsable, definitely not change to userAddress */ }

          if (!isChangeToUser) {
            outputsToPreserve.push({ script: Buffer.from(output.script), value: BigInt(output.value) });
            totalValueToPreservedOutputs += BigInt(output.value);
            console.log(`[PSBTService] Preserving original output: value=${output.value}, script=${bytesToHex(output.script)}`);
          } else {
            console.log(`[PSBTService] Ignoring original output to user (potential old change): value=${output.value}, script=${bytesToHex(output.script)}`);
          }
      }
      
      let totalValueToOthers = totalValueToPreservedOutputs;

      // 3. Add service fee output if applicable
      if (options?.serviceFeeDetails && options.serviceFeeDetails.fee > 0 && options.serviceFeeDetails.address) {
        const serviceFeeScript = bjsAddress.toOutputScript(options.serviceFeeDetails.address, network);
        outputsToPreserve.push({
          script: Buffer.from(serviceFeeScript),
          value: BigInt(options.serviceFeeDetails.fee),
        });
        totalValueToOthers += BigInt(options.serviceFeeDetails.fee);
        console.log(`[PSBTService] Added service fee output: ${options.serviceFeeDetails.fee} sats to ${options.serviceFeeDetails.address}`);
      }
      
      // Clear existing outputs from PSBT object to rebuild cleanly
      while (psbt.txOutputs.length > 0) {
        psbt.txOutputs.pop();
      }
      if (psbt.data.globalMap.unsignedTx) {
          psbt.data.globalMap.unsignedTx.outs = [];
      }

      // Add preserved and service fee outputs to PSBT for size estimation
      outputsToPreserve.forEach(out => {
        psbt.addOutput({ script: out.script, value: out.value });
      });
      
      // Add a dummy change output for size estimation - use a non-dust value
      psbt.addOutput({ address: userAddress, value: BigInt(2000) }); // e.g., 2000 sats

      // Finalize inputs for accurate size calculation
      for (let i = 0; i < psbt.inputCount; i++) {
        try {
          psbt.finalizeInput(i);
          console.log(`[PSBTService] Successfully finalized input #${i} for size estimation.`);
        } catch (e) {
            // This can happen if, for example, a script type needs a redeemScript that wasn't provided
            // For standard P2WPKH from buyerUtxoDetails, this should generally be fine.
            // console.warn(`[PSBTService] Non-critical error during psbt.finalizeInput(${i}) for size estimation: ${e.message}`);
            const errorMessage = e instanceof Error ? e.message : String(e);
            console.error(`[PSBTService] CRITICAL error during psbt.finalizeInput(${i}) for input ${psbt.txInputs[i].hash.toString()}: ${errorMessage}`);
            throw new Error(`Failed to finalize input #${i} for PSBT construction: ${errorMessage}`);
        }
      }
      
      const tempTx = psbt.extractTransaction(true);
      const estimatedVsize = BigInt(tempTx.virtualSize());
      let calculatedMinerFee = estimatedVsize * BigInt(Math.ceil(targetFeeRateSatVb));
      console.log(`[PSBTService] Fee estimation: VSize=${estimatedVsize}, Rate=${targetFeeRateSatVb} sat/vB, MinerFee=${calculatedMinerFee}`);
      
      // Remove dummy change output and rebuild outputs correctly
      psbt.txOutputs.pop(); // remove dummy change
      if (psbt.data.globalMap.unsignedTx) {
        psbt.data.globalMap.unsignedTx.outs.pop();
      }


      let actualUserChange = totalInputValue - totalValueToOthers - calculatedMinerFee;
      console.log(`[PSBTService] User change calculation: totalIn=${totalInputValue}, totalToOthers=${totalValueToOthers}, minerFee=${calculatedMinerFee}, change=${actualUserChange}`);

      if (actualUserChange >= TX_CONSTANTS.DUST_SIZE) {
        psbt.addOutput({ address: userAddress, value: actualUserChange });
        console.log(`[PSBTService] Added actual user change output: ${actualUserChange} sats to ${userAddress}`);
      } else if (actualUserChange > 0) {
        calculatedMinerFee += actualUserChange;
        actualUserChange = BigInt(0);
        console.log(`[PSBTService] User change ${actualUserChange} is below dust, adding to fee. New miner fee: ${calculatedMinerFee}`);
      } else if (actualUserChange < 0) {
        throw new Error(
          `Insufficient funds: Input ${totalInputValue}, To Others ${totalValueToOthers}, Miner Fee ${calculatedMinerFee}. Deficit: ${-actualUserChange}`,
        );
      }
      
      if (isDryRun) {
        return {
          estimatedFee: Number(calculatedMinerFee),
          estimatedVsize: Number(estimatedVsize),
          totalInputValue: totalInputValue,
          totalOutputValue: totalValueToOthers,
          finalUserChange: actualUserChange,
        };
      }
      
      psbt.setMaximumFeeRate(Math.ceil(targetFeeRateSatVb * 1.5)); // Safety margin

      // Finalize inputs AGAIN on the final PSBT structure before returning to client
      // This ensures the PSBT is ready for the client to sign.
      console.log("[PSBTService] Finalizing inputs on the final PSBT structure...");
      
      // Create inputsToSign array for return value
      const inputsToSign: { index: number; address?: string; sighashTypes?: number[] }[] = [];
      for (let i = 0; i < psbt.inputCount; i++) {
        inputsToSign.push({ index: i, address: userAddress, sighashTypes: [Transaction.SIGHASH_ALL] });
        try {
          psbt.finalizeInput(i);
          console.log(`[PSBTService] Successfully finalized input #${i} on final PSBT.`);
        } catch (e) {
          // If this finalization fails, it's a more critical issue for client signing.
          const errorMessage = e instanceof Error ? e.message : String(e);
          console.error(`[PSBTService] CRITICAL error during FINAL psbt.finalizeInput(${i}) for input ${psbt.txInputs[i].hash.toString()}:${psbt.txInputs[i].index}: ${errorMessage}`);
          throw new Error(`Failed to finalize input #${i} on the final PSBT: ${errorMessage}`);
        }
      }

      const finalPsbtHex = psbt.toHex();
      
      // For verification, re-parse and log details - Keep this section for debugging for now
      console.log("[PSBTService] ------------- VERIFYING FINAL psbtHex ON SERVER (processCounterpartyPSBT v2.0) ------------- ");
      // (Optional: Add verification log similar to buildPsbtFromUserFundedRawHex if needed)
      console.log("[PSBTService] ------------------------------------------------------------------------------------\n");


      return {
        psbtHex: finalPsbtHex,
        inputsToSign,
        estimatedFee: Number(calculatedMinerFee),
        estimatedVsize: Number(estimatedVsize),
        totalInputValue,
        totalOutputValue: totalValueToOthers,
        finalUserChange: actualUserChange,
      };

    } catch (error) {
      console.error("[PSBTService] === ERROR in processCounterpartyPSBT v2.0 ===");
      await logger.error("psbt-service", {
        message: "Error processing Counterparty PSBT v2.0",
        error: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw new Error(
        `Failed to process PSBT (v2.0): ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      );
    }
  }

  public static async buildPsbtFromUserFundedRawHex(
    counterpartyTxHex: string,
    userAddress: string,
    targetFeeRateSatVb: number,
    options: {
      dispenserDestinationAddress: string;
      dispenserPaymentAmount: number;
      serviceFeeDetails?: { fee: number; address: string };
    }
  ): Promise<{
    psbtHex: string;
    inputsToSign: { index: number; address?: string; sighashTypes?: number[] }[];
    estimatedFee: number;
    estimatedVsize: number;
    finalBuyerChange: number;
  }> {
    console.log("[PSBTService] Entered buildPsbtFromUserFundedRawHex v8.1 (Robust Fee/Change, No Server Finalize)");
    console.log(
      `  Params: userAddress=${userAddress}, targetFeeRateSatVb=${targetFeeRateSatVb}, counterpartyTxHex (len)=${counterpartyTxHex.length}`,
    );
    console.log("  Options:", options);

    const network = networks.bitcoin;
    const psbt = new Psbt({ network });
    const inputsToSign: { index: number; address?: string; sighashTypes?: number[] }[] = [];

    try {
      const cpTx = Transaction.fromHex(counterpartyTxHex);

      // Allow multiple inputs from the Counterparty transaction hex
      if (!cpTx.ins || cpTx.ins.length === 0) {
        throw new Error(
          `Counterparty transaction hex must have at least one input, found ${cpTx.ins?.length || 0}`,
        );
      }
      if (!cpTx.outs || cpTx.outs.length === 0) {
        throw new Error("Counterparty transaction hex has no outputs.");
      }

      // Process all inputs from the Counterparty transaction
      let totalBuyerInputValue = BigInt(0);
      for (const [index, cpInput] of cpTx.ins.entries()) {
        const inputTxid = Buffer.from(cpInput.hash).reverse().toString("hex");
        const inputVout = cpInput.index;

        console.log(`[PSBTService] Processing input ${index} from CP Hex: ${inputTxid}:${inputVout}`);

        const utxoDetails = await this.commonUtxoService.getSpecificUTXO(
          inputTxid,
          inputVout,
          { includeAncestorDetails: false }, // Do not force public API here
        );

        if (!utxoDetails || !utxoDetails.script || utxoDetails.value === undefined) {
          throw new Error(
            `Failed to fetch UTXO details for input ${index}: ${inputTxid}:${inputVout}`,
          );
        }
        const inputValue = BigInt(utxoDetails.value);
        totalBuyerInputValue += inputValue;
        console.log(
          `[PSBTService] Fetched UTXO details for input ${index}: script=${utxoDetails.script}, value=${inputValue}`,
        );

        psbt.addInput({
          hash: inputTxid,
          index: inputVout,
          sequence: cpInput.sequence,
          witnessUtxo: {
            script: hex2bin(utxoDetails.script),
            value: inputValue,
          },
        });
        // Assuming all inputs from cpTx are to be signed by the userAddress
        inputsToSign.push({ index, address: userAddress, sighashTypes: [Transaction.SIGHASH_ALL] });
      }

      let totalValueToOthers = BigInt(0);
      const finalOutputs: { address?: string; script?: Buffer; value: bigint }[] = [];

      // 1. Dispenser payment output
      finalOutputs.push({
        address: options.dispenserDestinationAddress,
        value: BigInt(options.dispenserPaymentAmount),
      });
      totalValueToOthers += BigInt(options.dispenserPaymentAmount);

      // 2. OP_RETURN output from cpTx
      const opReturnOutput = cpTx.outs.find(out => out.script.length > 0 && out.script[0] === 0x6a);
      if (opReturnOutput) {
        finalOutputs.push({ script: Buffer.from(opReturnOutput.script), value: BigInt(opReturnOutput.value) });
      }
      
      // 3. Service fee output
      if (options.serviceFeeDetails && options.serviceFeeDetails.fee > 0 && options.serviceFeeDetails.address) {
        finalOutputs.push({
          address: options.serviceFeeDetails.address,
          value: BigInt(options.serviceFeeDetails.fee),
        });
        totalValueToOthers += BigInt(options.serviceFeeDetails.fee);
      }

      // ESTIMATE SIZE AND FEE
      const outputsForEstimation: Output[] = [];
      // 1. Dispenser payment output (assume P2WPKH for estimation)
      outputsForEstimation.push({ value: Number(options.dispenserPaymentAmount) });
      // 2. OP_RETURN output (if present) - estimateFee handles type via determineOutputType
      if (opReturnOutput) {
        outputsForEstimation.push({ script: opReturnOutput.script.toString(), value: Number(opReturnOutput.value) });
      }
      // 3. Service fee output (if present, assume P2WPKH for estimation)
      if (options.serviceFeeDetails && options.serviceFeeDetails.fee > 0) {
        outputsForEstimation.push({ value: options.serviceFeeDetails.fee });
      }
      // 4. Change output (assume P2WPKH, value doesn't matter as much for size here)
      outputsForEstimation.push({ value: 1000 }); // Dummy value for size estimation

      const estimatedMinerFeeFull = estimateFee(outputsForEstimation, targetFeeRateSatVb, 1); // 1 input
      let calculatedMinerFee = BigInt(estimatedMinerFeeFull);
      const estimatedVsize = Math.ceil(estimatedMinerFeeFull / targetFeeRateSatVb); // Back-calculate VSize from fee and rate
      
      console.log(`[PSBTService] Fee Est (using estimateFee): totalValueToOthers=${totalValueToOthers}, estimatedVsize=${estimatedVsize}, targetFeeRateSatVb=${targetFeeRateSatVb}, calculatedMinerFee=${calculatedMinerFee}`);

      let actualBuyerChange = totalBuyerInputValue - totalValueToOthers - calculatedMinerFee;
      console.log(`[PSBTService] Buyer's available for change & fee: ${totalBuyerInputValue - totalValueToOthers}. Calculated change (before dust check): ${actualBuyerChange}`);

      // Add final outputs to PSBT
      finalOutputs.forEach(out => {
         if (out.address) psbt.addOutput({ address: out.address, value: out.value });
         else if (out.script) psbt.addOutput({ script: out.script, value: out.value });
      });

      if (actualBuyerChange >= TX_CONSTANTS.DUST_SIZE) {
        psbt.addOutput({ address: userAddress, value: actualBuyerChange });
      } else if (actualBuyerChange > 0) {
        calculatedMinerFee += actualBuyerChange;
        actualBuyerChange = BigInt(0);
      } else if (actualBuyerChange < 0) {
        throw new Error(
          `Insufficient funds: Input ${totalBuyerInputValue}, To Others ${totalValueToOthers}, Miner Fee ${calculatedMinerFee}. Deficit: ${-actualBuyerChange}`,
        );
      }
      
      // DO NOT CALL FINALIZEINPUT on server for this version
      // The PSBT will be finalized by the client's wallet.

      const finalPsbtHex = psbt.toHex();
      console.log("[PSBTService] PSBT constructed (v8.1 - no server finalize). Ready for client.");

      return {
        psbtHex: finalPsbtHex,
        inputsToSign,
        estimatedFee: Number(calculatedMinerFee),
        estimatedVsize: Number(estimatedVsize),
        finalBuyerChange: Number(actualBuyerChange),
      };
    } catch (error) {
      console.error("[PSBTService] ERROR in buildPsbtFromUserFundedRawHex v8.1:", error);
      await logger.error("psbt-service", {
        message: "Error in buildPsbtFromUserFundedRawHex v8.1",
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw error;
    }
  }

  /* static async processCounterpartyPSBT( ... ) { ... } // Commented out for now, will be refactored/consolidated later */
}

// Export function to create instance with custom dependencies for testing
export function createPSBTService(dependencies: Partial<PSBTServiceDependencies> = {}): PSBTServiceImpl {
  return new PSBTServiceImpl({
    getUTXOForAddress: dependencies.getUTXOForAddress || getUTXOForAddressFromUtils,
    estimateFee: dependencies.estimateFee || estimateFee,
    commonUtxoService: dependencies.commonUtxoService || CommonUTXOService.getInstance(),
    bitcoin: dependencies.bitcoin, // Pass through bitcoin lib injection
  });
}
