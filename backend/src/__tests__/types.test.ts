import { describe, expect, test } from "bun:test";
import { parsePagination } from "../types";

describe("parsePagination", () => {
  test("returns defaults when no query provided", () => {
    const result = parsePagination({});
    expect(result.page).toBe(1);
    expect(result.limit).toBe(20);
    expect(result.skip).toBe(0);
  });

  test("returns defaults when query is empty", () => {
    const result = parsePagination({ page: undefined, limit: undefined });
    expect(result.page).toBe(1);
    expect(result.limit).toBe(20);
    expect(result.skip).toBe(0);
  });

  test("parses page and limit from strings", () => {
    const result = parsePagination({ page: "3", limit: "10" });
    expect(result.page).toBe(3);
    expect(result.limit).toBe(10);
    expect(result.skip).toBe(20);
  });

  test("parses page and limit from numbers", () => {
    const result = parsePagination({ page: "2", limit: "5" });
    expect(result.page).toBe(2);
    expect(result.limit).toBe(5);
    expect(result.skip).toBe(5);
  });

  test("clamps page minimum to 1", () => {
    const result = parsePagination({ page: "0", limit: "10" });
    expect(result.page).toBe(1);
    expect(result.skip).toBe(0);
  });

  test("clamps page minimum when negative", () => {
    const result = parsePagination({ page: "-5", limit: "10" });
    expect(result.page).toBe(1);
    expect(result.skip).toBe(0);
  });

  test("clamps limit minimum to 1", () => {
    const result = parsePagination({ page: "1", limit: "0" });
    expect(result.limit).toBe(1);
  });

  test("clamps limit to maxLimit", () => {
    const result = parsePagination({ page: "1", limit: "200" }, 100);
    expect(result.limit).toBe(100);
  });

  test("uses custom maxLimit", () => {
    const result = parsePagination({ page: "1", limit: "50" }, 30);
    expect(result.limit).toBe(30);
  });

  test("default maxLimit is 100", () => {
    const result = parsePagination({ page: "1", limit: "150" });
    expect(result.limit).toBe(100);
  });

  test("handles NaN gracefully", () => {
    const result = parsePagination({ page: "abc", limit: "xyz" });
    expect(result.page).toBe(1);
    expect(result.limit).toBe(20);
  });

  test("computes skip correctly for page 1", () => {
    const result = parsePagination({ page: "1", limit: "25" });
    expect(result.skip).toBe(0);
  });

  test("computes skip correctly for large page", () => {
    const result = parsePagination({ page: "10", limit: "10" });
    expect(result.skip).toBe(90);
  });
});
