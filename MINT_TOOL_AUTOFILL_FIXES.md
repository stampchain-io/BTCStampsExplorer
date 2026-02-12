# Mint Tool Autofill Debug & Fixes

## Issues Found and Fixed

### 0. **CRITICAL: onChange handler receiving value instead of event** ✅ FIXED
**Problem:** The `SRC20InputField` component passes the value directly to `onChange` (line 24: `onChange(e.currentTarget.value)`), but MintTool was treating it as an event object and trying to access `e.target.value`, causing a runtime error: "Cannot read properties of undefined (reading 'value')".

**Fix:** Changed the onChange handler parameter from `(e)` to `(value)` and removed the `.target.value` access (line 561):
```typescript
// Before:
onChange={(e) => {
  const newValue = (e.target as HTMLInputElement).value.toUpperCase();
  
// After:
onChange={(value) => {
  const newValue = value.toUpperCase();
```

**Impact:** This was preventing ANY typing from working at all. Must be fixed first!

### 1. **`tick` prop blocking search** ✅ FIXED
**Problem:** The search effect had `if (isSelecting || tick || isSwitchingFields)` which blocked search whenever the `tick` prop was set (e.g., from URL `?tick=GODS`).

**Fix:** Removed `tick` from the guard condition and from the effect dependencies.
- Line 229: Changed to `if (isSelecting || isSwitchingFields)`
- Line 320: Removed `tick` from dependency array

### 2. **Selection flags never reset** ✅ FIXED  
**Problem:** `handleResultClick` set `isSelecting(true)` and `isSwitchingFields(true)` but never reset them in `finally`.

**Fix:** Added to finally block (lines 334-335):
```typescript
setIsSelecting(false);
setIsSwitchingFields(false);
```

### 3. **Stale closure in dropdown visibility check** ✅ FIXED
**Problem:** Inside the 300ms setTimeout callback, we checked `if (!isSelecting && !isSwitchingFields)` before setting `openDrop(true)`. These were stale values from when the effect ran, not current values. Then at render time, the dropdown checks the CURRENT values, causing a mismatch.

**Fix:** Removed the stale check - now always set `openDrop(true)` when results arrive (line 286-288). The render condition already checks current `!isSelecting` state.

### 4. **Dropdown not reopening on refocus** ✅ FIXED
**Problem:** When user typed, blurred, then focused again, the dropdown wouldn't reopen because `onFocus` only set `openDrop` when `searchTerm` was empty.

**Fix:** Changed `onFocus` to reopen dropdown whenever we have `searchResults` (lines 573-579):
```typescript
onFocus={() => {
  setIsSelecting(false);
  // Re-open dropdown if we have results
  if (searchResults.length > 0 && !isSwitchingFields) {
    setOpenDrop(true);
    setDropdownAnimation("enter");
  }
}}
```

### 5. **Missing API error handling** ✅ FIXED
**Problem:** Search fetch didn't check `response.ok` before parsing JSON.

**Fix:** Added `response.ok` check and proper error logging (lines 275-283).

### 6. **Added comprehensive debug logging** ✅ ADDED
Added detailed logging at every step of the search flow to help diagnose issues:
- Effect trigger and guard checks
- Search scheduling
- Fetch execution and response
- Results parsing and dropdown state changes

## Current Issues to Investigate

### "Failed to fetch" Error on `?tick=GODS`

The screenshot shows "Failed to fetch" when accessing `/mint?tick=GODS`. This suggests:

1. **Wrong URL?** The correct URL should be `/tool/src20/mint?tick=GODS`, not `/mint?tick=GODS`. Check if you're using the correct route.

2. **API Endpoint Not Available:** The error comes from `handleResultClick` trying to fetch `/api/v2/src20/tick/GODS/mintData`. This could fail if:
   - Server isn't running
   - Database connection issue
   - CORS issue (check browser console)
   - Endpoint returns 404/500

3. **Network Issue:** "Failed to fetch" is a browser error that occurs when the fetch request cannot complete (network error, CORS, refused connection, etc.).

## Testing Instructions

### 1. Check Browser Console
Open browser DevTools (F12) and check the Console tab. Look for:
- `[stamps]` log messages showing the search flow
- Network errors or CORS errors
- Any JavaScript errors

### 2. Check Network Tab
In DevTools Network tab, filter for:
- `/api/v2/src20/search?q=...` - Should return 200 with `{data: [...]}`
- `/api/v2/src20/tick/{TICK}/mintData` - Should return 200 with `{mintStatus: {...}, holders: N}`

### 3. Test Direct Access
1. Navigate to `/tool/src20/mint` (no tick param)
2. Open browser console
3. Type "GOD" in the token field
4. Watch console logs - should see:
   ```
   Search effect triggered: {searchTerm: "GOD", isSelecting: false, isSwitchingFields: false}
   Search: scheduling search
   Search: executing fetch
   Search: fetch complete: {status: 200, ok: true}
   Search: parsed JSON: {hasData: true, isArray: true, length: X}
   Search: results set, opening dropdown
   ```
5. Dropdown should appear with matching tokens

### 4. Test With Tick Param
1. Navigate to `/tool/src20/mint?tick=GODS`
2. Page should load with GODS pre-filled
3. Check console for any errors during `handleResultClick`
4. Clear the field and type another token
5. Dropdown should appear

## If Still Not Working

1. **Check server is running:**
   ```bash
   deno task dev
   ```

2. **Check the mintData endpoint directly:**
   ```bash
   curl http://localhost:8000/api/v2/src20/tick/GODS/mintData
   ```
   Should return JSON with mintStatus and holders.

3. **Check the search endpoint:**
   ```bash
   curl "http://localhost:8000/api/v2/src20/search?q=GOD&mintable_only=true"
   ```
   Should return JSON with data array.

4. **Share browser console logs:** The detailed logging will show exactly where the flow breaks.

## Code Changes Summary

**File:** `islands/tool/src20/MintTool.tsx`

**Lines changed:**
- **561-571: CRITICAL FIX - Changed onChange to accept value directly instead of event object**
- 229: Removed `tick` from guard condition
- 273-319: Added comprehensive logging throughout search effect  
- 286-288: Removed stale closure check, always set openDrop when we have results
- 320: Removed `tick` from effect dependencies
- 334-335: Reset selection flags in finally block
- 573-579: Changed onFocus to reopen dropdown when searchResults exist

**All TypeScript checks pass:** ✅
**All lint checks pass:** ✅
**All format checks pass:** ✅

## Root Cause of "Nothing Works"

The runtime error `TypeError: Cannot read properties of undefined (reading 'value')` was the PRIMARY blocker. The `SRC20InputField` component calls `onChange(e.currentTarget.value)` passing just the string value, but MintTool was expecting a full event object. This caused an immediate crash on any keystroke, preventing all other fixes from being testable.
