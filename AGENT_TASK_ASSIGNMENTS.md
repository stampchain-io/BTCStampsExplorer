# 🎯 Agent Task Assignment Instructions

## 📊 Current Status: 692 TypeScript Errors (Down from 721!)

**Phase 1 ✅ COMPLETE** - Foundation work done!
**Phase 2 🚀 READY FOR DEPLOYMENT** - Deploy these 3 agents in parallel NOW

---

## 🤖 AGENT ASSIGNMENT PROTOCOL

### **Step 1: Copy Assignment Below and Send to Each Agent**

#### **🟠 PROPERTY-AGENT Assignment**
```
TASK ASSIGNMENT: TypeScript Property Error Resolution

TARGET: 128 TS2339 "Property does not exist" errors
PRIORITY: High Impact - Phase 2
ESTIMATED EFFORT: 3 hours
FILE FOCUS: components/**/*.tsx, islands/**/*.tsx

SPECIFIC INSTRUCTIONS:
1. Focus ONLY on TS2339 errors in component and island files
2. Run monitoring script to see your current error list:
   deno run --allow-run --allow-read --allow-write scripts/type-error-monitor.ts

3. Typical fixes needed:
   - Add missing property definitions to interfaces
   - Import missing type definitions
   - Fix exactOptionalPropertyTypes issues (add undefined to optional props)
   - Update component prop types

4. COORDINATION RULES:
   - Work in components/ and islands/ directories only
   - Avoid lib/types/ files (other agents handle those)
   - Report progress every 25% (32, 64, 96, 128 errors fixed)
   - Update Taskmaster subtask 43.15 when complete

5. VALIDATION:
   - Run: deno check on files you modify
   - Ensure no new errors introduced
   - Final check: total TS2339 count should decrease

START IMMEDIATELY - You can work in parallel with other agents!
```

#### **🟠 ASSIGNMENT-AGENT Assignment**
```
TASK ASSIGNMENT: TypeScript Type Assignment Error Resolution

TARGET: 152 TS2322 "Type assignment" errors
PRIORITY: High Impact - Phase 2
ESTIMATED EFFORT: 3 hours
FILE FOCUS: lib/**/*.ts, server/**/*.ts (excluding lib/types/)

SPECIFIC INSTRUCTIONS:
1. Focus ONLY on TS2322 errors in lib and server files
2. Run monitoring script to see your current error list:
   deno run --allow-run --allow-read --allow-write scripts/type-error-monitor.ts

3. Typical fixes needed:
   - Fix type mismatches in function returns
   - Correct variable type annotations
   - Update interface implementations
   - Fix generic type parameters

4. COORDINATION RULES:
   - Work in lib/ and server/ directories (avoid lib/types/)
   - Stay away from components/islands (property-agent handles those)
   - Report progress every 25% (38, 76, 114, 152 errors fixed)
   - Update Taskmaster subtask 43.16 when complete

5. VALIDATION:
   - Run: deno check on files you modify
   - Ensure no new errors introduced
   - Final check: total TS2322 count should decrease

START IMMEDIATELY - You can work in parallel with other agents!
```

#### **🟠 CLEANUP-AGENT Assignment**
```
TASK ASSIGNMENT: TypeScript Unused Code Cleanup

TARGET: 43 TS6133/TS6196 "Unused variable/import" errors
PRIORITY: High Impact - Phase 2
ESTIMATED EFFORT: 1 hour
FILE FOCUS: **/*.ts, **/*.tsx (all files)

SPECIFIC INSTRUCTIONS:
1. Focus ONLY on TS6133 and TS6196 errors across all files
2. Run monitoring script to see your current error list:
   deno run --allow-run --allow-read --allow-write scripts/type-error-monitor.ts

3. Typical fixes needed:
   - Remove unused import statements
   - Remove unused variable declarations
   - Remove unused function parameters (or prefix with _)
   - Clean up dead code

4. COORDINATION RULES:
   - Can work in any file (these are safe cleanup operations)
   - Just remove unused code - don't modify logic
   - Report progress every 25% (11, 22, 32, 43 errors fixed)
   - This is the fastest task - should complete in 1 hour

5. VALIDATION:
   - Run: deno check on files you modify
   - Ensure functionality still works after cleanup
   - Final check: total TS6133/6196 count should reach 0

START IMMEDIATELY - This task is independent and safe to run with others!
```

---

## 📋 **Step 2: Agent Coordination Commands**

### **For All Agents - Start With These Commands:**
```bash
# 1. Get current status (each agent should run this)
deno run --allow-run --allow-read --allow-write scripts/type-error-monitor.ts

# 2. Keep monitoring running in separate terminal (one agent can handle this)
deno run --allow-run --allow-read --allow-write scripts/type-error-monitor.ts --watch

# 3. Check your specific error types (example for property-agent)
deno check main.ts 2>&1 | grep "TS2339"
```

### **Progress Reporting Format:**
Each agent should report like this:
```
AGENT: property-agent
PROGRESS: 32/128 TS2339 errors fixed (25%)
STATUS: Working on components/card/ directory
CONFLICTS: None
ETA: 2.25 hours remaining
```

---

## 🎯 **Step 3: After Phase 2 Completes (3 hours)**

Once the above 3 agents complete their work, deploy **Phase 3 Specialists:**

#### **🟡 JSX-AGENT** (Next Priority)
- Target: 37 JSX/React errors (TS2345, TS2375, TS18047)
- Focus: **/*.tsx files
- Depends on property-agent completion

#### **🟡 INTERFACE-AGENT** (Next Priority)
- Target: 67 interface errors (TS2724, TS2353, TS2717)
- Focus: lib/types/*.d.ts
- Can start after foundation work

#### **🟡 FUNCTION-AGENT** (Next Priority)
- Target: 37 function call errors (TS2554, TS2345)
- Focus: **/*.ts files
- Can start after foundation work

---

## 📊 **Monitoring Dashboard Commands**

### **Real-Time Progress Tracking:**
```bash
# Keep this running in a dedicated terminal
deno run --allow-run --allow-read --allow-write scripts/type-error-monitor.ts --watch
```

### **Quick Status Check:**
```bash
# Any agent can run this for instant status
deno run --allow-run --allow-read --allow-write scripts/type-error-monitor.ts
```

### **Validate Progress:**
```bash
# Check total error count (should be decreasing)
deno check main.ts 2>&1 | grep -c "ERROR"
```

---

## 🚨 **Critical Success Rules**

1. **START PHASE 2 NOW** - All 3 agents can work simultaneously
2. **REPORT PROGRESS** - Every 25% completion
3. **AVOID CONFLICTS** - Each agent has different file focus areas
4. **VALIDATE INCREMENTALLY** - Test your changes frequently
5. **MONITOR CONTINUOUSLY** - Keep error tracking running

**Expected Result: 692 errors → ~350 errors after Phase 2 (3 hours)**

Deploy these 3 agents immediately for maximum parallel efficiency! 🚀
