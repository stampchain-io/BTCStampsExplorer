#!/usr/bin/env -S deno run --allow-env --allow-read --allow-write --allow-net

/**
 * Script to generate test fixtures from the database
 * Run with: deno run --allow-all tests/fixtures/generateFixtures.ts
 */

import { dbManager } from "$server/database/databaseManager.ts";

async function generateStampFixtures() {
  console.log("Generating stamp fixtures from database...");

  try {
    // Get various types of stamps
    const regularStampsQuery = `
      SELECT 
        stamp, block_index, cpid, creator, divisible, keyburn, locked,
        stamp_url, stamp_mimetype, supply, block_time, tx_hash, tx_index,
        ident, stamp_hash, file_hash
      FROM StampTableV4
      WHERE stamp > 0 AND stamp < 100000
      ORDER BY stamp DESC
      LIMIT 5
    `;

    const cursedStampsQuery = `
      SELECT 
        stamp, block_index, cpid, creator, divisible, keyburn, locked,
        stamp_url, stamp_mimetype, supply, block_time, tx_hash, tx_index,
        ident, stamp_hash, file_hash
      FROM StampTableV4
      WHERE stamp < 0 AND stamp > -100000
      ORDER BY stamp DESC
      LIMIT 5
    `;

    const src20StampsQuery = `
      SELECT 
        stamp, block_index, cpid, creator, divisible, keyburn, locked,
        stamp_url, stamp_mimetype, supply, block_time, tx_hash, tx_index,
        ident, stamp_hash, file_hash
      FROM StampTableV4
      WHERE ident = 'SRC-20'
      LIMIT 5
    `;

    // Get stamps with market data
    const stampsWithMarketDataQuery = `
      SELECT 
        s.stamp, s.block_index, s.cpid, s.creator, s.divisible, s.keyburn, s.locked,
        s.stamp_url, s.stamp_mimetype, s.supply, s.block_time, s.tx_hash, s.tx_index,
        s.ident, s.stamp_hash, s.file_hash,
        m.floor_price_btc, m.holder_count, m.volume_24h_btc, m.last_updated
      FROM StampTableV4 s
      JOIN stamp_market_data m ON s.cpid = m.cpid
      WHERE m.floor_price_btc IS NOT NULL
      LIMIT 5
    `;

    // Get creators with names
    const creatorsQuery = `
      SELECT DISTINCT address, creator
      FROM creator
      WHERE creator IS NOT NULL
      LIMIT 5
    `;

    const regularStamps = await dbManager.executeQuery(regularStampsQuery);
    const cursedStamps = await dbManager.executeQuery(cursedStampsQuery);
    const src20Stamps = await dbManager.executeQuery(src20StampsQuery);
    const stampsWithMarketData = await dbManager.executeQuery(
      stampsWithMarketDataQuery,
    );
    const creators = await dbManager.executeQuery(creatorsQuery);

    const fixtures = {
      regularStamps: regularStamps.rows,
      cursedStamps: cursedStamps.rows,
      src20Stamps: src20Stamps.rows,
      stampsWithMarketData: stampsWithMarketData.rows,
      creators: creators.rows,
      generatedAt: new Date().toISOString(),
    };

    // Save to file
    const fixturesPath = "./tests/fixtures/stampData.json";
    await Deno.writeTextFile(
      fixturesPath,
      JSON.stringify(fixtures, null, 2),
    );

    console.log(`✅ Stamp fixtures saved to ${fixturesPath}`);
    console.log(`   - Regular stamps: ${regularStamps.rows.length}`);
    console.log(`   - Cursed stamps: ${cursedStamps.rows.length}`);
    console.log(`   - SRC-20 stamps: ${src20Stamps.rows.length}`);
    console.log(
      `   - Stamps with market data: ${stampsWithMarketData.rows.length}`,
    );
    console.log(`   - Creators: ${creators.rows.length}`);
  } catch (error) {
    console.error("Error generating stamp fixtures:", error);
  }
}

async function generateMarketDataFixtures() {
  console.log("\nGenerating market data fixtures from database...");

  try {
    // Get stamp market data
    const stampMarketDataQuery = `
      SELECT *
      FROM stamp_market_data
      WHERE cpid IS NOT NULL 
      AND floor_price_btc IS NOT NULL
      LIMIT 10
    `;

    // Get SRC20 market data
    const src20MarketDataQuery = `
      SELECT *
      FROM src20_market_data
      WHERE tick IS NOT NULL
      AND market_cap_btc > 0
      ORDER BY market_cap_btc DESC
      LIMIT 10
    `;

    // Get collection market data
    const collectionMarketDataQuery = `
      SELECT *
      FROM collection_market_data
      WHERE collection_id IS NOT NULL
      LIMIT 5
    `;

    // Get holder data - first get a cpid, then get holders
    const cpidQuery = `
      SELECT cpid 
      FROM stamp_market_data 
      WHERE holder_count > 10 
      LIMIT 1
    `;

    const cpidResult = await dbManager.executeQuery(cpidQuery);
    let holderDataQuery = `SELECT * FROM stamp_holder_cache LIMIT 0`; // default empty

    if (cpidResult.rows.length > 0) {
      const cpid = cpidResult.rows[0].cpid;
      holderDataQuery = `
        SELECT *
        FROM stamp_holder_cache
        WHERE cpid = '${cpid}'
        ORDER BY rank_position ASC
        LIMIT 20
      `;
    }

    const stampMarketData = await dbManager.executeQuery(stampMarketDataQuery);
    const src20MarketData = await dbManager.executeQuery(src20MarketDataQuery);
    const collectionMarketData = await dbManager.executeQuery(
      collectionMarketDataQuery,
    );
    const holderData = await dbManager.executeQuery(holderDataQuery);

    const fixtures = {
      stampMarketData: stampMarketData.rows,
      src20MarketData: src20MarketData.rows,
      collectionMarketData: collectionMarketData.rows,
      holderData: holderData.rows,
      generatedAt: new Date().toISOString(),
    };

    // Save to file
    const fixturesPath = "./tests/fixtures/marketData.json";
    await Deno.writeTextFile(
      fixturesPath,
      JSON.stringify(fixtures, null, 2),
    );

    console.log(`✅ Market data fixtures saved to ${fixturesPath}`);
    console.log(`   - Stamp market data: ${stampMarketData.rows.length}`);
    console.log(`   - SRC20 market data: ${src20MarketData.rows.length}`);
    console.log(
      `   - Collection market data: ${collectionMarketData.rows.length}`,
    );
    console.log(`   - Holder data: ${holderData.rows.length}`);
  } catch (error) {
    console.error("Error generating market data fixtures:", error);
  }
}

async function generateCollectionFixtures() {
  console.log("\nGenerating collection fixtures from database...");

  try {
    // Get collections
    const collectionsQuery = `
      SELECT 
        HEX(c.collection_id) as collection_id,
        c.collection_name,
        c.collection_description
      FROM collections c
      LIMIT 10
    `;

    // Get collection creators - join with limited collections
    const collectionCreatorsQuery = `
      SELECT 
        HEX(cc.collection_id) as collection_id,
        cc.creator_address
      FROM collection_creators cc
      INNER JOIN (
        SELECT collection_id FROM collections ORDER BY collection_id LIMIT 10
      ) c ON cc.collection_id = c.collection_id
    `;

    // Get collection stamps - join with limited collections
    const collectionStampsQuery = `
      SELECT 
        HEX(cs.collection_id) as collection_id,
        cs.stamp
      FROM collection_stamps cs
      INNER JOIN (
        SELECT collection_id FROM collections ORDER BY collection_id LIMIT 10
      ) c ON cs.collection_id = c.collection_id
      LIMIT 50
    `;

    const collections = await dbManager.executeQuery(collectionsQuery);
    const collectionCreators = await dbManager.executeQuery(
      collectionCreatorsQuery,
    );
    const collectionStamps = await dbManager.executeQuery(
      collectionStampsQuery,
    );

    const fixtures = {
      collections: collections.rows,
      collectionCreators: collectionCreators.rows,
      collectionStamps: collectionStamps.rows,
      generatedAt: new Date().toISOString(),
    };

    // Save to file
    const fixturesPath = "./tests/fixtures/collectionData.json";
    await Deno.writeTextFile(
      fixturesPath,
      JSON.stringify(fixtures, null, 2),
    );

    console.log(`✅ Collection fixtures saved to ${fixturesPath}`);
    console.log(`   - Collections: ${collections.rows.length}`);
    console.log(`   - Collection creators: ${collectionCreators.rows.length}`);
    console.log(`   - Collection stamps: ${collectionStamps.rows.length}`);
  } catch (error) {
    console.error("Error generating collection fixtures:", error);
  }
}

async function generateSrc20Fixtures() {
  console.log("\nGenerating SRC-20 fixtures from database...");

  try {
    // Get SRC-20 valid transactions
    const src20TransactionsQuery = `
      SELECT *
      FROM SRC20Valid
      WHERE tick IS NOT NULL
      LIMIT 20
    `;

    // Get SRC-20 all transactions
    const src20AllQuery = `
      SELECT *
      FROM SRC20
      WHERE tick IS NOT NULL
      LIMIT 20
    `;

    // Get SRC-20 token stats
    const tokenStatsQuery = `
      SELECT *
      FROM src20_token_stats
      LIMIT 10
    `;

    // Get SRC-20 metadata
    const metadataQuery = `
      SELECT *
      FROM src20_metadata
      LIMIT 10
    `;

    const src20Transactions = await dbManager.executeQuery(
      src20TransactionsQuery,
    );
    const src20All = await dbManager.executeQuery(src20AllQuery);
    const tokenStats = await dbManager.executeQuery(tokenStatsQuery);
    const metadata = await dbManager.executeQuery(metadataQuery);

    const fixtures = {
      src20Valid: src20Transactions.rows,
      src20All: src20All.rows,
      tokenStats: tokenStats.rows,
      metadata: metadata.rows,
      generatedAt: new Date().toISOString(),
    };

    // Save to file
    const fixturesPath = "./tests/fixtures/src20Data.json";
    await Deno.writeTextFile(
      fixturesPath,
      JSON.stringify(fixtures, null, 2),
    );

    console.log(`✅ SRC-20 fixtures saved to ${fixturesPath}`);
    console.log(`   - SRC-20 valid records: ${src20Transactions.rows.length}`);
    console.log(`   - SRC-20 all records: ${src20All.rows.length}`);
    console.log(`   - Token stats: ${tokenStats.rows.length}`);
    console.log(`   - Metadata: ${metadata.rows.length}`);
  } catch (error) {
    console.error("Error generating SRC-20 fixtures:", error);
  }
}

// Main execution
async function main() {
  console.log("🚀 Starting fixture generation...\n");

  try {
    await generateStampFixtures();
    await generateMarketDataFixtures();
    await generateCollectionFixtures();
    await generateSrc20Fixtures();

    console.log("\n✨ All fixtures generated successfully!");
  } catch (error) {
    console.error("\n❌ Error during fixture generation:", error);
  } finally {
    // The dbManager will close connections automatically
    Deno.exit(0);
  }
}

if (import.meta.main) {
  main();
}
