# Stamp Minting Debug Scripts

These scripts are essential for debugging and testing the stamp minting functionality in BTCStampsExplorer.

## Essential Debug Scripts

### 1. `debugFeeCalculation.ts`
**Purpose**: Tests UTXO selection and fee calculation for stamp minting
**Use case**: Verify that the optimal UTXO selection algorithm works correctly
**Command**: `deno run --allow-all scripts/debugFeeCalculation.ts`
**Output**: Shows selected UTXOs, fees, and change calculation

### 2. `testStampMintFinal.ts`
**Purpose**: End-to-end test of the stamp minting API endpoint
**Use case**: Verify the complete stamp minting flow works correctly
**Command**: `deno run --allow-all scripts/testStampMintFinal.ts`
**Output**: Tests the `/api/v2/olga/mint` endpoint with a 32KB file

### 3. `testCommonUTXOService.ts`
**Purpose**: Tests the core UTXO fetching service functionality
**Use case**: Debug UTXO fetching, script retrieval, and service fallback
**Command**: `deno run --allow-all scripts/testCommonUTXOService.ts`
**Output**: Shows UTXO details, script fetching, and fallback behavior

### 4. `testOptimalUTXOSelection.ts`
**Purpose**: Tests the optimal UTXO selection algorithm in isolation
**Use case**: Verify the UTXO selection logic works correctly
**Command**: `deno run --allow-all scripts/testOptimalUTXOSelection.ts`
**Output**: Shows algorithm results, waste calculation, and selection efficiency

## Integration Tests

### 5. `utxoArchitecture.simple.test.ts` (Recommended)
**Purpose**: Fast architectural validation without slow network calls
**Use case**: Validate that our simplified UTXO architecture works correctly
**Command**: `deno test tests/unit/utxoArchitecture.simple.test.ts --allow-all`
**Output**: Quick validation of component instantiation and interfaces

## Slow Integration Tests (Moved to tests/integration/)

### 6. `commonUtxoService.slow.test.ts` (Moved - Network dependent)
**Purpose**: Integration tests for CommonUTXOService with real network calls
**Use case**: Validate actual UTXO service behavior (may timeout on slow networks)
**Command**: `deno test tests/integration/commonUtxoService.slow.test.ts --allow-all`
**Output**: Tests actual service calls - **WARNING: May hang on slow connections**

### 7. `stampMinting.slow.test.ts` (Moved - Network dependent)
**Purpose**: End-to-end integration tests for stamp minting process
**Use case**: Validate the complete stamp minting flow including UTXO selection
**Command**: `deno test tests/integration/stampMinting.slow.test.ts --allow-all`
**Output**: Tests architectural changes - **WARNING: May hang due to network calls**

### 8. `mintEndpoint.slow.test.ts` (Moved - Network dependent)
**Purpose**: End-to-end tests for the `/api/v2/olga/mint` endpoint
**Use case**: Validate actual mint endpoint with real UTXO selection and network calls
**Command**: `deno test tests/integration/mintEndpoint.slow.test.ts --allow-all`
**Output**: Tests mint endpoint with real 31KB files - **WARNING: Makes real network calls**

### 9. `btcPriceServiceCircuitBreaker.slow.test.ts` (Moved - Mock issues)
**Purpose**: Complex circuit breaker tests for BTCPriceService
**Use case**: Validate circuit breaker logic with external API failures
**Command**: `deno test tests/integration/btcPriceServiceCircuitBreaker.slow.test.ts --allow-all`
**Output**: Tests circuit breaker patterns - **WARNING: Complex mock scenarios**

### 10. `commonUtxoService.branch-coverage.slow.test.ts` (Moved - Mock issues)
**Purpose**: Branch coverage tests for CommonUTXOService with complex mocking
**Use case**: Validate all code paths through UTXO service with detailed mocking
**Command**: `deno test tests/integration/commonUtxoService.branch-coverage.slow.test.ts --allow-all`
**Output**: Tests complex mock scenarios - **WARNING: Mock expectations may need updates**

**Note:** These tests were moved out of `tests/unit/` to prevent them from slowing down or breaking the main test suite. Some have pre-existing mock/expectation issues that need to be addressed.

## Test Address Used
All scripts use the test address: `bc1qnpszanef2ed9yxtqndvyxy72tdmnks6m28rn3d`

## Notes
- These scripts require a running development server for API endpoint testing
- The scripts use real Bitcoin network data (QuickNode, Mempool.space, Blockstream)
- Fee rates and file sizes can be adjusted in each script for different test scenarios
