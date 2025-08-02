# 🎯 EXPORT RECOVERY AGENT ASSIGNMENTS - 1041 TS2305 Errors

## 📊 **PROBLEM ANALYSIS:**
**Root Cause**: Incomplete domain-based type migration created import statements pointing to non-existent exports.

**Error Pattern**: 1041 x TS2305 "Module has no exported member"
- **148 instances each** of: `XcpBalance`, `ToolEstimationParams`, `NamespaceImport`, `MockResponse`, `InputData`, `FeeAlert`, `ColumnDefinition`
- **Primary Source**: `lib/types/toolEndpointAdapter.ts` and `components/layout/types.ts`

---

## 🎯 **AGENT ASSIGNMENTS:**

### **🔥 EXPORT-RECOVERY-AGENT-1: Core Types Consolidation**

**TARGET**: Fix 1036 errors (7 types × 148 instances each)
**FILES**: `lib/types/toolEndpointAdapter.ts` + source files
**TIME**: 1.5 hours

#### **MISSION:**
```markdown
🎯 EXPORT-RECOVERY-AGENT-1 Assignment

TARGET: 1036 TS2305 errors - core missing exports
PRIMARY FILE: lib/types/toolEndpointAdapter.ts
FOCUS: Add missing type exports and consolidate duplicates

MISSING EXPORTS TO FIX:
✅ XcpBalance (148 errors) - Currently in services.d.ts, ui.d.ts, utils.d.ts
✅ ToolEstimationParams (148 errors) - Currently in fee.d.ts
✅ NamespaceImport (148 errors) - Find source and move
✅ MockResponse (148 errors) - Find source and move
✅ InputData (148 errors) - Find source and move
✅ FeeAlert (148 errors) - Find source and move
✅ ColumnDefinition (148 errors) - Find source and move

STRATEGY:
1. Find authoritative definition of each type
2. Move/export from toolEndpointAdapter.ts
3. Remove duplicates from other files
4. Verify no import breakage

COORDINATION:
• Work in lib/types/*.d.ts files only
• Use grep to find all instances before moving
• Test with `deno check main.ts` after each type fix
```

---

### **⚡ EXPORT-RECOVERY-AGENT-2: Layout Types**

**TARGET**: Fix 5 TS2305 errors
**FILES**: `components/layout/types.ts`
**TIME**: 30 minutes

#### **MISSION:**
```markdown
🎯 EXPORT-RECOVERY-AGENT-2 Assignment

TARGET: 5 TS2305 errors - layout component types
PRIMARY FILE: components/layout/types.ts
FOCUS: Add missing TableProps and related exports

MISSING EXPORTS TO FIX:
✅ TableProps (1 error)
✅ Other layout-related missing exports

STRATEGY:
1. Check what's trying to import TableProps
2. Define proper interface in components/layout/types.ts
3. Export TableProps and any related types
4. Verify component imports work

COORDINATION:
• Work in components/layout/ directory only
• Focus on UI component type definitions
• Ensure compatibility with existing components
```

---

### **⚙️ EXPORT-RECOVERY-AGENT-3: Bitcoin Constants**

**TARGET**: Fix 8 TS2551 errors
**FILES**: Bitcoin transaction service files
**TIME**: 15 minutes

#### **MISSION:**
```markdown
🎯 EXPORT-RECOVERY-AGENT-3 Assignment

TARGET: 8 TS2551 errors - Bitcoin transaction constant mismatches
FOCUS: Fix SIGHASH constant usage in Bitcoin transaction services

ERRORS TO FIX:
✅ Transaction.SIGHASH_ALL → Transaction.__SIGHASH_ALL
✅ Transaction.SIGHASH_SINGLE → Transaction.__SIGHASH_SINGLE
✅ Transaction.SIGHASH_ANYONECANPAY → Transaction.__SIGHASH_ANYONECANPAY

STRATEGY:
1. Find all instances of Transaction.SIGHASH_* usage
2. Replace with Transaction.__SIGHASH_* (double underscore)
3. Verify bitcoinjs-lib compatibility
4. Test transaction functionality

COORDINATION:
• Work in server/services/transaction/ files primarily
• Quick win - straightforward find/replace
• Critical for Bitcoin transaction functionality
```

---

## 📊 **EXPECTED IMPACT:**

### **Before Recovery:**
- **Total Errors**: 2054
- **TS2305 Errors**: 1041 (51% of all errors)

### **After Recovery:**
- **AGENT-1**: -1036 errors (core exports)
- **AGENT-2**: -5 errors (layout types)
- **AGENT-3**: -8 errors (Bitcoin constants)
- **Expected Total**: ~1005 errors
- **Success Metric**: **51% error reduction!**

---

## 🚨 **CRITICAL AGENT INSTRUCTIONS:**

### **⚠️ BITCOIN CONSTANTS - NO UNDERSCORES!**
**IMPORTANT**: 8 TS2551 errors from incorrect Bitcoin transaction constants usage.

**❌ WRONG (causing errors):**
```typescript
Transaction.SIGHASH_ALL
Transaction.SIGHASH_SINGLE
Transaction.SIGHASH_ANYONECANPAY
```

**✅ CORRECT (bitcoinjs-lib API):**
```typescript
Transaction.__SIGHASH_ALL
Transaction.__SIGHASH_SINGLE
Transaction.__SIGHASH_ANYONECANPAY
```

**AGENT NOTE**: If you encounter Bitcoin transaction constants during type fixes, use the **double underscore** versions (`__SIGHASH_*`), not the single underscore or no-underscore versions!

---

## 🤝 **COORDINATION PROTOCOL:**

### **AGENT-1 Priorities:**
1. **XcpBalance** (highest frequency)
2. **ToolEstimationParams**
3. **InputData**, **FeeAlert**, **ColumnDefinition**
4. **NamespaceImport**, **MockResponse**

### **Verification Steps:**
```bash
# Run after each type fix
deno check --unstable-byonm main.ts 2>&1 | grep -c "ERROR"

# Check specific type resolution
deno check --unstable-byonm main.ts 2>&1 | grep "XcpBalance"
```

### **Success Indicators:**
- ✅ Error count drops by ~148 per type fixed
- ✅ No new import errors introduced
- ✅ Types consolidated (remove duplicates)

---

## 🚀 **DEPLOYMENT READY:**

All three agents can work **in parallel** with zero conflict risk:
- **AGENT-1**: `lib/types/` directory (core exports)
- **AGENT-2**: `components/layout/` directory (layout types)
- **AGENT-3**: `server/services/transaction/` directory (Bitcoin constants)

**Estimated Completion**: 2 hours parallel execution
**Target Result**: **Below 1005 total errors!** 🎉
