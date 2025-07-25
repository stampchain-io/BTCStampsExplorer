// import { unicodeEscapeToEmoji } from "$lib/utils/ui/formatting/emojiUtils.ts"; // Unused import - removed
import { TXError } from "$globals";
// import { crypto } from "@std/crypto"; // Unused import - removed
import { isValidBitcoinAddress } from "$lib/utils/bitcoin/scripts/scriptTypeUtils.ts";
import { SRC101QueryService } from "./queryService.ts";
// import { BigFloat } from "bigfloat/mod.ts"; // Unused import - removed
// import { ResponseUtil } from "$lib/utils/api/responses/responseUtil.ts"; // Unused import - removed
import { SRC101InputData } from "$types/index.d.ts"; // Fixed import path

export class SRC101UtilityService {
  static async getDeployDetails(deploy_hash: string) {
    const info = await SRC101QueryService.getDeployDetails(deploy_hash);
    console.log(`checkDeployed.info: ${JSON.stringify(info)}`);
    if (!info) {
      throw new Error("Error: deploy_hash not found");
    }
    return info;
  }

  static async getSrc101Price(deploy_hash: string){
    const prices = await SRC101QueryService.getSrc101Price(deploy_hash);
    if(!prices){
      throw new Error("Error: deploy_hash price not found");
    }
    return prices;
  }

  static async getSrc101Owner(deploy_hash: string, tokenid: string | string[]) {
    // If tokenid is an array, use the first element
    const tokenIdString = Array.isArray(tokenid) ? tokenid[0] : tokenid;
    
    const queryParams = {
      deploy_hash,
      tokenid: tokenIdString,
      limit: 1000,
      page: 1,
      sort: "ASC",
    };
    const info = await SRC101QueryService.getSrc101Owner(queryParams)
    if (!info) {
      throw new Error("Error: tokenid info not found");
    }
    return info;
  }

  static async validateOperation(
    operation: "deploy" | "mint" | "transfer" | "setrecord" | "renew",
    body: SRC101InputData,
  ): Promise<void | TXError> {
    // Common validations for all operations
    console.log("body", body)
    if (body.toAddress && !isValidBitcoinAddress(body.toAddress)) {
      return { error: "Invalid or missing toAddress" };
    }

    if (body.recAddress && !isValidBitcoinAddress(body.recAddress)) {
      return { error: "Invalid or missing recAddress" };
    }

    // if (body.fromAddress && !isValidBitcoinAddress(body.fromAddress)) {
    //   return { error: "Invalid or missing fromAddress" };
    // }

    if (!body.changeAddress || !isValidBitcoinAddress(body.changeAddress)) {
      return { error: "Invalid or missing changeAddress" };
    }
    if (!body.sourceAddress || !isValidBitcoinAddress(body.sourceAddress)) {
      return { error: "Invalid or missing sourceAddress" };
    }

    if (!body.feeRate || isNaN(Number(body.feeRate))) {
      return { error: "Invalid or missing feeRate" };
    }

    // Operation-specific validations
    switch (operation) {
      case "deploy": {
        const deployResult = this.validateDeploy(body);
        if (deployResult) return deployResult;
        break;
      }

      case "mint": {
        const mintResult = await this.validateMint(body);
        if (mintResult) return mintResult;
        break;
      }

      case "transfer": {
        const transferResult = await this.validateTransfer(body);
        if (transferResult) return transferResult;
        break;
      }

      case "setrecord": {
        const setrecordResult = await this.validateSetRecord(body);
        if (setrecordResult) return setrecordResult;
        break;
      }

      case "renew": {
        const renewResult = await this.validateRenew(body);
        if (renewResult) return renewResult;
        break;
      }

      default:
        return { error: "Invalid operation" };
    }
  }

  private static validateDeploy(body: SRC101InputData): void | TXError {
    // Validate deploy-specific parameters

    if(!body.root || typeof body.root !== 'string') {
      return { error: "root must be a string" };
    }

    if(!body.name || typeof body.name !== 'string') {
      return { error: "name must be a string" };
    }

    if(!body.tick || typeof body.tick !== 'string') {
      return { error: "tick must be a string" };
    }

    if(!body.desc || typeof body.desc !== 'string') {
      return { error: "desc must be a string" };
    }

    if(!body.wla || typeof body.wla !== 'string') {
      return { error: "wla must be a string" };
    }

    if (!Array.isArray(body.rec) || !body.rec.every(item => typeof item === 'string')){
      return { error: "rec must be a array and the address in the rec must be valid address" };
    }

    if (!SRC101UtilityService.validataDeploy_pri(body.pri)){
      return { error: "pri must be a json like {0:45000,1:-1,2:-1,3:900000,4:225000}" };
    }

    if (!body.lim || isNaN(Number(body.lim))) {
      return { error: "lim must be a number" };
    }
    if (!body.mintstart || isNaN(Number(body.mintstart))) {
      return { error: "mintstart must be a number" };
    }
    if (!body.mintend || isNaN(Number(body.mintend))) {
      return { error: "mintend must be a number" };
    }
    if (!body.idua || isNaN(Number(body.idua))) {
      return { error: "idua need and must be a number" };
    }

    if (!body.owner || !isValidBitcoinAddress(body.owner)) {
      return { error: "Invalid owner" };
    }

    if (!body.imglp || !/^https?:\/\/[^\s/$.?#].[^\s]*$/.test(body.imglp)) {
      return { error: "Invalid website URL" };
    }

  }

  private static async validateMint(body: SRC101InputData): Promise<void | TXError> {
    if (!body.toaddress || !isValidBitcoinAddress(body.toaddress)) {
      return { error: "Invalid or missing toaddress" };
    }

    if (!body.hash || !SRC101UtilityService.checkValidTxHash(body.hash)){
      return { error: "Invalid deployHash" };
    }

    //check tokenid
    if (!Array.isArray(body.tokenid)) {
      return { error: "tokenid must be an array" };
    }
    for (const item of body.tokenid) {
      if (typeof item !== "string") {
        return { error: "Each item in tokenid array must be a string" };
      }

      if (!SRC101UtilityService.checkValidBase64String(item)) {
        return { error: `Invalid Base64 string: ${item}` };
      }
      const item_utf8 = SRC101UtilityService.base64ToUtf8(item);
      if ( !item_utf8 || SRC101UtilityService.checkContainsSpecial(item_utf8.replace('.btc',''))) {
        return { error: `Contains special characters: ${item}` };
      }

      if (body.dua && isNaN(Number(body.dua))) {
        return { error: "dua must be a number" };
      }

      if (body.coef && isNaN(Number(body.coef))) {
        return { error: "coef must be a number, default 1000" };
      }
    }

    const timestampInSeconds = Math.floor(Date.now() / 1000);
    const info = await SRC101UtilityService.getDeployDetails(body.hash);
    if (timestampInSeconds < info.mintstart || timestampInSeconds > info.mintend) {
      return { error: "Out of time" };
    }
  }

  private static async validateTransfer(body: SRC101InputData): Promise<void | TXError> {
    if (!body.toaddress || !isValidBitcoinAddress(body.toaddress)) {
      return { error: "Invalid or missing toaddress" };
    }
    
    if (!body.hash || !body.tokenid) {
      return { error: "Missing required fields: hash or tokenid" };
    }
    
    const info = await SRC101UtilityService.getSrc101Owner(
      body.hash,
      body.tokenid
    );
    console.log("validateTransfer", info)
    const timestampInSeconds = Math.floor(Date.now() / 1000);
    if (info.length == 0 || info[0].owner != body.sourceAddress) {
      return { error: "Invalid owner" };
    }

    if (timestampInSeconds > info[0].expire_timestamp) {
      return { error: "Out of time" };
    }
  }

  private static async validateSetRecord(body: SRC101InputData): Promise<void | TXError> {
    if (!body.hash || !body.tokenid) {
      return { error: "Missing required fields: hash or tokenid" };
    }
    
    const info = await SRC101UtilityService.getSrc101Owner(
      body.hash,
      body.tokenid
    );
    const timestampInSeconds = Math.floor(Date.now() / 1000);
    if (info.length == 0 || info[0].owner != body.sourceAddress) {
      return { error: "Invalid owner" };
    }
    if (timestampInSeconds > info[0].expire_timestamp) {
      return { error: "Out of time" };
    }
    
    // Check if type property exists in the interface or if it's part of extended data
    const bodyWithType = body as SRC101InputData & { type?: string };
    if(bodyWithType.type != "address" && bodyWithType.type != "txt"){
      return { error: "Unknow type" };
    }
  }

  private static async validateRenew(body: SRC101InputData): Promise<void | TXError> {
    if (!body.hash || !body.tokenid) {
      return { error: "Missing required fields: hash or tokenid" };
    }
    
    const info = await SRC101UtilityService.getSrc101Owner(
      body.hash,
      body.tokenid
    );
    const timestampInSeconds = Math.floor(Date.now() / 1000);
    if (info.length == 0 || info[0].owner != body.sourceAddress) {
      return { error: "Invalid owner" };
    }
    if (timestampInSeconds > info[0].expire_timestamp) {
      return { error: "Out of time" };
    }

    if (!body.dua || isNaN(Number(body.dua))) {
      return { error: "dua must be a number" };
    }
  }

  static validataDeploy_pri(pri: any): boolean {
    try {
      const seenKeys = new Set<string>();
      let valid = true;
      
      if (typeof pri === "object" && pri !== null && !Array.isArray(pri)) {
        for (const [key, value] of Object.entries(pri)) {
          // check key is an integer in the form of a string
          if (!/^\d+$/.test(key)) {
            valid = false;
            break;
          }

          if (seenKeys.has(key)) {
            valid = false;
            break;
          } else {
            seenKeys.add(key);
          }

          if (typeof value !== "number" || !Number.isInteger(value)) {
            valid = false;
            break;
          }
        }
      } else {
        valid = false;
      }

      return valid;
    } catch (_error) {
      return false;
    }
  }

  static checkValidTxHash(txHash: string): boolean {
    const regex = /^[0-9a-fA-F]{64}$/;
    return regex.test(txHash);
  }

  static checkValidBase64String(base64String: string | null): boolean {
    try{
      if (base64String && /^[A-Za-z0-9+/]+={0,2}$/.test(base64String) && base64String.length % 4 === 0) {
        return true;
      }
      return false;
    } catch{
      return false;
    }
  }

  static base64ToUtf8(base64String: string): string | null {
    try {
      const binaryString = atob(base64String);
      const byteArray = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        byteArray[i] = binaryString.charCodeAt(i);
      }
  
      const decoder = new TextDecoder('utf-8');
      return decoder.decode(byteArray);
    } catch (error) {
      console.error('Error during Base64 to UTF-8 conversion:', error);
      return null;
    }
  }

  static checkContainsSpecial(text: string): boolean {
    const specialCharactersPattern = /[`~!@#$%\^\-\+&\*\(\)_\=＝\=|{}":;',\\\[\].·<>\/\?~！@#￥……&*（）——|{}【】《》'；："":','\\\[\].·<>\/\?~！@#￥……&*（）——|{}【】《》'；：""'。，、？\s]/;
    const specialCategories = ["Zs", "Cf"];  // Space separator (Zs) and format (Cf)

    // Check if there's any special character
    const containsSpecialCharacter = specialCharactersPattern.test(text);

    // Check if any character belongs to the special categories using Unicode category
    const containsSpecialCategory = Array.from(text).some((char) => {
      const unicodeCategory = SRC101UtilityService.getUnicodeCategory(char);
      return specialCategories.includes(unicodeCategory);
    });

    return containsSpecialCharacter || containsSpecialCategory || /^\s*$/.test(text);
  }

  static getUnicodeCategory(char: string): string {
    const code = char.codePointAt(0) ?? 0;
    if (SRC101UtilityService.isSpaceSeparator(code)) {
      return "Zs";
    }
    if (SRC101UtilityService.isFormatControl(code)) {
      return "Cf";
    }
    return "Other";
  }

  static isSpaceSeparator(code: number): boolean {
    const spaceCodes = [0x20, 0x09, 0x0A, 0x0D]; // Space, Tab, Line Feed, Carriage Return
    return spaceCodes.includes(code);
  }

  static isFormatControl(code: number): boolean {
    return (code >= 0x00 && code <= 0x1F) || (code === 0x7F);
  }
}
