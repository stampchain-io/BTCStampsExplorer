# Implementing Mock Support for Stamp Detach Testing

## Overview

To fully test the stamp detach functionality including successful scenarios, we need to implement mocking support in the application that allows us to override external API responses during testing.

## Implementation Strategy

### 1. Environment-Based Mocking

Add environment variable support to enable mocking during tests:

```typescript
// In your environment configuration
const ENABLE_MOCKING = Deno.env.get("ENABLE_API_MOCKING") === "true";
const MOCK_DATA_PATH = Deno.env.get("MOCK_DATA_PATH") || "./tests/fixtures/";
```

### 2. Mock Response Handler

Create a mock response handler in your XCP service:

```typescript
// server/services/xcpManager.ts
interface MockResponse {
  endpoint: string;
  response: any;
  status?: number;
}

class XcpManager {
  private mockResponses: Map<string, MockResponse> = new Map();
  
  constructor() {
    if (ENABLE_MOCKING) {
      this.loadMockResponses();
    }
  }
  
  private async loadMockResponses() {
    try {
      const mockData = JSON.parse(
        await Deno.readTextFile("./tests/fixtures/stampDetachTestScenarios.json")
      );
      
      // Load mock responses from fixture
      for (const [key, mock] of Object.entries(mockData.mockingConfiguration.mock_responses)) {
        this.mockResponses.set(mock.endpoint, mock);
      }
    } catch (error) {
      console.warn("Could not load mock responses:", error);
    }
  }
  
  async composeDetach(utxo: string, destination: string, options: any): Promise<any> {
    // Check for mock response first
    if (ENABLE_MOCKING) {
      const mockKey = `/utxos/${utxo}/compose/detach`;
      const mockResponse = this.mockResponses.get(mockKey);
      
      if (mockResponse) {
        if (mockResponse.response.error) {
          throw new Error(mockResponse.response.error);
        }
        return mockResponse.response;
      }
    }
    
    // Fallback to actual API call
    return this.makeActualApiCall(utxo, destination, options);
  }
}
```

### 3. Test Environment Setup

Update your test environment to enable mocking:

```bash
# In your test script or environment
export ENABLE_API_MOCKING=true
export MOCK_DATA_PATH="./tests/fixtures/"
```

### 4. Newman Test for Successful Detach

Add a successful detach test case:

```json
{
  "name": "Detach Stamp - Successful (Dev)",
  "event": [
    {
      "listen": "prerequest",
      "script": {
        "exec": [
          "// Enable mocking for this test",
          "pm.environment.set('ENABLE_API_MOCKING', 'true');"
        ]
      }
    },
    {
      "listen": "test",
      "script": {
        "exec": [
          "// Test Case: UTXO with sufficient balance for successful detach",
          "pm.test('Status code is 200 (successful detach)', function () {",
          "    pm.response.to.have.status(200);",
          "});",
          "",
          "pm.test('Response contains PSBT data', function () {",
          "    const jsonData = pm.response.json();",
          "    pm.expect(jsonData).to.have.property('psbt');",
          "    pm.expect(jsonData).to.have.property('fee');",
          "    pm.expect(jsonData).to.have.property('inputs');",
          "    pm.expect(jsonData).to.have.property('outputs');",
          "});",
          "",
          "pm.test('PSBT is valid base64 string', function () {",
          "    const jsonData = pm.response.json();",
          "    pm.expect(jsonData.psbt).to.be.a('string');",
          "    pm.expect(jsonData.psbt.length).to.be.greaterThan(0);",
          "});",
          "",
          "pm.test('Fee is reasonable', function () {",
          "    const jsonData = pm.response.json();",
          "    pm.expect(jsonData.fee).to.be.a('number');",
          "    pm.expect(jsonData.fee).to.be.greaterThan(0);",
          "    pm.expect(jsonData.fee).to.be.lessThan(10000); // Reasonable fee limit",
          "});"
        ]
      }
    }
  ],
  "request": {
    "method": "POST",
    "header": [
      {
        "key": "Accept",
        "value": "application/json"
      },
      {
        "key": "Content-Type", 
        "value": "application/json"
      }
    ],
    "body": {
      "mode": "raw",
      "raw": "{\n  \"utxo\": \"mock_sufficient_balance_utxo:0\",\n  \"destination\": \"bc1qzxszplp8v7w0jc89dlrqyct9staqlhwxzy7lkq\",\n  \"options\": {\n    \"fee_per_kb\": 25000\n  }\n}"
    },
    "url": {
      "raw": "{{dev_base_url}}/api/v2/trx/stampdetach",
      "host": ["{{dev_base_url}}"],
      "path": ["api", "v2", "trx", "stampdetach"]
    }
  }
}
```

## Testing Scenarios Covered

1. **✅ Successful Detach**: UTXO with stamp + sufficient BTC balance
2. **✅ Insufficient Funds**: UTXO with stamp but not enough BTC for fees  
3. **✅ No Assets**: UTXO without any stamps attached
4. **🔄 Future**: Invalid UTXO format validation
5. **🔄 Future**: Invalid destination address validation

## Benefits

- **Comprehensive Coverage**: Test both success and failure scenarios
- **Deterministic Results**: Consistent test outcomes regardless of external API state
- **Performance**: Faster tests without external API dependencies
- **Isolation**: Tests don't affect or depend on external services

## Implementation Priority

1. **High**: Implement basic mocking for successful detach scenario
2. **Medium**: Add validation error mocking (invalid UTXO/address)
3. **Low**: Add advanced scenarios (network errors, timeout simulation)

This approach gives you complete control over testing all stamp detach scenarios without depending on external API state or requiring actual Bitcoin transactions.
