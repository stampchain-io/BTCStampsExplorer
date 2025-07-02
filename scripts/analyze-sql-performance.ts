#!/usr/bin/env -S deno run --allow-net --allow-env --allow-read

import { dbManager } from "../server/database/databaseManager.ts";

async function analyzeQueryPerformance(db: any) {
  console.log("\n=== SQL QUERY PERFORMANCE ANALYSIS ===\n");

  // Key queries to analyze
  const queries = [
    {
      name: "Get stamps with market data (collection page)",
      sql: `
        EXPLAIN ANALYZE
        SELECT 
          s.*,
          m.floor_price_btc,
          m.recent_sale_price_btc,
          m.holder_count,
          m.holder_distribution_score,
          m.volume_24h_btc,
          m.data_quality_score
        FROM stamps s
        LEFT JOIN market_data m ON s.cpid = m.cpid
        WHERE s.ident = 'STAMP'
        ORDER BY s.stamp DESC
        LIMIT 100
      `,
    },
    {
      name: "Get stamps with market data filters",
      sql: `
        EXPLAIN ANALYZE
        SELECT 
          s.*,
          m.floor_price_btc,
          m.recent_sale_price_btc,
          m.holder_count,
          m.holder_distribution_score,
          m.volume_24h_btc,
          m.data_quality_score
        FROM stamps s
        LEFT JOIN market_data m ON s.cpid = m.cpid
        WHERE s.ident = 'STAMP'
          AND m.holder_count >= 10
          AND m.holder_distribution_score >= 50
        ORDER BY s.stamp DESC
        LIMIT 100
      `,
    },
    {
      name: "Get SRC-20 tokens with market data",
      sql: `
        EXPLAIN ANALYZE
        SELECT 
          s.*,
          m.floor_price_btc,
          m.recent_sale_price_btc,
          m.holder_count,
          m.volume_24h_btc,
          m.data_quality_score
        FROM src20_summary s
        LEFT JOIN market_data m ON s.tick = m.cpid
        ORDER BY s.valid_date DESC
        LIMIT 50
      `,
    },
    {
      name: "Check indexes on market_data table",
      sql: `SHOW INDEXES FROM market_data`,
    },
    {
      name: "Check indexes on stamps table",
      sql: `SHOW INDEXES FROM stamps`,
    },
  ];

  for (const query of queries) {
    console.log(`\n### ${query.name}`);
    console.log("```sql");
    console.log(query.sql.trim());
    console.log("```\n");

    try {
      const results = await db.query(query.sql);

      if (query.name.includes("EXPLAIN")) {
        // Parse EXPLAIN output
        console.log("Query Plan:");
        results.forEach((row: any) => {
          console.log(
            `- ${row.id}: ${row.select_type} on ${row.table} (rows: ${row.rows}, key: ${
              row.key || "none"
            })`,
          );
          if (row.Extra) {
            console.log(`  Extra: ${row.Extra}`);
          }
        });
      } else {
        // Show index information
        console.log("Indexes:");
        results.forEach((row: any) => {
          console.log(
            `- ${row.Key_name} on ${row.Column_name} (${row.Index_type})`,
          );
        });
      }

      // For EXPLAIN ANALYZE, also show timing
      const timing = results.find((row: any) =>
        row.Extra?.includes("actual time")
      );
      if (timing) {
        console.log(`\nExecution time: ${timing.Extra}`);
      }
    } catch (error) {
      console.error(`Error: ${error.message}`);
    }
  }

  console.log("\n\n=== OPTIMIZATION RECOMMENDATIONS ===\n");

  console.log("1. **Index Analysis**");
  console.log(
    "   - Check if market_data.cpid has an index (for JOIN performance)",
  );
  console.log("   - Verify composite indexes for filtered queries");
  console.log("   - Consider indexes on frequently filtered columns");

  console.log("\n2. **Query Optimization**");
  console.log("   - Use covering indexes where possible");
  console.log("   - Optimize JOIN order based on table sizes");
  console.log("   - Consider query result caching");

  console.log("\n3. **Performance Metrics**");
  console.log("   - Monitor slow query log");
  console.log("   - Track query execution times");
  console.log("   - Measure index hit rates");
}

// Run the analysis
if (import.meta.main) {
  try {
    await dbManager.init();
    const db = dbManager.getConnection();
    await analyzeQueryPerformance(db);
  } finally {
    await dbManager.close();
  }
}
