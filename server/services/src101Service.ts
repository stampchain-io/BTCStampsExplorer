import { SRC101Repository } from "$server/database/src101Repository.ts";
import { SRC101TokenidsParams, SRC101OwnerParams, SRC101ValidTxParams, SRC101ValidTxTotalCountParams, Src101BalanceParams } from "globals";

export class Src101Service {
  static async getTotalValidSrc101TxCount(
    params:SRC101ValidTxTotalCountParams,
  ){
    try{
      return await SRC101Repository.getTotalValidSrc101TxCount(params);
    } catch (error) {
      console.error("Error getting Valid SRC101 Tx:", error);
      throw error;
    }
  }

  static async getValidSrc101Tx(
    params:SRC101ValidTxParams,
  ){
    try{
      return await SRC101Repository.getValidSrc101Tx(params);
    } catch (error) {
      console.error("Error getting Valid SRC101 Tx:", error);
      throw error;
    }
  }

  static async getSrc101Balance(
    params: Src101BalanceParams,

  ){
    try{
      return await SRC101Repository.getSrc101Balance(params);
    } catch (error) {
      console.error("Error getting Valid SRC101 Tx:", error);
      throw error;
    }
  }

  static async getSrc101BalanceTotalCount(
    params: Src101BalanceParams,

  ){
    try{
      return await SRC101Repository.getSrc101BalanceTotalCount(params);
    } catch (error) {
      console.error("Error getting Valid SRC101 Tx:", error);
      throw error;
    }
  }

  static async getDepoyDetails(
    deploy_hash: string,
  ){
    try{
      return await SRC101Repository.getDepoyDetails(deploy_hash);
    } catch (error) {
      console.error("Error getting SRC101 owner:", error);
      throw error;
    }
  }

  static async getTotalCount(
    deploy_hash: string,
  ){
    try{
      return await SRC101Repository.getTotalCount(deploy_hash);
    } catch (error) {
      console.error("Error getting SRC101 owner:", error);
      throw error;
    }
  }

  static async getSrc101Owner(
    params:SRC101OwnerParams,
  ){
    try{
      if(params.tokenid){
        params.tokenid = decodeURIComponent(params.tokenid);
        params.tokenid = params.tokenid.replace(/-/g, "+").replace(/_/g, "/");
      }
      return await SRC101Repository.getSrc101Owner(params);
    } catch (error) {
      console.error("Error getting SRC101 owner:", error);
      throw error;
    }
  }

  static async getTotalSrc101TokenidsCount(
    params: Partial<SRC101TokenidsParams>,
  ): Promise<number> {
    try {
      return await SRC101Repository.getTotalSrc101TokenidsCount(params);
    } catch (error) {
      console.error("Error getting total SRC101 tokenids count:", error);
      throw error;
    }
  }

  static async getSrc101Tokenids( 
    params: SRC101TokenidsParams,
  ){
    try {
      return await SRC101Repository.getSrc101Tokenids(params);
    } catch (error) {
      console.error("Error getting total SRC101 tokenids count:", error);
      throw error;
    }
  }
}