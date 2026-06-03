export type SerializedBigInt<T> = T extends bigint
  ? string
  : T extends Date
  ? T
  : T extends Array<infer U>
  ? Array<SerializedBigInt<U>>
  : T extends object
  ? { [K in keyof T]: SerializedBigInt<T[K]> }
  : T;

export function serializeBigInt<T>(obj: T): SerializedBigInt<T> {
  if (obj === null || obj === undefined) {
    return obj as unknown as SerializedBigInt<T>;
  }

  if (typeof obj === "bigint") {
    return obj.toString() as unknown as SerializedBigInt<T>;
  }

  if (Array.isArray(obj)) {
    return obj.map(serializeBigInt) as unknown as SerializedBigInt<T>;
  }

  if (typeof obj === "object") {
    if (obj instanceof Date) {
      return obj as unknown as SerializedBigInt<T>;
    }

    const result = {} as Record<keyof T, unknown>;
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        result[key as keyof T] = serializeBigInt(obj[key as keyof T]);
      }
    }
    return result as unknown as SerializedBigInt<T>;
  }

  return obj as unknown as SerializedBigInt<T>;
}
