# Task 42: Backend Service Renaming Analysis

## 📊 Service Reference Counts

| Service          | Current Name     | Proposed Name             | References | Impact |
| ---------------- | ---------------- | ------------------------- | ---------- | ------ |
| PSBTService      | PSBTService      | BitcoinTransactionBuilder | 249        | HIGH   |
| xcpService       | xcpService       | CounterpartyApiService    | 72         | HIGH   |
| utxoService      | utxoService      | BitcoinUtxoManager        | 21         | MEDIUM |
| stampMintService | stampMintService | StampCreationService      | 4          | LOW    |

## 🎯 Priority Order

1. **PSBTService → BitcoinTransactionBuilder** (249 references)
2. **xcpService → CounterpartyApiService** (72 references)
3. **utxoService → BitcoinUtxoManager** (21 references)
4. **stampMintService → StampCreationService** (4 references)

## 📁 Key Files to Update

### PSBTService References
- `./routes/api/v2/create/dispense.ts`
- `./routes/api/v2/fairmint/compose.ts`
- `./routes/api/v2/src20/create.ts`
- `./routes/api/v2/trx/complete_psbt.ts`
- `./routes/api/v2/trx/create_psbt.ts`
- `./routes/api/v2/trx/stampdetach.ts`
- `./server/services/src101/psbt/src101MultisigPSBTService.ts`
- `./server/services/src20/psbt/src20PSBTService.ts`
- `./server/services/transaction/psbtService.ts` (main file)
- `./server/services/transaction/generalPsbtService.ts`

### xcpService References
- `./server/services/xcpService.ts` (main file)
- `./server/services/xcp/xcpManagerDI.ts`
- Multiple API endpoints and service files

### Method Renames Within Services

#### PSBTService → BitcoinTransactionBuilder
- `buildPSBT()` → `constructBitcoinTransaction()`
- `createPSBT()` → `constructTransaction()`
- `signPSBT()` → `signTransaction()`
- `processCounterpartyPSBT()` → `processCounterpartyTransaction()`
- `completePSBT()` → `completeTransaction()`

#### xcpService → CounterpartyApiService
- `getXcpAsset()` → `fetchCounterpartyAsset()`
- `getXcpBalancesByAddress()` → `fetchAssetBalances()`
- `createDispense()` → `composeDispenseTransaction()`
- `createSend()` → `composeSendTransaction()`
- `fetchXcpV2WithCache()` → `fetchCounterpartyApiWithCache()`

#### utxoService → BitcoinUtxoManager
- `getUTXOForAddress()` → `fetchUtxosForAddress()`
- `getSpecificUTXO()` → `fetchSpecificUtxo()`
- `selectOptimalUTXOs()` → `selectOptimalUtxos()`

#### stampMintService → StampCreationService
- `createStampIssuance()` → `createStampTransaction()`
- `generatePSBT()` → `generateTransactionPsbt()`

## 🛡️ Safety Considerations

1. **Exclude node_modules** from all searches
2. **Update imports systematically** for each service
3. **Test after each service rename** with `deno check`
4. **Commit after each subtask** for rollback safety
5. **Update TypeScript types** and interfaces
6. **Verify API endpoints** still function correctly

## 📋 Implementation Plan

### Phase 1: Analysis Complete ✅
- Reference counting complete
- File mapping documented
- Impact assessment done

### Phase 2: High Priority Renames
1. PSBTService → BitcoinTransactionBuilder
2. xcpService → CounterpartyApiService

### Phase 3: Medium Priority Renames
3. utxoService → BitcoinUtxoManager
4. stampMintService → StampCreationService

### Phase 4: Validation & Documentation
- Update configurations
- Update documentation
- Comprehensive testing

## 🎯 Success Criteria

- [ ] Zero TypeScript errors after all renames
- [ ] All API endpoints functional
- [ ] All tests passing
- [ ] Documentation updated
- [ ] Configuration files updated
- [ ] Method names improved for clarity
