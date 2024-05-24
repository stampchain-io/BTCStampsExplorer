const hooks = require("hooks");

hooks.beforeEachValidation((transaction, done) => {
  if (transaction.name.includes("500")) {
    console.log(
      `Simulating 500 response for transaction: ${transaction.name}`,
    );
    transaction.real.statusCode = "500";
    transaction.real.body = JSON.stringify({
      error: "Internal Server Error",
      message: "Simulated server error for testing purposes",
    });
  } else if (transaction.name.includes("404")) {
    console.log(
      `Simulating actual response for transaction: ${transaction.name}`,
    );
    transaction.real.statusCode = "404";
    transaction.real.body = JSON.stringify({
      error: "Not Found",
      message: "Simulated not found error for testing purposes",
    });
  }
  done();
});
