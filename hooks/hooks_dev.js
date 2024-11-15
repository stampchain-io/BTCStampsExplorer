const hooks = require("hooks");
const fs = require("fs");

hooks.beforeEachValidation((transaction, done) => {
  if (
    transaction.name ===
      "/api/v2/stamps > Get paginated stamps > 200 > application/json" &&
    transaction.real.statusCode === 200
  ) {
    hooks.log(`Simulating 200 response for transaction: ${transaction.name}`);
    hooks.log("Comparing Response Data Between Production and Dev mods");

    const dataInDev = JSON.parse(transaction.real.body).data;
    const dataInProd = JSON.parse(fs.readFileSync("hooks/response.json"));

    const compareResult = compareAPIResp(dataInDev, dataInProd);
    if (typeof compareResult !== "string")
      fs.writeFileSync("hooks/result.json", JSON.stringify(compareResult));
    else hooks.log(compareResult);
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

const compareByKeys = (devObj, prodObj) => {
  const devKeys = Object.keys(devObj);
  const prodKeys = Object.keys(prodObj);

  if (devKeys.length !== prodKeys.length) return false;

  for (const key of devKeys) {
    if (devObj[key] !== prodObj[key]) {
      if (typeof devObj[key] === "object" && typeof prodObj[key] === "object") {
        if (!deepCompare(devObj[key], prodObj[key])) return false;
      } else {
        return false;
      }
    }
  }

  return true;
};

const compareAPIResp = (dev, prod) => {
  const diffs = [];

  // Assuming both arrays are of the same length and ordered
  dev.forEach((item, index) => {
    const isEqual = compareByKeys(item, prod[index]);
    if (!isEqual) {
      diffs.push({
        index,
        devData: item,
        prodData: prod[index],
      });
    }
  });

  return diffs.length ? diffs : "Differences not found";
};
