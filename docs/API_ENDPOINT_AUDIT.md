# API Endpoint Audit for Newman Testing

**Generated:** 2025-07-02  
**Total Endpoints:** 46  
**Current Test Coverage:** 4/46 (8.7%)

## Endpoint Categories and Testing Status

### System Endpoints (2)
- [x] `/api/v2/health` - ✅ Tested
- [x] `/api/v2/version` - ✅ Tested

### Documentation (2)
- [ ] `/api/v2/docs` - ❌ Not tested
- [ ] `/api/v2/error` - ❌ Not tested

### Stamps Endpoints (9)
- [x] `/api/v2/stamps` - ✅ Tested (limit=1 only)
- [ ] `/api/v2/stamps/{id}` - ❌ Not tested
- [ ] `/api/v2/stamps/{id}/dispensers` - ❌ Not tested
- [ ] `/api/v2/stamps/{id}/dispenses` - ❌ Not tested
- [ ] `/api/v2/stamps/{id}/holders` - ❌ Not tested
- [ ] `/api/v2/stamps/{id}/sends` - ❌ Not tested
- [ ] `/api/v2/stamps/balance/{address}` - ❌ Not tested
- [ ] `/api/v2/stamps/block/{block_index}` - ❌ Not tested
- [ ] `/api/v2/stamps/ident/{ident}` - ❌ Not tested

### Balance Endpoints (1)
- [ ] `/api/v2/balance/{address}` - ❌ Not tested

### Block Endpoints (2)
- [ ] `/api/v2/block/{block_index}` - ❌ Not tested
- [ ] `/api/v2/block/block_count/{number}` - ❌ Not tested

### Collections Endpoints (2)
- [ ] `/api/v2/collections` - ❌ Not tested
- [ ] `/api/v2/collections/creator/{creator}` - ❌ Not tested

### Cursed Stamps Endpoints (3)
- [ ] `/api/v2/cursed` - ❌ Not tested
- [ ] `/api/v2/cursed/{id}` - ❌ Not tested
- [ ] `/api/v2/cursed/block/{block_index}` - ❌ Not tested

### SRC-20 Endpoints (11)
- [x] `/api/v2/src20` - ✅ Tested (limit=1 only)
- [ ] `/api/v2/src20/balance/{address}` - ❌ Not tested
- [ ] `/api/v2/src20/balance/{address}/{tick}` - ❌ Not tested
- [ ] `/api/v2/src20/balance/snapshot/{tick}` - ❌ Not tested
- [ ] `/api/v2/src20/block/{block_index}` - ❌ Not tested
- [ ] `/api/v2/src20/block/{block_index}/{tick}` - ❌ Not tested
- [ ] `/api/v2/src20/create` - ❌ Not tested (POST)
- [ ] `/api/v2/src20/tick` - ❌ Not tested
- [ ] `/api/v2/src20/tick/{tick}` - ❌ Not tested
- [ ] `/api/v2/src20/tick/{tick}/deploy` - ❌ Not tested
- [ ] `/api/v2/src20/tx/{tx_hash}` - ❌ Not tested

### SRC-101 Endpoints (11)
- [ ] `/api/v2/src101` - ❌ Not tested
- [ ] `/api/v2/src101/{deploy_hash}` - ❌ Not tested
- [ ] `/api/v2/src101/{deploy_hash}/{tokenid}` - ❌ Not tested
- [ ] `/api/v2/src101/{deploy_hash}/address/{address_btc}` - ❌ Not tested
- [ ] `/api/v2/src101/{deploy_hash}/deploy` - ❌ Not tested
- [ ] `/api/v2/src101/{deploy_hash}/total` - ❌ Not tested
- [ ] `/api/v2/src101/balance/{address}` - ❌ Not tested
- [ ] `/api/v2/src101/create` - ❌ Not tested (POST)
- [ ] `/api/v2/src101/index/{deploy_hash}/{index}` - ❌ Not tested
- [ ] `/api/v2/src101/tx` - ❌ Not tested
- [ ] `/api/v2/src101/tx/{tx_hash}` - ❌ Not tested

### Transaction Endpoints (2)
- [ ] `/api/v2/trx/stampattach` - ❌ Not tested (POST)
- [ ] `/api/v2/trx/stampdetach` - ❌ Not tested (POST)

### Minting Endpoints (1)
- [ ] `/api/v2/olga/mint` - ❌ Not tested (POST)

## Test Coverage by HTTP Method

### GET Endpoints: 40/46
- Tested: 4
- Untested: 36

### POST Endpoints: 6/46
- Tested: 0
- Untested: 6

## Required Test Data

### Static Test Data Needed
1. **Valid stamp IDs**: Need known stamp IDs for testing individual stamp endpoints
2. **Valid addresses**: Bitcoin addresses with known balances
3. **Valid block indices**: Block numbers with known stamps
4. **Valid transaction hashes**: TX hashes for testing transaction endpoints
5. **Valid SRC-20 ticks**: Known SRC-20 token tickers
6. **Valid SRC-101 deploy hashes**: Known SRC-101 deployment hashes
7. **Valid cursed stamp IDs**: Known cursed stamp identifiers

### Dynamic Test Data
1. **POST endpoints**: Need request body schemas for:
   - `/api/v2/src20/create`
   - `/api/v2/src101/create`
   - `/api/v2/trx/stampattach`
   - `/api/v2/trx/stampdetach`
   - `/api/v2/olga/mint`

## Testing Priorities

### Priority 1 - Core Read Operations (15 endpoints)
- All stamp read endpoints (8)
- All balance endpoints (3)
- Block information endpoints (2)
- Collections endpoints (2)

### Priority 2 - Token Operations (22 endpoints)
- SRC-20 endpoints (11)
- SRC-101 endpoints (11)

### Priority 3 - Write Operations (6 endpoints)
- Create/mint endpoints (3)
- Transaction endpoints (2)
- Error handling endpoint (1)

### Priority 4 - Specialized Operations (3 endpoints)
- Cursed stamps (3)

## Authentication Requirements

Need to verify authentication requirements for:
- POST endpoints (may require API keys)
- Balance snapshot endpoints (may have rate limits)
- Create/mint operations (likely require signatures)

## Next Steps

1. Gather valid test data for parameterized endpoints
2. Review OpenAPI schema for request/response schemas
3. Check authentication requirements
4. Create test data fixtures
5. Build Postman collections by priority groups