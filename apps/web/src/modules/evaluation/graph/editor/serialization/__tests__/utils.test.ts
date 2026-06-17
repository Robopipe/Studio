import {
  parseNullableNumber,
  parseRequiredNumber,
} from "@/modules/evaluation/graph/editor/serialization/utils";
import { describe, expect, it } from "vitest";

describe("parseRequiredNumber", () => {
  it("parses a valid integer string", () => {
    expect(parseRequiredNumber("42", "required")).toBe(42);
  });

  it("parses a numeric value directly", () => {
    expect(parseRequiredNumber(7, "required")).toBe(7);
  });

  it("parses zero", () => {
    expect(parseRequiredNumber(0, "required")).toBe(0);
  });

  it("parses a float string", () => {
    expect(parseRequiredNumber("3.14", "required")).toBeCloseTo(3.14);
  });

  it("throws on null", () => {
    expect(() => parseRequiredNumber(null, "msg")).toThrow("msg");
  });

  it("throws on undefined", () => {
    expect(() => parseRequiredNumber(undefined, "msg")).toThrow("msg");
  });

  it("throws on empty string", () => {
    expect(() => parseRequiredNumber("", "msg")).toThrow("msg");
  });

  it("throws on a non-numeric string", () => {
    expect(() => parseRequiredNumber("abc", "msg")).toThrow("msg");
  });

  it("throws on Infinity", () => {
    expect(() => parseRequiredNumber(Infinity, "msg")).toThrow("msg");
  });

  it("throws on NaN (via NaN coercion)", () => {
    expect(() => parseRequiredNumber(NaN, "msg")).toThrow("msg");
  });
});

describe("parseNullableNumber", () => {
  it("returns null for null", () => {
    expect(parseNullableNumber(null)).toBeNull();
  });

  it("returns null for undefined", () => {
    expect(parseNullableNumber(undefined)).toBeNull();
  });

  it("returns null for empty string", () => {
    expect(parseNullableNumber("")).toBeNull();
  });

  it("parses a valid integer string", () => {
    expect(parseNullableNumber("10")).toBe(10);
  });

  it("parses a numeric value directly", () => {
    expect(parseNullableNumber(5)).toBe(5);
  });

  it("parses zero", () => {
    expect(parseNullableNumber(0)).toBe(0);
  });

  it("returns null for a non-numeric string", () => {
    expect(parseNullableNumber("abc")).toBeNull();
  });

  it("returns null for Infinity", () => {
    expect(parseNullableNumber(Infinity)).toBeNull();
  });
});
