import { SRC101Service } from "$server/services/src101/index.ts";
import { SRC101Repository } from "$server/database/src101Repository.ts";
import {
  SRC101TokenidsParams,
  SRC101OwnerParams,
  SRC101TxParams,
  SRC101ValidTxTotalCountParams,
  SRC101BalanceParams,
} from "$globals";
import { StampService } from "$server/services/stampService.ts";
import { BlockService } from "$server/services/blockService.ts";
import { unicodeEscapeToEmoji } from "$lib/utils/emojiUtils.ts";
import { paginate } from "$lib/utils/paginationUtils.ts";

export class Src101Controller{
  static async handleSrc101TXFromSRC101Table(
    params: SRC101TxParams,
  ){
    try{
      const [lastBlock, txs, totalCount] = await Promise.all([
        BlockService.getLastBlock(),
        SRC101Service.QueryService.getSrc101TXFromSRC101Table(params),
        SRC101Service.QueryService.getTotalSrc101TXFromSRC101TableCount(params),
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
      console.error("Error processing SRC101 request:", error);
      // Return an empty response instead of throwing an error
      return {
        last_block: await BlockService.getLastBlock(),
      };
    }
  }

  static async handleValidSrc101TxRequest(
    params:SRC101ValidTxTotalCountParams,
  ){
    try{
      const [lastBlock, txs, totalCount] = await Promise.all([
        BlockService.getLastBlock(),
        SRC101Service.QueryService.getValidSrc101Tx(params),
        SRC101Service.QueryService.getTotalValidSrc101TxCount(params),
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
        SRC101Service.QueryService.getDepoyDetails(deploy_hash),
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
        SRC101Service.QueryService.getTotalCount(deploy_hash),
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
        SRC101Service.QueryService.getSrc101Balance(params),
        SRC101Service.QueryService.getSrc101BalanceTotalCount(params),
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
      const [lastBlock, owner, totalCount] = await Promise.all([
        BlockService.getLastBlock(),
        SRC101Service.QueryService.getSrc101Owner(params),
        SRC101Service.QueryService.getSrc101OwnerCount(params),
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
        SRC101Service.QueryService.getSrc101Tokenids(params),
        SRC101Service.QueryService.getTotalSrc101TokenidsCount(params),
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