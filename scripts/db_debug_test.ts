import { SRC20Repository } from "../server/database/src20Repository.ts";

async function testLuffyBalance() {
    console.log("\n=== Starting Luffy Balance Debug Test ===");
    
    // Test with known failing tick
    console.log("\nTesting with 'luffy' tick:");
    const luffyResult = await SRC20Repository.getSrc20BalanceFromDb({
        address: "bc1qay74nc2djs2g5acqp72eyvlqp3ku7sj97jft8y",
        tick: "luffy",
        includePagination: true
    });
    
    // Test with no tick (known working case)
    console.log("\nTesting with no tick (known working case):");
    const noTickResult = await SRC20Repository.getSrc20BalanceFromDb({
        address: "bc1qay74nc2djs2g5acqp72eyvlqp3ku7sj97jft8y",
        includePagination: true
    });
    
    console.log("\n=== Debug Test Complete ===\n");
}

// Run the test
console.log("Starting database debug test...");
testLuffyBalance()
    .catch(error => {
        console.error("Error running debug test:", error);
    });
