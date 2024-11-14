const hooks = require("hooks");
const fs = require("fs");

hooks.beforeEachValidation((transaction, done) => {
  if (
    transaction.name ===
      "/api/v2/stamps > Get paginated stamps > 200 > application/json" &&
    transaction.real.statusCode === 200
  ) {
    hooks.log(`Simulating 200 response for transaction: ${transaction.name}`);

    const jsonData = JSON.parse(transaction.real.body).data;
    const jsonString = JSON.stringify(jsonData);
    try {
      if (jsonString) {
        // Check if jsonString is not empty
        fs.writeFileSync("hooks/response_dev.json", jsonString);

        hooks.log("File written successfully");
      } else {
        hooks.log("No data to write to file");
      }
    } catch (err) {
      hooks.error("Error writing file:", err);
    }
  }

  if (transaction.name.includes("500")) {
    console.log(`Simulating 500 response for transaction: ${transaction.name}`);
    transaction.real.statusCode = "500";
    transaction.real.body = JSON.stringify({
      error: "Internal Server Error",
      message: "Simulated server error for testing purposes",
    });
  } else if (transaction.name.includes("404")) {
    console.log(`Simulating 404 response for transaction: ${transaction.name}`);
    transaction.real.statusCode = "404";
    transaction.real.body = JSON.stringify({
      error: "Not Found",
      message: "Simulated not found error for testing purposes",
    });
  } else if (transaction.name.includes("400")) {
    console.log(`Simulating 400 response for transaction: ${transaction.name}`);
    transaction.real.statusCode = "400";
    transaction.real.body = JSON.stringify({
      error: "Bad Request",
      message: "Simulated bad request error for testing purposes",
    });
  }
  done();
});
