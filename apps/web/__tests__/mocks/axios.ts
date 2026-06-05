import { mock } from "bun:test";

export const mockAxiosInstance = {
  post: mock(),
  get: mock(),
  put: mock(),
  patch: mock(),
  delete: mock(),
  defaults: {},
  interceptors: {
    request: {
      use: mock(() => {}),
    },
    response: {
      use: mock(() => {}),
    },
  },
};

const callAdapter = (config: unknown) => {
  const adapter = (
    mockAxiosInstance.defaults as {
      adapter?: (cfg: unknown) => Promise<unknown>;
    }
  ).adapter;
  if (typeof adapter === "function") {
    return Promise.resolve(adapter(config));
  }
  return Promise.resolve({ data: {} });
};

// Return promises with required structure. By default these will resolve with empty objects if not overridden.
// When `defaults.adapter` is set, the adapter is invoked so tests can inspect or override request handling.
mockAxiosInstance.post.mockImplementation(
  (_url: unknown, _data: unknown, config: unknown) => callAdapter(config ?? {}),
);
mockAxiosInstance.get.mockImplementation((_url: unknown, config: unknown) =>
  callAdapter(config ?? {}),
);
mockAxiosInstance.put.mockImplementation(
  (_url: unknown, _data: unknown, config: unknown) => callAdapter(config ?? {}),
);
mockAxiosInstance.patch.mockImplementation(
  (_url: unknown, _data: unknown, config: unknown) => callAdapter(config ?? {}),
);
mockAxiosInstance.delete.mockImplementation((_url: unknown, config: unknown) =>
  callAdapter(config ?? {}),
);

// In bun:test, mocking entire modules must match the export shape exactly.
mock.module("axios", () => {
  return {
    default: {
      create: mock(() => mockAxiosInstance),
    },
    create: mock(() => mockAxiosInstance),
  };
});
