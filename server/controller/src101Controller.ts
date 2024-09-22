import { Src101Service } from "$server/services/src101Service.ts";
import { SRC101Repository } from "$server/database/src101Repository.ts";
import {
  SRC101TokenidsParams,
  SRC101OwnerParams,
  SRC101ValidTxTotalCountParams,
  SRC101BalanceParams,
} from "globals";
import { StampService } from "$server/services/stampService.ts";
import { getBtcAddressInfo } from "$lib/utils/btc.ts";
import { BlockService } from "$server/services/blockService.ts";
import { convertToEmoji, paginate } from "$lib/utils/util.ts";

export class Src101Controller{
  static async handleValidSrc101TxRequest(
    params:SRC101ValidTxTotalCountParams,
  ){
    try{
      const [lastBlock, txs, totalCount] = await Promise.all([
        BlockService.getLastBlock(),
        Src101Service.getValidSrc101Tx(params),
        Src101Service.getTotalValidSrc101TxCount(params),
      ]);
      let restructuredResult: any = {
        last_block: lastBlock,
      };
      const limit = params.limit;
      const page = params.page;
      restructuredResult = {
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
        total: totalCount,
        ...restructuredResult,
      };
      restructuredResult.data = txs;
      return restructuredResult;
    } catch (error) {
      console.error("Error processing SRC101 Owner request:", error);
      // Return an empty response instead of throwing an error
      return {
        last_block: await BlockService.getLastBlock(),
      };
    }
  }

  static async handleSrc101DeployDetailsRequest(
    deploy_hash:string,
  ){
    try{
      const [lastBlock, details] = await Promise.all([
        BlockService.getLastBlock(),
        Src101Service.getDepoyDetails(deploy_hash),
      ]);
  
      let restructuredResult: any = {
        last_block: lastBlock,
      };
  
      restructuredResult.data = details;
      return restructuredResult;
    } catch (error) {
      console.error("Error processing SRC101 Owner request:", error);
      // Return an empty response instead of throwing an error
      return {
        last_block: await BlockService.getLastBlock(),
        data: deploy_hash ? {} : [],
      };
    }
  }

  static async handleSrc101TotalCountRequest(
    deploy_hash:string,
  ){
    try{
      const [lastBlock, totalCount] = await Promise.all([
        BlockService.getLastBlock(),
        Src101Service.getTotalCount(deploy_hash),
      ]);
  
      let restructuredResult: any = {
        last_block: lastBlock,
      };
  
      restructuredResult.data = totalCount;
      return restructuredResult;
    } catch (error) {
      console.error("Error processing SRC101 Owner request:", error);
      // Return an empty response instead of throwing an error
      return {
        last_block: await BlockService.getLastBlock(),
        data: deploy_hash ? {} : [],
      };
    }
  }

  static async handleSrc101BalanceRequest(
    params: SRC101BalanceParams,
  ){
    try{
      const [lastBlock, balance, totalCount] = await Promise.all([
        BlockService.getLastBlock(),
        Src101Service.getSrc101Balance(params),
        Src101Service.getSrc101BalanceTotalCount(params),
      ]);
  
      let restructuredResult: any = {
        last_block: lastBlock,
      };
      const limit = params.limit;
      const page = params.page;
      restructuredResult = {
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
        total: totalCount,
        ...restructuredResult,
      };
      restructuredResult.data = balance;
      return restructuredResult;
    } catch (error) {
      console.error("Error processing SRC101 Owner request:", error);
      console.error("Params:", JSON.stringify(params));
      // Return an empty response instead of throwing an error
      return {
        last_block: await BlockService.getLastBlock(),
        data: params.deploy_hash && params.tokenid && params.index ? {} : [],
      };
    }
  }

  static async handleSrc101OwnerRequest(
    params: SRC101OwnerParams,
  ){
    try{
      const [lastBlock, owner] = await Promise.all([
        BlockService.getLastBlock(),
        Src101Service.getSrc101Owner(params),
      ]);
  
      let restructuredResult: any = {
        last_block: lastBlock,
      };
  
      restructuredResult.data = owner;
      return restructuredResult;
    } catch (error) {
      console.error("Error processing SRC101 Owner request:", error);
      console.error("Params:", JSON.stringify(params));
      // Return an empty response instead of throwing an error
      return {
        last_block: await BlockService.getLastBlock(),
        data: params.deploy_hash && params.tokenid && params.index ? {} : [],
      };
    }
  }

  static async handleSrc101TokenidsRequest(
    params: SRC101TokenidsParams,
  ) {
    try{
      const [lastBlock, tokenids, totalCount] = await Promise.all([
        BlockService.getLastBlock(),
        Src101Service.getSrc101Tokenids(params),
        Src101Service.getTotalSrc101TokenidsCount(params),
      ]);
  
      let restructuredResult: any = {
        last_block: lastBlock,
      };

      if (!params.prim) {
        const limit = params.limit ||
        (Array.isArray(tokenids) ? tokenids.length : 0);
        const page = params.page || 1;
        restructuredResult = {
          page,
          limit,
          totalPages: Math.ceil(totalCount / limit),
          total: totalCount,
          ...restructuredResult,
        };
      }
  
      restructuredResult.data = tokenids;
  
      return restructuredResult;
    } catch (error) {
      console.error("Error processing SRC101 tokenids request:", error);
      console.error("Params:", JSON.stringify(params));
      // Return an empty response instead of throwing an error
      return {
        last_block: await BlockService.getLastBlock(),
        data: params.deploy_hash && params.address_btc ? {} : [],
      };
    }
  }
}