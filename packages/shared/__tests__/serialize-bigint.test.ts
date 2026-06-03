import { test, describe, expect } from "bun:test";
import { serializeBigInt } from "../src/serialize-bigint";

describe("serializeBigInt", () => {
  test("handles null and undefined", () => {
    expect(serializeBigInt(null)).toBeNull();
    expect(serializeBigInt(undefined)).toBeUndefined();
  });

  test("handles primitive types that are not bigint", () => {
    expect(serializeBigInt("test string")).toBe("test string");
    expect(serializeBigInt(42)).toBe(42);
    expect(serializeBigInt(true)).toBe(true);
    expect(serializeBigInt(false)).toBe(false);
  });

  test("serializes bigint to string", () => {
    expect(serializeBigInt(BigInt(123))).toBe("123");
    expect(serializeBigInt(9007199254740991n)).toBe("9007199254740991");
  });

  test("serializes bigints inside arrays", () => {
    const input = [1, "two", BigInt(3), 4n];
    const expected = [1, "two", "3", "4"];
    expect(serializeBigInt(input)).toEqual(expected);
  });

  test("serializes bigints inside objects", () => {
    const input = {
      id: 123n,
      name: "test",
      count: 5n,
    };
    const expected = {
      id: "123",
      name: "test",
      count: "5",
    };
    expect(serializeBigInt(input)).toEqual(expected);
  });

  test("handles nested structures with bigints", () => {
    const input = {
      user: {
        id: 1000n,
        details: {
          age: 30,
          score: 50000n,
          history: [10n, 20n, "text"],
        },
      },
      tags: [1n, 2n],
    };
    const expected = {
      user: {
        id: "1000",
        details: {
          age: 30,
          score: "50000",
          history: ["10", "20", "text"],
        },
      },
      tags: ["1", "2"],
    };
    expect(serializeBigInt(input)).toEqual(expected);
  });

  test("preserves Date objects", () => {
    const date = new Date("2024-01-01T00:00:00Z");
    const input = {
      id: 123n,
      createdAt: date,
    };
    const expected = {
      id: "123",
      createdAt: date,
    };
    const result = serializeBigInt(input) as any;
    expect(result).toEqual(expected);
    expect(result.createdAt).toBeInstanceOf(Date);
    expect(result.createdAt.getTime()).toBe(date.getTime());
  });
});
