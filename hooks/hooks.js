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
      `Simulating 404 response for transaction: ${transaction.name}`,
    );
    transaction.real.statusCode = "404";
    transaction.real.body = JSON.stringify({
      error: "Not Found",
      message: "Simulated not found error for testing purposes",
    });
  } else if (transaction.name.includes("400")) {
    console.log(
      `Simulating 400 response for transaction: ${transaction.name}`,
    );
    transaction.real.statusCode = "400";
    transaction.real.body = JSON.stringify({
      error: "Bad Request",
      message: "Simulated bad request error for testing purposes",
    });
  }
  done();
});
