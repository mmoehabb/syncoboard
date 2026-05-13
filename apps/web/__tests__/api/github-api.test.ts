import { describe, it, expect, beforeEach } from "bun:test";
import { mockAxiosInstance } from "../mocks/axios";
import type { AxiosInstance } from "axios";
import type { AxiosInstance } from "axios";

import { GithubApi } from "../../../../packages/api/src/GithubApi";

describe("GithubApi", () => {
  let githubApi: GithubApi;

  beforeEach(() => {
    mockAxiosInstance.get.mockClear();
    githubApi = new GithubApi();
    // @ts-expect-error mocking axios
    githubApi["client"] = mockAxiosInstance;
  });

  describe("getRepos", () => {
    it("should call GET /repos with workspaceId when provided", async () => {
      const workspaceId = "ws_123";
      const mockRepos = [
        { id: "repo_1", name: "owner/repo-1", fullName: "owner/repo-1" },
        { id: "repo_2", name: "owner/repo-2", fullName: "owner/repo-2" },
      ];

      mockAxiosInstance.get.mockResolvedValueOnce({
        data: { repos: mockRepos },
      });

      const result = await githubApi.getRepos(workspaceId);

      const params = new URLSearchParams();
      params.append("workspaceId", workspaceId);

      expect(mockAxiosInstance.get).toHaveBeenCalledWith(
        `/repos?${params.toString()}`,
        undefined,
      );
      expect(result).toEqual(mockRepos);
    });

    it("should call GET /repos without workspaceId when not provided", async () => {
      const mockRepos = [
        { id: "repo_1", name: "owner/repo-1", fullName: "owner/repo-1" },
      ];

      mockAxiosInstance.get.mockResolvedValueOnce({
        data: { repos: mockRepos },
      });

      const result = await githubApi.getRepos();

      expect(mockAxiosInstance.get).toHaveBeenCalledWith("/repos?", undefined);
      expect(result).toEqual(mockRepos);
    });

    it("should propagate errors", async () => {
      const error = new Error("Network Error");
      mockAxiosInstance.get.mockRejectedValueOnce(error);

      await expect(githubApi.getRepos()).rejects.toThrow("Network Error");
    });
  });
});
