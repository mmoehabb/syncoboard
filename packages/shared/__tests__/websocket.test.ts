import { test, expect, describe } from "bun:test";
import {
  encodeBoardRoomName,
  decodeBoardRoomName,
  encodeUserRoomName,
  decodeUserRoomName,
} from "../src/websocket";

describe("Websocket Room Name Encoding/Decoding", () => {
  describe("Board Room Names", () => {
    test("encodeBoardRoomName adds prefix correctly", () => {
      expect(encodeBoardRoomName("123")).toBe("board_123");
      expect(encodeBoardRoomName("abc-xyz")).toBe("board_abc-xyz");
      expect(encodeBoardRoomName("")).toBe("board_");
    });

    test("decodeBoardRoomName decodes valid prefixes", () => {
      expect(decodeBoardRoomName("board_123")).toBe("123");
      expect(decodeBoardRoomName("board_abc-xyz")).toBe("abc-xyz");
      expect(decodeBoardRoomName("board_")).toBe("");
    });

    test("decodeBoardRoomName returns null for invalid prefixes", () => {
      expect(decodeBoardRoomName("user_123")).toBeNull();
      expect(decodeBoardRoomName("board123")).toBeNull();
      expect(decodeBoardRoomName("123")).toBeNull();
      expect(decodeBoardRoomName("")).toBeNull();
    });
  });

  describe("User Room Names", () => {
    test("encodeUserRoomName adds prefix correctly", () => {
      expect(encodeUserRoomName("123")).toBe("user_123");
      expect(encodeUserRoomName("abc-xyz")).toBe("user_abc-xyz");
      expect(encodeUserRoomName("")).toBe("user_");
    });

    test("decodeUserRoomName decodes valid prefixes", () => {
      expect(decodeUserRoomName("user_123")).toBe("123");
      expect(decodeUserRoomName("user_abc-xyz")).toBe("abc-xyz");
      expect(decodeUserRoomName("user_")).toBe("");
    });

    test("decodeUserRoomName returns null for invalid prefixes", () => {
      expect(decodeUserRoomName("board_123")).toBeNull();
      expect(decodeUserRoomName("user123")).toBeNull();
      expect(decodeUserRoomName("123")).toBeNull();
      expect(decodeUserRoomName("")).toBeNull();
    });
  });
});
