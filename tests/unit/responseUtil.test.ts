import { assertEquals, assertInstanceOf } from "@std/assert";
import { ResponseUtil } from "$lib/utils/responseUtil.ts";

Deno.test("responseUtil - success creates Response", () => {
  const data = { message: "Success" };
  const response = ResponseUtil.success(data);

  assertInstanceOf(response, Response);
  assertEquals(response.status, 200);
});

Deno.test("responseUtil - success with custom options", async () => {
  const data = { value: 42 };
  const options = {
    headers: { "X-Custom": "test" },
    forceNoCache: false,
  };
  const response = ResponseUtil.success(data, options);

  assertInstanceOf(response, Response);
  assertEquals(response.status, 200);

  // Check the response body
  const body = await response.json();
  assertEquals(body, data);
});

Deno.test("responseUtil - custom creates Response with status", () => {
  const body = { error: "Custom error" };
  const status = 418; // I'm a teapot
  const response = ResponseUtil.custom(body, status);

  assertInstanceOf(response, Response);
  assertEquals(response.status, status);
});

Deno.test("responseUtil - custom with options", () => {
  const body = "Plain text response";
  const status = 201;
  const options = {
    headers: { "Content-Type": "text/plain" },
  };
  const response = ResponseUtil.custom(body, status, options);

  assertInstanceOf(response, Response);
  assertEquals(response.status, status);
});

Deno.test("responseUtil - badRequest creates 400 Response", async () => {
  const message = "Invalid input";
  const response = ResponseUtil.badRequest(message);

  assertInstanceOf(response, Response);
  assertEquals(response.status, 400);

  // Check the response body
  const body = await response.json();
  assertEquals(body.error, message);
});

Deno.test("responseUtil - badRequest with options", () => {
  const message = "Bad request with options";
  const options = {
    headers: { "X-Error": "true" },
  };
  const response = ResponseUtil.badRequest(message, options);

  assertInstanceOf(response, Response);
  assertEquals(response.status, 400);
});

Deno.test("responseUtil - notFound creates 404 Response", async () => {
  const response = ResponseUtil.notFound();

  assertInstanceOf(response, Response);
  assertEquals(response.status, 404);

  // Check the response body
  const body = await response.json();
  assertEquals(body.error, "Not Found");
});

Deno.test("responseUtil - notFound with custom message", async () => {
  const message = "Resource not found";
  const response = ResponseUtil.notFound(message);

  assertInstanceOf(response, Response);
  assertEquals(response.status, 404);

  const body = await response.json();
  assertEquals(body.error, message);
});

Deno.test("responseUtil - internalError creates 500 Response", async () => {
  const error = new Error("Test error");
  const response = ResponseUtil.internalError(error);

  assertInstanceOf(response, Response);
  assertEquals(response.status, 500);

  const body = await response.json();
  assertEquals(body.error, "Internal server error");
});

Deno.test("responseUtil - internalError with custom message", async () => {
  const error = { code: "DB_ERROR", details: "Connection failed" };
  const message = "Database error occurred";
  const response = ResponseUtil.internalError(error, message);

  assertInstanceOf(response, Response);
  assertEquals(response.status, 500);

  const body = await response.json();
  assertEquals(body.error, message);
});

Deno.test("responseUtil - internalError with options", () => {
  const error = "String error";
  const message = "Custom error message";
  const options = {
    headers: { "X-Error-Code": "500" },
  };
  const response = ResponseUtil.internalError(error, message, options);

  assertInstanceOf(response, Response);
  assertEquals(response.status, 500);
});
