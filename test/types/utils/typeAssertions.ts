/**
 * Type assertion utilities for compile-time type testing
 *
 * These utilities help validate type relationships and constraints
 * at compile time using TypeScript's type system.
 */

// Basic type equality assertion
export type AssertEqual<T, U> = T extends U ? U extends T ? true : false
  : false;

// Assert that a type extends another
export type AssertExtends<T, U> = T extends U ? true : false;

// Assert that a type is assignable to another
export type AssertAssignable<T, U> = U extends T ? true : false;

// Assert true constraint (forces compile error if false)
export type AssertTrue<T extends true> = T;

// Assert false constraint
export type AssertFalse<T extends false> = T;

// Assert that a type is never
export type AssertNever<T extends never> = T;

// Assert that a type has a specific property
export type AssertHasProperty<T, K extends keyof T> = T[K];

// Assert that a type is a specific literal type
export type AssertLiteral<T, U extends T> = U;

// Utility to extract keys of a type
export type Keys<T> = keyof T;

// Utility to make all properties optional
export type DeepPartial<T> = T extends object ? {
    [P in keyof T]?: DeepPartial<T[P]>;
  }
  : T;

// Utility to make all properties required
export type DeepRequired<T> = T extends object ? {
    [P in keyof T]-?: DeepRequired<T[P]>;
  }
  : T;

// Test if a type is any
export type IsAny<T> = 0 extends (1 & T) ? true : false;

// Test if a type is unknown
export type IsUnknown<T> = IsAny<T> extends true ? false
  : unknown extends T ? true
  : false;

// Test if a type is never
export type IsNever<T> = [T] extends [never] ? true : false;

// Helper to create compile-time type tests
export function typeTest<T extends true>(): void {
  // This function exists only for its type parameter
  // It ensures compile-time type checking
}
