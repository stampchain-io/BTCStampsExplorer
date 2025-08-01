schema mismatch description

⏺ The issue is that the Newman tests didn't catch this schema mismatch because:

  1. No Schema Validation: The comprehensive test collection only has basic tests at the collection level (status code, response time, valid JSON) but doesn't validate the actual response structure
   against the OpenAPI schema.
  2. Missing Test Coverage: The main /api/v2/src20/tx/{tx_hash} endpoint tests don't have specific assertions about the response structure. Only the edge case tests (with ?tick=null) have
  assertions checking that data is an object.
  3. No OpenAPI Contract Testing: While there's a validate:schema script that validates the OpenAPI schema file itself, there's no integration between Newman tests and the OpenAPI schema to ensure
  responses match the defined contract.

  To prevent this in the future, you could:
  - Add OpenAPI contract testing using tools like newman-reporter-openapi or portman
  - Add explicit schema validation tests in the Postman collection
  - Use a tool like openapi-validator-middleware in the API itself
  - Add specific test assertions for each endpoint's expected response structure
