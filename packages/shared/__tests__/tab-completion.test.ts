import { describe, it, expect, mock } from "bun:test";
import { executeTabCompletion } from "../src/tab-completion";

describe("executeTabCompletion", () => {
  const defaultCommandRegistryKeys = [
    "cd",
    "ls",
    "delete-board",
    "invite-member",
    "leave-board",
    "rmv-member",
    "clear",
    "add-task",
  ];

  it("should do nothing if parts length is 0 (simulating edge case)", async () => {
    const setInputValue = mock();
    const printOutput = mock();
    const getDirectoryEntries = mock().mockResolvedValue({ entries: [] });

    // Using an object that overrides split to return an empty array to simulate this exact edge case
    const mockInputValue = {
      split: () => [] ,
    } ;

    await executeTabCompletion({
      inputValue: mockInputValue,
      virtualPath: "/",
      commandRegistryKeys: defaultCommandRegistryKeys,
      getDirectoryEntries,
      setInputValue,
      printOutput,
    });

    expect(setInputValue).not.toHaveBeenCalled();
    expect(printOutput).not.toHaveBeenCalled();
    expect(getDirectoryEntries).not.toHaveBeenCalled();
  });

  it("should autocomplete command name if it has exactly one match", async () => {
    const setInputValue = mock();
    const printOutput = mock();
    const getDirectoryEntries = mock().mockResolvedValue({ entries: [] });

    await executeTabCompletion({
      inputValue: "del",
      virtualPath: "/",
      commandRegistryKeys: defaultCommandRegistryKeys,
      getDirectoryEntries,
      setInputValue,
      printOutput,
    });

    expect(setInputValue).toHaveBeenCalledWith("delete-board ");
    expect(printOutput).not.toHaveBeenCalled();
  });

  it("should print options if command name has multiple matches", async () => {
    const setInputValue = mock();
    const printOutput = mock();
    const getDirectoryEntries = mock().mockResolvedValue({ entries: [] });

    await executeTabCompletion({
      inputValue: "l", // matches 'ls' and 'leave-board'
      virtualPath: "/",
      commandRegistryKeys: defaultCommandRegistryKeys,
      getDirectoryEntries,
      setInputValue,
      printOutput,
    });

    expect(setInputValue).not.toHaveBeenCalled();
    expect(printOutput).toHaveBeenCalledWith(["$ /l", "ls", "leave-board"]);
  });

  it("should ignore unsupported commands for path completion", async () => {
    const setInputValue = mock();
    const printOutput = mock();
    const getDirectoryEntries = mock().mockResolvedValue({ entries: [] });

    await executeTabCompletion({
      inputValue: "clear mypath",
      virtualPath: "/",
      commandRegistryKeys: defaultCommandRegistryKeys,
      getDirectoryEntries,
      setInputValue,
      printOutput,
    });

    expect(setInputValue).not.toHaveBeenCalled();
    expect(printOutput).not.toHaveBeenCalled();
    expect(getDirectoryEntries).not.toHaveBeenCalled();
  });

  it("should autocomplete path if there is exactly one match", async () => {
    const setInputValue = mock();
    const printOutput = mock();
    const getDirectoryEntries = mock().mockResolvedValue({
      entries: [
        { name: "My Workspace", type: "Workspace" },
        { name: "Another Workspace", type: "Workspace" },
      ],
    });

    await executeTabCompletion({
      inputValue: "cd my",
      virtualPath: "/",
      commandRegistryKeys: defaultCommandRegistryKeys,
      getDirectoryEntries,
      setInputValue,
      printOutput,
    });

    expect(getDirectoryEntries).toHaveBeenCalledWith("/");
    expect(setInputValue).toHaveBeenCalledWith("cd my-workspace");
    expect(printOutput).not.toHaveBeenCalled();
  });

  it("should autocomplete task path with exact casing", async () => {
    const setInputValue = mock();
    const printOutput = mock();
    const getDirectoryEntries = mock().mockResolvedValue({
      entries: [
        { name: "SYNC-123", type: "Task" },
        { name: "SYNC-456", type: "Task" },
      ],
    });

    await executeTabCompletion({
      inputValue: "cd SYNC-1",
      virtualPath: "/workspace-1/board-1",
      commandRegistryKeys: defaultCommandRegistryKeys,
      getDirectoryEntries,
      setInputValue,
      printOutput,
    });

    expect(getDirectoryEntries).toHaveBeenCalledWith("/workspace-1/board-1");
    expect(setInputValue).toHaveBeenCalledWith("cd SYNC-123");
  });

  it("should print path options if there are multiple matches", async () => {
    const setInputValue = mock();
    const printOutput = mock();
    const getDirectoryEntries = mock().mockResolvedValue({
      entries: [
        { name: "Workspace 1", type: "Workspace" },
        { name: "Workspace 2", type: "Workspace" },
      ],
    });

    await executeTabCompletion({
      inputValue: "cd wor",
      virtualPath: "/",
      commandRegistryKeys: defaultCommandRegistryKeys,
      getDirectoryEntries,
      setInputValue,
      printOutput,
    });

    expect(getDirectoryEntries).toHaveBeenCalledWith("/");
    expect(setInputValue).not.toHaveBeenCalled();
    expect(printOutput).toHaveBeenCalledWith([
      "$ /cd wor",
      "workspace-1",
      "workspace-2",
    ]);
  });

  it("should gracefully handle getDirectoryEntries errors", async () => {
    const setInputValue = mock();
    const printOutput = mock();
    const getDirectoryEntries = mock().mockRejectedValue(
      new Error("Network Error"),
    );

    await executeTabCompletion({
      inputValue: "cd wor",
      virtualPath: "/",
      commandRegistryKeys: defaultCommandRegistryKeys,
      getDirectoryEntries,
      setInputValue,
      printOutput,
    });

    expect(getDirectoryEntries).toHaveBeenCalledWith("/");
    expect(setInputValue).not.toHaveBeenCalled();
    expect(printOutput).not.toHaveBeenCalled();
  });
});
