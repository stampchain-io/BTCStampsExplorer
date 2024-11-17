import { serverConfig } from "$server/config/config.ts";
import { bigFloatToString } from "$lib/utils/formatUtils.ts";
import {
  BIG_LIMIT,
  SRC101_OWNERS_TABLE,
  SRC101_TABLE,
  SRC101_ALL_TABLE,
  SRC101_RECIPIENTS_TABLE,
} from "$lib/utils/constants.ts";

import {
  SRC101ValidTxTotalCountParams,
  SRC101TxParams,
  SRC101ValidTxParams,
  SRC101TokenidsParams,
  SRC101OwnerParams,
  Src101BalanceParams,
} from "globals";

import { dbManager } from "$server/database/databaseManager.ts";

export class SRC101Repository {
  static async getTotalSrc101TXFromSRC101TableCount(
    params:SRC101TxParams
  ){
    const queryParams = [];
    const whereConditions = [];

    if (params.tick) {
      whereConditions.push(`tick COLLATE utf8mb4_0900_as_ci = ?`);
      queryParams.push(params.tick);
    }

    if (params.op) {
      whereConditions.push(`op = ?`);
      queryParams.push(params.op);
    }

    if (params.block_index) {
      whereConditions.push(`block_index = ?`);
      queryParams.push(params.block_index);
    }

    if (params.deploy_hash) {
      whereConditions.push(`deploy_hash = ?`);
      queryParams.push(params.deploy_hash);
    }

    if (params.valid == 1) {
      whereConditions.push(`src101.status IS NULL`);
    } else if (params.valid == 0) {
      whereConditions.push(`src101.status IS NOT NULL`);
    }

    let sqlQuery = `
        SELECT COUNT(*) AS total
        FROM ${SRC101_ALL_TABLE} src101
    `;

    if (whereConditions.length > 0) {
      sqlQuery += ` WHERE ` + whereConditions.join(" AND ");
    }
    var results = (await dbManager.executeQueryWithCache(
      sqlQuery,
      queryParams,
      1000 * 60 * 2,
    )).rows;
    return results[0].total;
  }

  static async getSrc101TXFromSRC101Table(
    params:SRC101TxParams
  ){
    const queryParams = [];
    let whereClause = "";

    if (params.block_index) {
      whereClause += `src101.block_index = ?`;
      queryParams.push(params.block_index);
    }

    if (params.tick) {
      whereClause += (whereClause ? " AND " : "") + `src101.tick = ?`;
      queryParams.push(params.tick);
    }   
     
    if (params.op) {
      whereClause += (whereClause ? " AND " : "") + `src101.op = ?`;
      queryParams.push(params.op);
    }

    if (params.deploy_hash) {
      whereClause += (whereClause ? " AND " : "") + `src101.deploy_hash = ?`;
      queryParams.push(params.deploy_hash);
    }

    if (params.valid == 1) {
      whereClause += (whereClause ? " AND " : "") + `src101.status IS NULL`;
    } else if (params.valid == 0) {
      whereClause += (whereClause ? " AND " : "") + `src101.status IS NOT NULL`;
    }

    const offset = params.limit && params.page ? Number(params.limit) * (Number(params.page) - 1) : 0;
    if (params.limit) {
      queryParams.push(params.limit, offset);
    }
    const validOrder = "ASC";

    const sqlQuery = `
      SELECT 
        (@row_number:=@row_number + 1) AS row_num,
        src101.tx_hash,
        src101.block_index,
        src101.p,
        src101.op,
        src101.root,
        src101.name,
        src101.tokenid_origin,
        src101.tokenid,
        src101.tokenid_utf8,
        src101.description,
        src101.tick,
        src101.wla,
        src101.imglp,
        src101.imgf,
        src101.deploy_hash,
        src101.creator,
        src101.pri,
        src101.dua,
        src101.lim,
        src101.coef,
        src101.owner,
        src101.mintstart,
        src101.mintend,
        src101.toaddress,
        src101.destination,
        src101.destination_nvalue,
        src101.block_time,
        src101.status
      FROM
        ${SRC101_ALL_TABLE} src101
      CROSS JOIN
        (SELECT @row_number := ?) AS init
      ${whereClause ? `WHERE ${whereClause}` : ""}
      ORDER BY 
        src101.tx_index ${validOrder}
      ${params.limit ? `LIMIT ? OFFSET ?` : ""};
    `;

    queryParams.unshift(offset);

    return (await dbManager.executeQueryWithCache(
      sqlQuery,
      queryParams,
      1000 * 60 * 2,
    )).rows.map((result) => {
      return {
        ...result,
      };
    })
  }

  static async getTotalValidSrc101TxCount(
    params:SRC101ValidTxTotalCountParams
  ) {
    const queryParams = [];
    const whereConditions = [];

    if (params.tick) {
      whereConditions.push(`tick COLLATE utf8mb4_0900_as_ci = ?`);
      queryParams.push(params.tick);
    }

    if (params.op) {
      whereConditions.push(`op = ?`);
      queryParams.push(params.op);
    }

    if (params.block_index) {
      whereConditions.push(`block_index = ?`);
      queryParams.push(params.block_index);
    }

    if (params.deploy_hash) {
      whereConditions.push(`deploy_hash = ?`);
      queryParams.push(params.deploy_hash);
    }

    if (params.address) {
      whereConditions.push(`address = ?`);
      queryParams.push(params.address);
    }

    if (params.tx_hash) {
      whereConditions.push(`tx_hash = ?`);
      queryParams.push(params.tx_hash);
    }

    let sqlQuery = `
        SELECT COUNT(*) AS total
        FROM ${SRC101_TABLE}
    `;

    if (whereConditions.length > 0) {
      sqlQuery += ` WHERE ` + whereConditions.join(" AND ");
    }
    var results = (await dbManager.executeQueryWithCache(
      sqlQuery,
      queryParams,
      1000 * 60 * 2,
    )).rows;
    return results[0].total;
  }

  static async getDepoyDetails(
    deploy_hash: string,
  ) {
    let sqlQuery = `
    SELECT 
      address
    FROM
      ${SRC101_RECIPIENTS_TABLE}
    WHERE deploy_hash = ?;
    `;
    const recipients = (await dbManager.executeQueryWithCache(
      sqlQuery,
      [deploy_hash],
      1000 * 60 * 2, // Cache duration
    )).rows.map((result) => (
      result["address"],
    ));;

    const queryParams = [];
    let whereClause = "";
    whereClause += `tx_hash = ?`;
    queryParams.push(deploy_hash);
    sqlQuery = `
    SELECT 
      tx_hash,
      block_index,
      p,
      op,
      root,
      name,
      description,
      tick,
      tick_hash,
      wla,
      imglp,
      imgf,
      creator,
      pri,
      lim,
      mintstart,
      mintend,
      owner,
      block_time
    FROM
      ${SRC101_TABLE}
      ${whereClause ? `WHERE ${whereClause}` : ""}
    LIMIT 1;
    `;

    const results = (await dbManager.executeQueryWithCache(
      sqlQuery,
      queryParams,
      1000 * 60 * 2, // Cache duration
    )).rows.map((result) => {
      result["mintstart"] = Number.parseInt(result["mintstart"].toString())
      result["mintend"] = Number.parseInt(result["mintend"].toString())
      return ({
        ...result,
        recipients,
      });
    });;
    return results;
  }

  static async getTotalCount(
    deploy_hash: string,
  ) {
    let sqlQuery = `
    SELECT 
      COUNT(*)
    FROM
      ${SRC101_OWNERS_TABLE}
    WHERE deploy_hash = ?;
    `;
    const total = (await dbManager.executeQueryWithCache(
      sqlQuery,
      [deploy_hash],
      1000 * 60 * 2, // Cache duration
    )).rows[0]["COUNT(*)"];
    return total
  }

  static async getValidSrc101Tx(
    params:SRC101ValidTxParams
  ) {
    const queryParams = [];
    let whereClause = "";

    if (params.block_index) {
      whereClause += `src101.block_index = ?`;
      queryParams.push(params.block_index);
    }

    if (params.tick) {
      whereClause += (whereClause ? " AND " : "") + `src101.tick = ?`;
      queryParams.push(params.tick);
    }

    if (params.op) {
      whereClause += (whereClause ? " AND " : "") + `src101.op = ?`;
      queryParams.push(params.op);
    }

    if (params.deploy_hash) {
      whereClause += (whereClause ? " AND " : "") + `src101.deploy_hash = ?`;
      queryParams.push(params.deploy_hash);
    }

    if (params.tx_hash) {
      whereClause += (whereClause ? " AND " : "") + `src101.tx_hash = ?`;
      queryParams.push(params.tx_hash);
    }

    if (params.address) {
      whereClause += (whereClause ? " AND " : "") +
        `(src101.creator = ? OR src101.destination = ?)`;
      queryParams.push(params.address, params.address);
    }

    const offset = params.limit && params.page ? Number(params.limit) * (Number(params.page) - 1) : 0;
    if (params.limit) {
      queryParams.push(params.limit, offset);
    }

    const validOrder = "ASC";
    const sqlQuery = `
      SELECT 
        (@row_number:=@row_number + 1) AS row_num,
        src101.tx_hash,
        src101.block_index,
        src101.p,
        src101.op,
        src101.name,
        src101.tokenid,
        src101.tokenid_utf8,
        src101.description,
        src101.tick,
        src101.tick_hash,
        src101.wla,
        src101.imglp,
        src101.imgf,
        src101.deploy_hash,
        src101.creator,
        src101.pri,
        src101.dua,
        src101.lim,
        src101.mintstart,
        src101.mintend,
        src101.owner,
        src101.toaddress,
        src101.destination,
        src101.block_time
      FROM
        ${SRC101_TABLE} src101
      CROSS JOIN
        (SELECT @row_number := ?) AS init
      ${whereClause ? `WHERE ${whereClause}` : ""}
      ORDER BY 
        src101.tx_index ${validOrder}
      ${params.limit ? `LIMIT ? OFFSET ?` : ""};
    `;

    queryParams.unshift(offset);
    
    return (await dbManager.executeQueryWithCache(
      sqlQuery,
      queryParams,
      1000 * 60 * 2,
    )).rows.map((result) => {
      result["mintstart"] = result["mintstart"] ? Number.parseInt(result["mintstart"].toString()) : 0
      result["mintend"] = result["mintend"] ? Number.parseInt(result["mintend"].toString()) : 0
      return {
        ...result,
      };
    })
  }

  static async getSrc101BalanceTotalCount(
    params: Src101BalanceParams,
  ){
    {
      const queryParams = [];
      const whereClauses = [];
  
      if (params.address) {
        whereClauses.push(`owner = ?`);
        queryParams.push(params.address);
      }
  
      const sqlQuery = `
        SELECT COUNT(*)
        FROM ${SRC101_OWNERS_TABLE}
        WHERE ${whereClauses.join(" AND ")}
      `;
  
      const total = (await dbManager.executeQueryWithCache(
        sqlQuery,
        queryParams,
        1000 * 60 * 2, // Cache duration
      )).rows[0]["COUNT(*)"];
      return total
    }
  }

  static async getSrc101Balance(
    params: Src101BalanceParams,
  ) {
    const queryParams = [];
    const whereClauses = [];

    if (params.address) {
      whereClauses.push(`owner = ?`);
      queryParams.push(params.address);
    }

    const offset = params.limit && params.page ? Number(params.limit) * (Number(params.page) - 1) : 0;
    queryParams.push(params.limit, offset); // Add limit and offset at the end

    const validOrder = ["ASC", "DESC"].includes(params.sort.toUpperCase())
      ? params.sort.toUpperCase()
      : "ASC";

    const sqlQuery = `
      SELECT deploy_hash, p, tokenid, tokenid_utf8, owner, txt_data, expire_timestamp, img, address_btc, address_eth, prim
      FROM ${SRC101_OWNERS_TABLE}
      WHERE ${whereClauses.join(" AND ")}
      ORDER BY last_update ${validOrder}
      ${params.limit ? `LIMIT ? OFFSET ?` : ""}
    `;

    const results = (await dbManager.executeQueryWithCache(
      sqlQuery,
      queryParams,
      1000 * 60 * 2, // Cache duration
    )).rows.map((result) => ({
      ...result,
    }));;
    return results;
  }

  static async getTotalSrc101TokenidsCount(
      params: SRC101TokenidsParams
    ) {
      const {
        deploy_hash,
        address_btc,
        prim
      } = params;
      const queryParams = [];
      const whereClauses = [];
  
      if (deploy_hash) {
        whereClauses.push(`deploy_hash = ?`);
        queryParams.push(deploy_hash);
      }
      if (address_btc) {
        whereClauses.push(`address_btc = ?`);
        queryParams.push(address_btc);
      }
      whereClauses.push(`prim = ?`);
      queryParams.push(prim);
  
      whereClauses.push(`expire_timestamp > ?`);
      queryParams.push(new Date().getTime() / 1000);
  
      const sqlQuery = `
      SELECT COUNT(*) AS total
      FROM ${SRC101_OWNERS_TABLE}
      WHERE ${whereClauses.join(" AND ")}
    `;
  
      const results = (await dbManager.executeQueryWithCache(
        sqlQuery,
        queryParams,
        1000 * 60 * 2, // Cache duration
      )).rows;
      return results[0].total;
    }

  static async getSrc101Tokenids(
    params: SRC101TokenidsParams
  ) {
    const {
      deploy_hash,
      address_btc,
      prim,
      limit,
      page,
      sort: sort = "DESC",
    } = params;
    const queryParams = [];
    const whereClauses = [];

    if (deploy_hash) {
      whereClauses.push(`deploy_hash = ?`);
      queryParams.push(deploy_hash);
    }
    if (address_btc) {
      whereClauses.push(`address_btc = ?`);
      queryParams.push(address_btc);
    }
    whereClauses.push(`prim = ?`);
    queryParams.push(prim);

    whereClauses.push(`expire_timestamp > ?`);
    queryParams.push(new Date().getTime() / 1000);

    let limitOffsetClause = "";
    if (limit !== undefined) {
      const safePage = Math.max(1, Number(page || 1));
      const safeLimit = Number(limit);
      const offset = safeLimit * (safePage - 1);
      limitOffsetClause = "LIMIT ? OFFSET ?";
      queryParams.push(safeLimit, offset);
    }

    const validOrder = ["ASC", "DESC"].includes(sort.toUpperCase())
      ? sort.toUpperCase()
      : "DESC";

    const sqlQuery = `
    SELECT tokenid_utf8
    FROM ${SRC101_OWNERS_TABLE}
    WHERE ${whereClauses.join(" AND ")}
    ORDER BY last_update ${validOrder}
    ${limitOffsetClause}
  `;

    const results = (await dbManager.executeQueryWithCache(
      sqlQuery,
      queryParams,
      1000 * 60 * 2, // Cache duration
    )).rows;
    return results;
  }

  static async searchSrc101Owner(
    deploy_hash: string,
    tokenid_utf8: string,
    index: number,
    limit = BIG_LIMIT,
    page = 0,
    sort = "ASC",
  ) {
    const queryParams = [];
    const whereClauses = [];

    if (deploy_hash) {
      whereClauses.push(`deploy_hash = ?`);
      queryParams.push(deploy_hash);
    }
    if (tokenid_utf8) {
      whereClauses.push(`tokenid_utf8 like ?`);
      queryParams.push('%'+ tokenid_utf8 + '%');
    }

    if (index) {
      whereClauses.push(`${SRC101_OWNERS_TABLE}.index = ?`);
      queryParams.push(index);
    }

    const offset = limit && page ? Number(limit) * (Number(page) - 1) : 0;
    queryParams.push(limit, offset); // Add limit and offset at the end

    const validOrder = ["ASC", "DESC"].includes(sort.toUpperCase())
      ? sort.toUpperCase()
      : "ASC";

    const sqlQuery = `
      SELECT ${SRC101_OWNERS_TABLE}.index, deploy_hash, p, tokenid, tokenid_utf8, owner, img, address_btc, address_eth, prim, txt_data, expire_timestamp
      FROM ${SRC101_OWNERS_TABLE}
      WHERE ${whereClauses.join(" AND ")}
      ORDER BY last_update ${validOrder}
      ${limit ? `LIMIT ? OFFSET ?` : ""}
    `;

    const results = (await dbManager.executeQueryWithCache(
      sqlQuery,
      queryParams,
      1000 * 60 * 2, // Cache duration
    )).rows.map((result) => ({
      ...result,
    }));;
    return results;
  }

  static async getSrc101Owner(
    params:SRC101OwnerParams
  ) {
    const queryParams = [];
    const whereClauses = [];
    if (params.deploy_hash) {
      whereClauses.push(`deploy_hash = ?`);
      queryParams.push(params.deploy_hash);
    }
    if (params.tokenid) {
      whereClauses.push(`tokenid = ?`);
      queryParams.push(params.tokenid);
    }

    if (params.index) {
      whereClauses.push(`${SRC101_OWNERS_TABLE}.index = ?`);
      queryParams.push(params.index);
    }

    const offset = params.limit && params.page ? Number(params.limit) * (Number(params.page) - 1) : 0;
    queryParams.push(params.limit, offset); // Add limit and offset at the end

    const validOrder = ["ASC", "DESC"].includes(params.sort.toUpperCase())
      ? params.sort.toUpperCase()
      : "ASC";

    const sqlQuery = `
      SELECT ${SRC101_OWNERS_TABLE}.index, deploy_hash, p, tokenid, tokenid_utf8, owner, img, address_btc, address_eth, prim, txt_data, expire_timestamp
      FROM ${SRC101_OWNERS_TABLE}
      WHERE ${whereClauses.join(" AND ")}
      ORDER BY last_update ${validOrder}
      ${params.limit ? `LIMIT ? OFFSET ?` : ""}
    `;

    const results = (await dbManager.executeQueryWithCache(
      sqlQuery,
      queryParams,
      1000 * 60 * 2, // Cache duration
    )).rows.map((result) => ({
      ...result,
    }));;
    return results;
  }
}