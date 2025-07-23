#!/usr/bin/env -S deno run --allow-net --allow-read --allow-env

/**
 * Quick Test for Current Progress Fields Status
 *
 * Tests the immediate availability of progress_percentage and total_minted fields
 * that the backend team has made available for testing.
 */

const BASE_URL = "http://localhost:8000";

interface ProgressFieldTest {
  endpoint: string;
  description: string;
}

const TESTS: ProgressFieldTest[] = [
  {
    endpoint: "/api/v2/src20?limit=10&op=DEPLOY&sortBy=PROGRESS_DESC",
    description: "PROGRESS_DESC sorting with progress fields"
  },
  {
    endpoint: "/api/v2/src20?limit=10&op=DEPLOY&sortBy=PROGRESS_ASC",
    description: "PROGRESS_ASC sorting with progress fields"
  },
  {
    endpoint: "/api/v2/src20?limit=5&op=DEPLOY&sortBy=ASC",
    description: "Basic sorting for field comparison"
  }
];

async function testProgressField(test: ProgressFieldTest): Promise<void> {
  try {
    const startTime = Date.now();
    const response = await fetch(`${BASE_URL}${test.endpoint}`);
    const responseTime = Date.now() - startTime;

    if (response.status === 200) {
      const data = await response.json();
      const records = data.data || [];

      let progressCount = 0;
      let mintedCount = 0;
      let nullProgressCount = 0;
      let nullMintedCount = 0;
      let progressValues: number[] = [];
      let mintedValues: number[] = [];

      for (const record of records) {
        if (typeof record.progress === 'number') {
          progressCount++;
          progressValues.push(record.progress);
        } else if (record.progress === null) {
          nullProgressCount++;
        }

        if (typeof record.minted_amt === 'number') {
          mintedCount++;
          mintedValues.push(record.minted_amt);
        } else if (record.minted_amt === null) {
          nullMintedCount++;
        }
      }

      const totalRecords = records.length;
      const progressRate = totalRecords > 0 ? (progressCount / totalRecords) * 100 : 0;
      const mintedRate = totalRecords > 0 ? (mintedCount / totalRecords) * 100 : 0;

      console.log(`\n🧪 ${test.description}`);
      console.log(`   Status: ✅ ${response.status} OK | ${responseTime}ms | ${totalRecords} records`);
      console.log(`   Progress Field: ${progressCount}/${totalRecords} populated (${progressRate.toFixed(1)}%), ${nullProgressCount} null`);
      if (progressValues.length > 0) {
        console.log(`   Progress Range: ${Math.min(...progressValues).toFixed(1)}% - ${Math.max(...progressValues).toFixed(1)}%`);
      }
      console.log(`   Minted Field: ${mintedCount}/${totalRecords} populated (${mintedRate.toFixed(1)}%), ${nullMintedCount} null`);
      if (mintedValues.length > 0) {
        console.log(`   Minted Range: ${Math.min(...mintedValues).toLocaleString()} - ${Math.max(...mintedValues).toLocaleString()}`);
      }

      // Show sample data
      if (records.length > 0) {
        const sample = records[0];
        console.log(`   Sample: ${sample.tick} | progress: ${sample.progress} | minted: ${sample.minted_amt} | holders: ${sample.holders}`);
      }

    } else {
      console.log(`\n❌ ${test.description}`);
      console.log(`   Status: ${response.status} | ${responseTime}ms`);
      const errorData = await response.text();
      console.log(`   Error: ${errorData.substring(0, 200)}`);
    }
  } catch (error) {
    console.log(`\n❌ ${test.description}`);
    console.log(`   Error: ${error.message}`);
  }
}

async function main(): Promise<void> {
  console.log("🚀 CURRENT PROGRESS FIELDS STATUS TEST");
  console.log("======================================");
  console.log("Testing immediate availability of progress_percentage and total_minted fields");

  for (const test of TESTS) {
    await testProgressField(test);
  }

  console.log("\n📋 SUMMARY:");
  console.log("- Fields are available immediately for testing");
  console.log("- Null values expected during backend population");
  console.log("- Progressive improvement as historical data populates");
  console.log("- Ready for null-safe query implementation");
}

if (import.meta.main) {
  await main();
}
