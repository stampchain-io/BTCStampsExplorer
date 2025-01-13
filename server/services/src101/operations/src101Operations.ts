import { SRC101Service } from "$server/services/src101/index.ts";
import type { IDeploySRC101, IMintSRC101, ITransferSRC101, ISetrecordSRC101, IRenewSRC101, IPrepareSRC101TX } from "$types/index.d.ts";

interface SRC101Operation {
  op: string;
  p: "SRC-101";
  [key: string]: unknown;
}

export class SRC101OperationService {
  private static async executeSRC101Operation<T extends IPrepareSRC101TX>(
    params: T,
    checkParams: (params: T) => void,
    createOperationObject: (params: T) => SRC101Operation,
    additionalChecks: (params: T) => Promise<void>,
    resetParams: (params: T) => T,
  ) {
    try {
      checkParams(params);
      await additionalChecks(params);
      params = await resetParams(params);
      console.log("resetParams", params);
      const operationObject = createOperationObject(params);
      const transferString = JSON.stringify(operationObject);

      const prepare: IPrepareSRC101TX = {
        ...params,
        transferString,
      };
      console.log("prepare",prepare);
      const { psbtHex, inputsToSign } = await SRC101Service.MultisigPSBTService.preparePSBT(prepare);
      return { hex: psbtHex, inputsToSign };
    } catch (error) {
      console.error(error);
      return { error: error.message };
    }
  }

  static async mintSRC101(params: IMintSRC101) {
    return this.executeSRC101Operation(
      params,
      SRC101Service.UtilityService.validateMint,
      ({ hash, toaddress, tokenid, dua, prim, coef, sig, img }) => ({ 
        op: "MINT", 
        p: "SRC-101", 
        hash, 
        toaddress,
        tokenid,
        dua,
        prim,
        coef,
        sig,
        img, 
      }),
      async ({ hash, tokenid }) => {
        const mintInfo = await SRC101Service.UtilityService.getSrc101Owner(hash, tokenid);
        if ( mintInfo.length > 0 ) {
          throw new Error(`Error: deployhash ${hash} token ${tokenid} already minted out`);
        }
      },
      async (params) => {
        if(!params.recAddress){
          try{
            const info = await SRC101Service.UtilityService.getDepoyDetails(params.hash);
            params.recAddress = info[0].recipients[0];
          }
          catch (error){
            throw new Error(`cant getDepoyDetails ${params.hash}`);
          }
        }
        //change tokenid to utf8 and clac price
        try{
          console.log("params.tokenid", params.tokenid);
          const prices = await SRC101Service.UtilityService.getSrc101Price(params.hash);
          const tokenid_utf8 = params.tokenid.map((token) =>  SRC101Service.UtilityService.base64ToUtf8(token));
          let totalPrice = 0;
          tokenid_utf8.forEach(id => {
            const length = id.length;

            if (prices[length] === -1) {
              throw new Error(`Invalid price for token length ${length}: -1`);
            }

            const price = prices.hasOwnProperty(length) ? prices[length] : prices[0];

            if (price === undefined) {
              throw new Error(`No default price (length 0) found for token length ${length}`);
            }

            totalPrice += price;
          });
          params.recVault = totalPrice;
        }
        catch(error){
          console.log(error)
          throw new Error(error.message);
        }
        return params;
      },
    );
  }

  static deploySRC101(params: IDeploySRC101) {
    return this.executeSRC101Operation(
      params,
      SRC101Service.UtilityService.validateDeploy,
      ({ root, name, lim, owner, rec, tick, pri, desc, mintstart, mintend, wla, imglp, imgf, idua }) => ({
        op: "DEPLOY",
        p: "SRC-101",
        root,
        name,
        lim,
        owner,
        rec,
        tick,
        pri,
        desc,
        mintstart,
        mintend,
        wla,
        imglp,
        imgf,
        idua,
      }),
      async () => {
      },
      async (params) =>{
        return params;
      },
    );
  }

  static transferSRC101(params: ITransferSRC101) {
    return this.executeSRC101Operation(
      params,
      SRC101Service.UtilityService.validateTransfer,
      ({ hash, toaddress, tokenid }) => ({ 
          op: "TRANSFER", 
          p: "SRC-101", 
          hash, 
          toaddress,
          tokenid, 
        }),
      async ({}) => {
      },
      async (params) =>{
        return params;
      },
    );
  }

  static setrecordSRC101(params: ISetrecordSRC101){
    return this.executeSRC101Operation(
      params,
      SRC101Service.UtilityService.validateTransfer,
      ({ hash, tokenid, type, data, prim }) => ({ 
          op: "SETRECORD", 
          p: "SRC-101", 
          hash, 
          tokenid, 
          type, 
          data, 
          prim, 
        }),
      async ({}) => {
      },
      async (params) =>{
        return params;
      },
    );
  }

  static renewSRC101(params: IRenewSRC101){
    return this.executeSRC101Operation(
      params,
      SRC101Service.UtilityService.validateTransfer,
      ({ hash, tokenid, dua }) => ({ 
          op: "RENEW", 
          p: "SRC-101", 
          hash, 
          tokenid, 
          dua, 
        }),
      async ({}) => {
      },
      async (params) =>{
        return params;
      },
    );
  }
}
