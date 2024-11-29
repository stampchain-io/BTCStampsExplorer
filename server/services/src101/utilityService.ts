import { convertToEmoji } from "$lib/utils/emojiUtils.ts";
import { Src101Detail, TXError } from "globals";
import { crypto } from "@std/crypto";
import { isValidBitcoinAddress } from "$lib/utils/utxoUtils.ts";
import { SRC101QueryService } from "./queryService.ts";
import { BigFloat } from "bigfloat/mod.ts";
import { ResponseUtil } from "$lib/utils/responseUtil.ts";
import { SRC101InputData } from "$server/types/index.d.ts";

export class SRC101UtilityService {
  static async getDepoyDetails(deploy_hash: string) {
    const info = await SRC101QueryService.getDepoyDetails(deploy_hash);
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

  static async getSrc101Owner(deploy_hash: string, tokenid: string) {
    const queryParams = {
      deploy_hash,
      tokenid,
      index : null,
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
      return ResponseUtil.badRequest("Invalid or missing toAddress", 400);
    }

    if (body.recAddress && !isValidBitcoinAddress(body.recAddress)) {
      return ResponseUtil.badRequest("Invalid or missing recAddress", 400);
    }

    // if (body.fromAddress && !isValidBitcoinAddress(body.fromAddress)) {
    //   return ResponseUtil.badRequest("Invalid or missing fromAddress", 400);
    // }

    if (!body.changeAddress || !isValidBitcoinAddress(body.changeAddress)) {
      return ResponseUtil.badRequest("Invalid or missing changeAddress", 400);
    }
    if (!body.sourceAddress || !isValidBitcoinAddress(body.sourceAddress)) {
      return ResponseUtil.badRequest("Invalid or missing sourceAddress", 400);
    }

    if (!body.feeRate || isNaN(Number(body.feeRate))) {
      return ResponseUtil.badRequest("Invalid or missing feeRate", 400);
    }

    // Operation-specific validations
    switch (operation) {
      case "deploy":
        const deployResult = await this.validateDeploy(body);
        if (deployResult) return deployResult;
        break;

      case "mint":
        const mintResult = await this.validateMint(body);
        if (mintResult) return mintResult;
        break;

      case "transfer":
        const transferResult = await this.validateTransfer(body);
        if (transferResult) return transferResult;
        break;

      case "setrecord":
        const setrecordResult = await this.validateSetRecord(body);
        if (setrecordResult) return setrecordResult;
        break;

      case "renew":
        const renewResult = await this.validateRenew(body);
        if (renewResult) return renewResult;
        break;

      default:
        return ResponseUtil.badRequest("Invalid operation", 400);
    }
  }

  private static async validateDeploy(body: SRC101InputData): Promise<void | TXError> {
    // Validate deploy-specific parameters

    if(!body.root || typeof body.root !== 'string') {
      return ResponseUtil.badRequest("root must be a string", 400);
    }

    if(!body.name || typeof body.name !== 'string') {
      return ResponseUtil.badRequest("name must be a string", 400);
    }

    if(!body.tick || typeof body.tick !== 'string') {
      return ResponseUtil.badRequest("tick must be a string", 400);
    }

    if(!body.desc || typeof body.desc !== 'string') {
      return ResponseUtil.badRequest("desc must be a string", 400);
    }

    if(!body.wla || typeof body.wla !== 'string') {
      return ResponseUtil.badRequest("wla must be a string", 400);
    }

    if (!Array.isArray(body.rec) || !body.rec.every(item => typeof item === 'string')){
      return ResponseUtil.badRequest("rec must be a array and the address in the rec must be valid address", 400);
    }

    if (!SRC101UtilityService.validataDeploy_pri(body.pri)){
      return ResponseUtil.badRequest("pri must be a json like {0:45000,1:-1,2:-1,3:900000,4:225000}", 400);
    }

    if (!body.lim || isNaN(Number(body.lim))) {
      return ResponseUtil.badRequest("lim must be a number", 400);
    }
    if (!body.mintstart || isNaN(Number(body.mintstart))) {
      return ResponseUtil.badRequest("mintstart must be a number", 400);
    }
    if (!body.mintend || isNaN(Number(body.mintend))) {
      return ResponseUtil.badRequest("mintend must be a number", 400);
    }
    if (!body.idua || isNaN(Number(body.idua))) {
      return ResponseUtil.badRequest("idua need and must be a number", 400);
    }

    if (!body.owner || !isValidBitcoinAddress(body.owner)) {
      return ResponseUtil.badRequest("Invalid owner", 400);
    }

    if (!body.imglp || !/^https?:\/\/[^\s/$.?#].[^\s]*$/.test(body.imglp)) {
      return ResponseUtil.badRequest("Invalid website URL", 400);
    }

  }

  private static async validateMint(body: SRC101InputData): Promise<void | TXError> {
    if (!body.toaddress || !isValidBitcoinAddress(body.toaddress)) {
      return ResponseUtil.badRequest("Invalid or missing toaddress", 400);
    }

    if (!body.hash || !SRC101UtilityService.checkValidTxHash(body.hash)){
      return ResponseUtil.badRequest("Invalid deployHash", 400);
    }

    //check tokenid
    if (!Array.isArray(body.tokenid)) {
      return ResponseUtil.badRequest("tokenid must be an array", 400);
    }
    for (const item of body.tokenid) {
      if (typeof item !== "string") {
        return ResponseUtil.badRequest("Each item in tokenid array must be a string", 400);
      }
      console.log("item", item)
      if (!SRC101UtilityService.checkValidBase64String(item)) {
        return ResponseUtil.badRequest(`Invalid Base64 string: ${item}`, 400);
      }
      const item_utf8 = SRC101UtilityService.base64ToUtf8(item);
      if ( !item_utf8 || SRC101UtilityService.checkContainsSpecial(item_utf8)) {
        return ResponseUtil.badRequest(`Contains special characters: ${item}`, 400);
      }

      if (body.dua && isNaN(Number(body.dua))) {
        return ResponseUtil.badRequest("dua must be a number", 400);
      }

      if (body.coef && isNaN(Number(body.coef))) {
        return ResponseUtil.badRequest("coef must be a number, default 1000", 400);
      }
    }

    const timestampInSeconds = Math.floor(Date.now() / 1000);
    const info = await SRC101UtilityService.getDepoyDetails(body.hash);
    if (timestampInSeconds < info.mintstart || timestampInSeconds > info.mintend) {
      return ResponseUtil.badRequest("Out of time", 400);
    }
  }

  private static async validateTransfer(body: SRC101InputData): Promise<void | TXError> {
    if (!body.toaddress || !isValidBitcoinAddress(body.toaddress)) {
      return ResponseUtil.badRequest("Invalid or missing toaddress", 400);
    }
    const info = await SRC101UtilityService.getSrc101Owner(
      body.hash,
      body.tokenid
    );
    console.log("validateTransfer", info)
    const timestampInSeconds = Math.floor(Date.now() / 1000);
    if (info.length == 0 || info[0].owner != body.sourceAddress) {
      return ResponseUtil.badRequest("Invalid owner", 400);
    }

    if (timestampInSeconds > info.expire_timestamp) {
      return ResponseUtil.badRequest("Out of time", 400);
    }
  }

  private static async validateSetRecord(body: SRC101InputData): Promise<void | TXError> {
    const info = await SRC101UtilityService.getSrc101Owner(
      body.hash,
      body.tokenid
    );
    const timestampInSeconds = Math.floor(Date.now() / 1000);
    if (info.length == 0 || info[0].owner != body.sourceAddress) {
      return ResponseUtil.badRequest("Invalid owner", 400);
    }
    if (timestampInSeconds > info.expire_timestamp) {
      return ResponseUtil.badRequest("Out of time", 400);
    }
    if(body.type != "address" && body.type != "txt"){
      return ResponseUtil.badRequest("Unknow type", 400);
    }
  }

  private static async validateRenew(body: SRC101InputData): Promise<void | TXError> {
    const info = await SRC101UtilityService.getSrc101Owner(
      body.hash,
      body.tokenid
    );
    const timestampInSeconds = Math.floor(Date.now() / 1000);
    if (info.length == 0 || info[0].owner != body.sourceAddress) {
      return ResponseUtil.badRequest("Invalid owner", 400);
    }
    if (timestampInSeconds > info.expire_timestamp) {
      return ResponseUtil.badRequest("Out of time", 400);
    }

    if (!body.dua || isNaN(Number(body.dua))) {
      return ResponseUtil.badRequest("dua must be a number", 400);
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
    } catch (error) {
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

  static base64ToUtf8(base64String: string): any {
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
    const specialCharactersPattern = /[`~!@#$%\^\-\+&\*\(\)_\=＝\=|{}":;',\\\[\].·<>\/\?~！@#￥……&*（）——|{}【】《》'；：“”‘。，、？\s]/;
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
