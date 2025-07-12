import { SRC101Service } from "$server/services/src101/index.ts";
import {
  SRC101TokenidsParams,
  SRC101OwnerParams,
  SRC101TxParams,
  SRC101ValidTxTotalCountParams,
  Src101BalanceParams,
} from "$globals";
import { BlockService } from "$server/services/blockService.ts";

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
      const limit = params.limit || 50;
      const page = params.page;
      const restructuredResult: any = {
        last_block: lastBlock,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
        total: totalCount,
        data: txs,
      };
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
      const limit = params.limit || 50;
      const page = params.page;
      const restructuredResult: any = {
        last_block: lastBlock,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
        total: totalCount,
        data: txs,
      };
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
        SRC101Service.QueryService.getDeployDetails(deploy_hash),
      ]);
  
      const restructuredResult: any = {
        last_block: lastBlock,
        data: details,
      };
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
  
      const restructuredResult: any = {
        last_block: lastBlock,
        data: totalCount,
      };
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
    params: Src101BalanceParams,
  ){
    try{
      const [lastBlock, balance, totalCount] = await Promise.all([
        BlockService.getLastBlock(),
        SRC101Service.QueryService.getSrc101Balance(params),
        SRC101Service.QueryService.getSrc101BalanceTotalCount(params),
      ]);
  
      const limit = params.limit || 50;
      const page = params.page;
      const restructuredResult: any = {
        last_block: lastBlock,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
        total: totalCount,
        data: balance,
      };
      return restructuredResult;
    } catch (error) {
      console.error("Error processing SRC101 Owner request:", error);
      console.error("Params:", JSON.stringify(params));
      // Return an empty response instead of throwing an error
      return {
        last_block: await BlockService.getLastBlock(),
        data: (params as any).deploy_hash && (params as any).tokenid && (params as any).index ? {} : [],
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
  
      const limit = params.limit || 50;
      const page = params.page;
      const restructuredResult: any = {
        last_block: lastBlock,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
        total: totalCount,
        data: owner,
      };
      return restructuredResult;
    } catch (error) {
      console.error("Error processing SRC101 Owner request:", error);
      console.error("Params:", JSON.stringify(params));
      // Return an empty response instead of throwing an error
      return {
        last_block: await BlockService.getLastBlock(),
        data: (params as any).deploy_hash && (params as any).tokenid && (params as any).index ? {} : [],
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
        data: (params as any).deploy_hash && (params as any).address_btc ? {} : [],
      };
    }
  }
}