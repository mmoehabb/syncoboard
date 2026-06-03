import { resolvePath } from "./path";

type DirectoryEntry = {
  name: string;
  type: string;
};

export const executeTabCompletion = async ({
  inputValue,
  virtualPath,
  commandRegistryKeys,
  getDirectoryEntries,
  setInputValue,
  printOutput,
}: {
  inputValue: string;
  virtualPath: string;
  commandRegistryKeys: string[];
  getDirectoryEntries: (path: string) => Promise<{ entries: DirectoryEntry[] }>;
  setInputValue: (val: string) => void;
  printOutput: (output: string[]) => void;
}) => {
  const commandsWithPaths = [
    "cd",
    "ls",
    "delete-board",
    "invite-member",
    "leave-board",
    "rmv-member",
  ];
  const parts = inputValue.split(" ");
  if (parts.length === 0) return;

  const cmdName = parts[0].toLowerCase();

  // Auto-complete command name itself
  if (parts.length === 1) {
    const matches = commandRegistryKeys.filter((c) => c.startsWith(cmdName));
    if (matches.length === 1) {
      setInputValue(matches[0] + " ");
    } else if (matches.length > 1) {
      printOutput([`$ /${inputValue}`, ...matches]);
    }
    return;
  }

  if (!commandsWithPaths.includes(cmdName)) {
    return;
  }

  // Auto-complete paths
  const pathPrefix = parts.slice(1).join(" ");

  const lastSlashIndex = pathPrefix.lastIndexOf("/");
  const dirPath =
    lastSlashIndex >= 0 ? pathPrefix.substring(0, lastSlashIndex) : ".";
  const prefix =
    lastSlashIndex >= 0 ? pathPrefix.substring(lastSlashIndex + 1) : pathPrefix;

  const resolvedPath = resolvePath(virtualPath, dirPath);

  try {
    const response = await getDirectoryEntries(resolvedPath);

    const entries = response.entries.map((e) => {
      if (e.type === "Task") {
        return e.name; // Keep SYNC-123 casing
      }
      const formattedName = e.name.toLowerCase().replace(/ /g, "-");
      return formattedName;
    });

    const matches = entries.filter((e) =>
      e.toLowerCase().startsWith(prefix.toLowerCase()),
    );

    if (matches.length === 1) {
      const completedPath =
        lastSlashIndex >= 0
          ? pathPrefix.substring(0, lastSlashIndex + 1) + matches[0]
          : matches[0];
      setInputValue(`${cmdName} ${completedPath}`);
    } else if (matches.length > 1) {
      printOutput([`$ /${inputValue}`, ...matches]);
    }
  } catch {
    // Ignore errors for auto-completion (e.g., directory not found)
  }
};
