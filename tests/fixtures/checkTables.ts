#!/usr/bin/env -S deno run --allow-env --allow-read --allow-net

import { dbManager } from "$server/database/databaseManager.ts";

async function checkTables() {
  console.log("Checking available tables in database...\n");

  try {
    const result = await dbManager.executeQuery("SHOW TABLES");
    console.log("Available tables:");
    result.rows.forEach((row: any) => {
      const tableName = Object.values(row)[0];
      console.log(`  - ${tableName}`);
    });
  } catch (error) {
    console.error("Error checking tables:", error);
  } finally {
    Deno.exit(0);
  }
}

checkTables();
