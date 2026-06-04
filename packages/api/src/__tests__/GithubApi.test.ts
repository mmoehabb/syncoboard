import { expect, test, describe, mock, beforeEach, afterEach } from "bun:test";
import { GithubApi } from "../GithubApi";

describe("GithubApi", () => {
  let githubApi: GithubApi;

  beforeEach(() => {
    githubApi = new GithubApi();

    // We mock the generic 'get' method inherited from ApiClient.
    // Instead of mocking ApiClient.prototype.get which is protected,
    // we can cast githubApi to any and mock its 'get' method directly.
    (githubApi as any).get = mock().mockResolvedValue({
      data: {
        repos: [
          { id: "1", name: "repo1", fullName: "user/repo1" },
          { id: "2", name: "repo2", fullName: "user/repo2" }
        ]
      }
    });
  });

  afterEach(() => {
    mock.restore();
  });

  describe("getRepos", () => {
    test("should fetch repos without workspaceId", async () => {
      const repos = await githubApi.getRepos();

      expect((githubApi as any).get).toHaveBeenCalledTimes(1);
      expect((githubApi as any).get).toHaveBeenCalledWith("/repos?");
      expect(repos).toEqual([
        { id: "1", name: "repo1", fullName: "user/repo1" },
        { id: "2", name: "repo2", fullName: "user/repo2" }
      ] as any);
    });

    test("should fetch repos with workspaceId", async () => {
      const repos = await githubApi.getRepos("workspace-123");

      expect((githubApi as any).get).toHaveBeenCalledTimes(1);
      expect((githubApi as any).get).toHaveBeenCalledWith("/repos?workspaceId=workspace-123");
      expect(repos).toEqual([
        { id: "1", name: "repo1", fullName: "user/repo1" },
        { id: "2", name: "repo2", fullName: "user/repo2" }
      ] as any);
    });
  });
});
